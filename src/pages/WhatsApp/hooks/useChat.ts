import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessageDTO, type CanSendDirectResponse } from '@/api/modules/chatAPI';
import { useTemplates, useSendTemplateMessage } from './useTemplates';
import { toastUtils } from '@/lib/utils';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';
import { socketManager } from '@/lib/socket';

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
  
  // Helper function to invalidate contact queries
  const invalidateContactQueries = useCallback(() => {
    if (!projectId) return;
    queryClient.invalidateQueries({ 
      queryKey: [WABA_MESSAGE_QUERY_KEY, 'eligible-session-contacts', projectId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [WABA_MESSAGE_QUERY_KEY, 'unique-phone-numbers', projectId] 
    });
  }, [projectId, queryClient]);

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

  const sendText = useCallback(async (text: string, contactId?: string) => {
    if (!projectId || !phoneNumber || !text?.trim()) return;

    const optimisticCreatedAt = new Date().toISOString();
    const optimistic: ChatMessageDTO = {
      phoneNumber,
      textBody: text,
      direction: 'outbound',
      createdAt: optimisticCreatedAt,
      status: 'pending',
    };

    // 1. Immediately show the message in the UI
    setMessages((prev) => [...prev, optimistic]);
    invalidateContactQueries();

    try {
      // 2. Perform the actual API call
      const { id } = await chatApi.sendText({ projectId, phoneNumber, text, contactId });
      const sentAt = new Date().toISOString();

      // 3. Update the optimistic message with the real ID and 'sent' status
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id) return m; // Already has a server ID, skip
          if (m.direction !== 'outbound') return m;
          if (m.textBody !== text) return m;
          if (m.createdAt !== optimisticCreatedAt) return m;
          return { ...m, _id: id, status: 'sent', sentAt };
        })
      );

      invalidateContactQueries();
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
  }, [projectId, phoneNumber, invalidateContactQueries]);

  const sendTemplate = useCallback(async (payload: SendTemplateMessagePayload) => {
    if (!projectId || !phoneNumber) return;
    
    // Optimistic template message:
    // Template delivery is async, and `load(1)` right after API returns can happen before the message is persisted.
    // So we show a placeholder immediately, then replace it when polling fetches the real message from server.
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

    setMessages((prev) => [...prev, optimistic]);
    invalidateContactQueries();

    try {
      await sendTemplateMutation.mutateAsync(payload);
      const sentAt = new Date().toISOString();

      // Mark the optimistic placeholder as "sent" (server might still persist a bit later).
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id) return m;
          if (m.direction !== 'outbound') return m;
          if (m.templateName !== payload.templateName) return m;
          if (m.createdAt !== optimisticCreatedAt) return m;
          return { ...m, status: 'sent', sentAt };
        }),
      );

      invalidateContactQueries();
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
  }, [projectId, phoneNumber, sendTemplateMutation, invalidateContactQueries]);

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
  }, [projectId, phoneNumber, load, checkCanSendDirect]);

  // Socket connection - uses singleton socket manager
  useEffect(() => {
    const socket = socketManager.getSocket();
    
    if (!socket) return;

    // Set up message listener
    const onMessage = (evt: any) => {
      if (!evt?.phoneNumber) return;
      
      // Normalize phone numbers for comparison (handles + prefix differences)
      const normalizedEventPhone = normalizePhoneNumber(evt.phoneNumber);
      const normalizedActivePhone = normalizePhoneNumber(phoneNumber);
      const isActiveContact =
        phoneNumber && normalizedEventPhone === normalizedActivePhone;
      
      // Only update messages list for the currently active contact
      if (isActiveContact) {
        setMessages((prev) => {
          const incoming: ChatMessageDTO = {
            _id: evt._id, // Ensure ID is captured
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
          
          // Check if this message (by ID) is already in the list
          if (incoming._id && prev.some(m => String(m._id) === String(incoming._id))) {
            return prev;
          }

          // If it's an outbound message, try to find and replace an optimistic placeholder
          if (incoming.direction === 'outbound') {
            const MATCH_WINDOW_MS = 60000; // 1 minute window for socket echoes
            const optimisticIdx = prev.findIndex(m => 
              !m._id && 
              m.direction === 'outbound' && 
              m.textBody === incoming.textBody &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(incoming.createdAt).getTime()) < MATCH_WINDOW_MS
            );

            if (optimisticIdx !== -1) {
              const next = [...prev];
              next[optimisticIdx] = incoming;
              return next;
            }
          }

          // Prevent duplicate append for identical messages without IDs (very quick echoes)
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
        
        // Recheck direct message permission when new inbound message arrives
        if (evt.direction === 'inbound') {
          checkCanSendDirect();
        }
      }

      // For any inbound message (even for inactive contacts), invalidate contact queries
      if (evt.direction === 'inbound') {
        invalidateContactQueries();
      }
    };

    socket.on('chat-message', onMessage);

    // Cleanup: remove listener when contact changes (but keep socket connected)
    return () => {
      socket.off('chat-message', onMessage);
    };
  }, [phoneNumber, checkCanSendDirect, invalidateContactQueries]);

  useEffect(() => {
    if (!projectId || !phoneNumber) return;

    const POLL_INTERVAL_MS = 10000; // ~10s
    const HISTORY_LIMIT = 30; // include more recent messages for status merge
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

          // Replace by id (most reliable)
          for (const lm of latest) {
            if (!lm._id) continue;
            const id = String(lm._id);
            const existingIdx = idToIndex.get(id);
            if (existingIdx !== undefined) {
              next[existingIdx] = lm;
            }
          }

          // Replace optimistic outbound messages (no _id)
          for (const lm of latest) {
            if (!lm._id) continue;
            const id = String(lm._id);
            if (idToIndex.has(id)) continue;

            const MATCH_WINDOW_MS = 30000; // optimistic.createdAt vs server.createdAt can differ
            let targetIdx = -1;
            let bestDiff = Number.POSITIVE_INFINITY;

            const lmFormat = lm.messageFormat || 'text';
            const lmIsTemplate = lmFormat === 'template' || !!lm.templateName;

            for (let i = 0; i < next.length; i++) {
              const pm = next[i];
              if (pm._id) continue;
              if (pm.direction !== 'outbound') continue;

              // Template optimistic placeholder matching
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

              // Text/media optimistic placeholder matching (existing behavior)
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

          // Append missing messages by id
          const existingIds = new Set(next.filter((m) => m._id).map((m) => String(m._id)));
          const newMsgs = latest.filter((lm) => lm._id && !existingIds.has(String(lm._id)));
          if (newMsgs.length) {
            next.push(...newMsgs);
          }

          // Ensure chronological order (server returns ascending order, but we keep it safe)
          next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return next;
        });
      } catch (error) {
        // Polling should not break UI; just log
        console.error('Failed to poll chat history for status updates:', error);
      } finally {
        inFlight = false;
      }
    };

    // Run once immediately
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
      // clear guard once load completes
      if (lastRequestedPageRef.current === next) {
        lastRequestedPageRef.current = null;
      }
    });
  }, [hasMore, loading, page, load]);

  return { 
    messages, 
    loading, 
    hasMore, 
    loadMore, 
    sendText, 
    sendTemplate,
    templates,
    canSendDirect,
    checkCanSendDirect,
    sendTemplateMutation
  };
}


