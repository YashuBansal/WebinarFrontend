import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessageDTO, type CanSendDirectResponse } from '@/api/modules/chatAPI';
import { useTemplates, useSendTemplateMessage } from './useTemplates';
import { toastUtils } from '@/lib/utils';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';
import { socketManager } from '@/lib/socket';
import { useQuickReplies } from './useQuickReplies';
import { wabaMessageApi } from '@/api/modules/wabaMessageAPI';

// Query key constant for invalidating waba message queries
const WABA_MESSAGE_QUERY_KEY = 'wabaMessage';

// Normalize phone number for comparison (remove + and leading zeros)
const normalizePhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return '';
  return phone.replace(/^\+/, '').replace(/^0+/, '');
};

export function useChat(projectId: string | undefined, phoneNumber: string | undefined) {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [canSendDirect, setCanSendDirect] = useState<CanSendDirectResponse | null>(null);
  const lastRequestedPageRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch templates for template message rendering
  const { data: templatesData } = useTemplates(projectId || '', { status: 'APPROVED' });
  const templates = templatesData?.data || [];

  // Template sending mutation
  const sendTemplateMutation = useSendTemplateMessage();

  // Fetch quick replies (session templates)
  const { quickReplies, isLoading: isQuickRepliesLoading } = useQuickReplies(projectId || '');

  // 🚀 NAYA FUNCTION: Jo Sidebar ko instantly (0ms delay) cache ke through update karega
  const syncSidebarInstantly = useCallback((msgUpdate?: Partial<ChatMessageDTO>, bringToTop: boolean = false) => {
    if (!projectId) return;

    // Agar message data pass kiya hai, toh turant sidebar cache update karo
    if (msgUpdate) {
      const updateCache = (queryKey: any[], listKey: string) => {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData[listKey]) return oldData;

          const newList = [...oldData[listKey]];
          const targetPhone = msgUpdate.phoneNumber || phoneNumber;

          const idx = newList.findIndex((c: any) =>
            (typeof c === 'string' ? c : c.phoneNumber) === targetPhone
          );

          if (idx !== -1) {
            const item = typeof newList[idx] === 'string' ? { phoneNumber: newList[idx] } : { ...newList[idx] };

            // Preview text decide karo
            let preview = item.lastMessagePreview;
            if (msgUpdate.textBody) preview = msgUpdate.textBody;
            else if (msgUpdate.messageFormat === 'template') preview = 'Template Message';
            else if (msgUpdate.messageFormat === 'media') preview = 'Media Message';

            newList[idx] = {
              ...item,
              ...(msgUpdate.status && { lastMessageStatus: msgUpdate.status }),
              ...(preview && { lastMessagePreview: preview }),
              ...(msgUpdate.createdAt && { lastMessageAt: msgUpdate.createdAt }),
              ...(msgUpdate.direction && { lastMessageDirection: msgUpdate.direction }),
            };

            // Naya message bheja hai ya aaya hai toh contact ko list ke sabse upar laao
            if (bringToTop) {
              const [updated] = newList.splice(idx, 1);
              newList.unshift(updated);
            }
          }
          return { ...oldData, [listKey]: newList };
        });
      };

      updateCache([WABA_MESSAGE_QUERY_KEY, 'unique-phone-numbers', projectId], 'phoneNumbers');
      updateCache([WABA_MESSAGE_QUERY_KEY, 'eligible-session-contacts', projectId], 'eligibleContacts');
    }

    // Background mein server se actual sync rakhne ke liye invalidate bhi call kardo (network request)
    queryClient.invalidateQueries({ queryKey: [WABA_MESSAGE_QUERY_KEY, 'unique-phone-numbers', projectId] });
    queryClient.invalidateQueries({ queryKey: [WABA_MESSAGE_QUERY_KEY, 'eligible-session-contacts', projectId] });
  }, [projectId, phoneNumber, queryClient]);

  const load = useCallback(async (nextPage?: number) => {
    if (!projectId || !phoneNumber) return;
    setLoading(true);
    try {
      const res = await chatApi.getHistory(projectId, phoneNumber, nextPage || 1, 10);
      if (nextPage && nextPage > 1) {
        setMessages((prev) => [...res.messages, ...prev]);
      } else {
        setMessages(res.messages);
      }
      setHasMore(res.page < res.totalPages);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  }, [projectId, phoneNumber]);

  const sendText = useCallback(async (text: string, components?: any[], contactId?: string) => {
    if (!projectId || !phoneNumber || !text?.trim()) return;

    const optimisticCreatedAt = new Date().toISOString();
    const optimistic: ChatMessageDTO = {
      phoneNumber,
      textBody: text,
      direction: 'outbound',
      createdAt: optimisticCreatedAt,
      status: 'pending',
      messageFormat: components && components.length > 0 ? 'template' : 'text',
      templateComponents: components,
    };

    // 1. Immediately show the message in the UI aur Sidebar Instantly Update karein
    setMessages((prev) => [...prev, optimistic]);
    syncSidebarInstantly(optimistic, true);

    try {
      // 2. Perform the actual API call
      const { id } = await chatApi.sendText({ projectId, phoneNumber, text, components, contactId });
      const sentAt = new Date().toISOString();

      // 3. Update the optimistic message with the real ID and 'sent' status
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id) return m;
          if (m.direction !== 'outbound') return m;
          if (m.textBody !== text) return m;
          if (m.createdAt !== optimisticCreatedAt) return m;
          return { ...m, _id: id, status: 'sent', sentAt };
        })
      );

      // Call markAsRead after sending succeeds and update Sidebar to 'sent'
      wabaMessageApi.markAsRead(projectId, phoneNumber)
        .then(() => syncSidebarInstantly({ status: 'sent', createdAt: sentAt }, false))
        .catch((err) => console.error('Failed to mark read after sendText:', err));

      syncSidebarInstantly();
      return id;
    } catch (error) {
      console.error('Failed to send text message:', error);
      const failureReason = 'Failed to send message';

      // Update message to show failure
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id) return m;
          if (m.direction !== 'outbound') return m;
          if (m.textBody !== text) return m;
          if (m.createdAt !== optimisticCreatedAt) return m;
          return { ...m, status: 'failed', failureReason };
        })
      );

      toastUtils.error('Failed to send message');
      throw error;
    }
  }, [projectId, phoneNumber, syncSidebarInstantly]);

  const sendTemplate = useCallback(async (payload: SendTemplateMessagePayload) => {
    if (!projectId || !phoneNumber) return;

    const optimisticCreatedAt = new Date().toISOString();
    const bodyVariables = payload.bodyVariables ?? [];

    const optimistic: ChatMessageDTO = {
      phoneNumber,
      direction: 'outbound',
      createdAt: optimisticCreatedAt,
      messageFormat: 'template',
      templateName: payload.templateName,
      templateLanguage: payload.language,
      templateComponents:
        bodyVariables.length > 0
          ? [
            {
              type: 'body',
              parameters: bodyVariables.map((v) => ({ type: 'text', text: v })),
            },
          ]
          : [],
      status: 'pending',
    };

    // UI aur Sidebar Instantly Update karein
    setMessages((prev) => [...prev, optimistic]);
    syncSidebarInstantly(optimistic, true);

    try {
      await sendTemplateMutation.mutateAsync(payload);
      const sentAt = new Date().toISOString();

      setMessages((prev) =>
        prev.map((m) => {
          if (m._id) return m;
          if (m.direction !== 'outbound') return m;
          if (m.templateName !== payload.templateName) return m;
          if (m.createdAt !== optimisticCreatedAt) return m;
          return { ...m, status: 'sent', sentAt };
        }),
      );

      wabaMessageApi.markAsRead(projectId, phoneNumber)
        .then(() => syncSidebarInstantly({ status: 'sent', createdAt: sentAt }, false))
        .catch((err) => console.error('Failed to mark read after sendTemplate:', err));

      syncSidebarInstantly();
    } catch (error) {
      console.error('Failed to send template:', error);
      const failureReason = 'Failed to send template message';
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id) return m;
          if (m.direction !== 'outbound') return m;
          if (m.templateName !== payload.templateName) return m;
          if (m.createdAt !== optimisticCreatedAt) return m;
          return { ...m, status: 'failed', failureReason };
        }),
      );
      toastUtils.error('Failed to send template message');
    }
  }, [projectId, phoneNumber, sendTemplateMutation, syncSidebarInstantly]);

  const checkCanSendDirect = useCallback(async () => {
    if (!projectId || !phoneNumber) return;

    try {
      const result = await chatApi.canSendDirect(projectId, phoneNumber);
      setCanSendDirect(result);
    } catch (error) {
      console.error('Failed to check direct message permission:', error);
      setCanSendDirect({ canSend: false, reason: 'Error checking message window' });
    }
  }, [projectId, phoneNumber]);

  useEffect(() => {
    if (!projectId || !phoneNumber) return;
    load(1);
    checkCanSendDirect();
    wabaMessageApi.markAsRead(projectId, phoneNumber)
      .then(() => syncSidebarInstantly())
      .catch((err) => console.error('Failed to mark messages as read on open:', err));
  }, [projectId, phoneNumber, load, checkCanSendDirect, syncSidebarInstantly]);

  // Socket connection - uses singleton socket manager
  useEffect(() => {
    const socket = socketManager.getSocket();

    if (!socket) return;

    // Set up message listener
    const onMessage = (evt: any) => {
      if (!evt?.phoneNumber) return;

      const normalizedEventPhone = normalizePhoneNumber(evt.phoneNumber);
      const normalizedActivePhone = normalizePhoneNumber(phoneNumber);
      const isActiveContact = phoneNumber && normalizedEventPhone === normalizedActivePhone;

      if (isActiveContact) {
        setMessages((prev) => {
          const incoming: ChatMessageDTO = {
            _id: evt._id,
            phoneNumber: evt.phoneNumber,
            textBody: evt.textBody,
            direction: evt.direction as ChatMessageDTO['direction'],
            createdAt: evt.createdAt || new Date().toISOString(),
            messageFormat: evt.messageFormat || 'text',
            templateName: evt.templateName,
            templateLanguage: evt.templateLanguage,
            templateComponents: evt.templateComponents,
            displayText: evt.displayText || evt.textBody,
            mimeType: evt.mimeType,
            mediaUrl: evt.mediaUrl,
            status: evt.status,
          };

          if (incoming._id && prev.some(m => String(m._id) === String(incoming._id))) {
            return prev.map(m => String(m._id) === String(incoming._id) ? { ...m, ...incoming } : m);
          }

          if (incoming.direction === 'outbound') {
            const MATCH_WINDOW_MS = 60000;

            const optimisticIdx = prev.findIndex(m => {
              if (m.direction !== 'outbound') return false;
              const withinWindow = Math.abs(
                new Date(m.createdAt).getTime() - new Date(incoming.createdAt).getTime()
              ) < MATCH_WINDOW_MS;
              if (!withinWindow) return false;

              // 1. Agar IDs directly match kar jayein (Perfect scenario)
              if (m._id && incoming._id && String(m._id) === String(incoming._id)) return true;

              // 2. TEXT MATCH FALLBACK
              if (m.textBody && incoming.textBody && m.textBody === incoming.textBody) return true;

              // For template messages
              if (!m._id && m.messageFormat === 'template' && incoming.messageFormat === 'template') {
                const mBody = m.templateComponents?.find((c: any) => c.type === 'BODY')?.text;
                const iBody = incoming.templateComponents?.find((c: any) => c.type === 'BODY')?.text;
                if (mBody && iBody && mBody === iBody) return true;
              }

              return false;
            });

            if (optimisticIdx !== -1) {
              const next = [...prev];
              next[optimisticIdx] = { ...prev[optimisticIdx], ...incoming };
              return next;
            }
          }

          const last = prev[prev.length - 1];
          if (
            last &&
            last.direction === incoming.direction &&
            last.textBody === incoming.textBody &&
            Math.abs(new Date(incoming.createdAt).getTime() - new Date(last.createdAt).getTime()) < 3000
          ) {
            return prev;
          }

          return [...prev, incoming];
        });

        if (evt.direction === 'inbound') {
          checkCanSendDirect();

          if (projectId && phoneNumber) {
            wabaMessageApi.markAsRead(projectId, phoneNumber)
              .then(() => syncSidebarInstantly({ status: 'read' }, false))
              .catch((err) => console.error('Failed to mark incoming as read:', err));
          }
        }
      }

      // Naya incoming message kisi bhi contact ka ho, turant sidebar mein top pe push kardo
      if (evt.direction === 'inbound') {
        syncSidebarInstantly(evt, true);
      }
    };

    socket.on('chat-message', onMessage);

    return () => {
      socket.off('chat-message', onMessage);
    };
  }, [phoneNumber, checkCanSendDirect, syncSidebarInstantly, projectId]);

  useEffect(() => {
    if (!projectId || !phoneNumber) return;

    const POLL_INTERVAL_MS = 10000;
    const HISTORY_LIMIT = 30;
    let inFlight = false;

    const pollLatest = async () => {
      if (loading || inFlight) return;
      inFlight = true;
      try {
        const res = await chatApi.getHistory(projectId, phoneNumber, 1, HISTORY_LIMIT);
        const latest = res.messages;

        setMessages((prev) => {
          if (latest.length === 0) return prev;

          const next = prev.slice();
          const idToIndex = new Map<string, number>();
          next.forEach((msg, idx) => {
            if (msg._id) idToIndex.set(String(msg._id), idx);
          });

          for (const lm of latest) {
            if (!lm._id) continue;
            const id = String(lm._id);
            const existingIdx = idToIndex.get(id);
            if (existingIdx !== undefined) {
              next[existingIdx] = lm;
            }
          }

          for (const lm of latest) {
            if (!lm._id) continue;
            const id = String(lm._id);
            if (idToIndex.has(id)) continue;

            const MATCH_WINDOW_MS = 30000;
            let targetIdx = -1;
            let bestDiff = Number.POSITIVE_INFINITY;

            const lmFormat = lm.messageFormat || 'text';
            const lmIsTemplate = lmFormat === 'template' || !!lm.templateName;

            for (let i = 0; i < next.length; i++) {
              const pm = next[i];

              if (pm.direction !== 'outbound') continue;
              if (pm._id && String(pm._id) === id) continue;

              if (lmIsTemplate) {
                if (pm.messageFormat !== 'template') continue;
                if (pm.templateName !== lm.templateName) continue;
                const pmTime = new Date(pm.createdAt).getTime();
                const lmTime = new Date(lm.createdAt).getTime();
                const diff = Math.abs(pmTime - lmTime);
                if (diff < MATCH_WINDOW_MS && diff < bestDiff) {
                  bestDiff = diff;
                  targetIdx = i;
                }
                continue;
              }

              if (!pm.textBody) continue;
              if (!lm.textBody) continue;
              if (pm.textBody !== lm.textBody) continue;

              const pmTime = new Date(pm.createdAt).getTime();
              const lmTime = new Date(lm.createdAt).getTime();
              const diff = Math.abs(pmTime - lmTime);
              if (diff < MATCH_WINDOW_MS && diff < bestDiff) {
                bestDiff = diff;
                targetIdx = i;
              }
            }

            if (targetIdx !== -1) {
              next[targetIdx] = lm;
              idToIndex.set(id, targetIdx);
            }
          }

          const existingIds = new Set(next.filter((m) => m._id).map((m) => String(m._id)));
          const newMsgs = latest.filter((lm) => lm._id && !existingIds.has(String(lm._id)));
          if (newMsgs.length) {
            next.push(...newMsgs);
          }

          next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return next;
        });
      } catch (error) {
        console.error('Failed to poll chat history for status updates:', error);
      } finally {
        inFlight = false;
      }
    };

    pollLatest();

    const intervalId = setInterval(pollLatest, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [projectId, phoneNumber, loading]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const next = page + 1;
    if (lastRequestedPageRef.current === next) return;
    lastRequestedPageRef.current = next;
    return load(next).finally(() => {
      if (lastRequestedPageRef.current === next) {
        lastRequestedPageRef.current = null;
      }
    });
  }, [hasMore, loading, page, load]);

  // MASTER SYNC EFFECT: 
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];

      syncSidebarInstantly({
        phoneNumber: lastMsg.phoneNumber,
        status: lastMsg.status,
        textBody: lastMsg.textBody,
        createdAt: lastMsg.createdAt,
        direction: lastMsg.direction,
        messageFormat: lastMsg.messageFormat
      }, false);
    }
  }, [messages, syncSidebarInstantly]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    sendText,
    sendTemplate,
    templates,
    quickReplies,
    isQuickRepliesLoading,
    canSendDirect,
    checkCanSendDirect,
    sendTemplateMutation
  };
}