import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';
import type { ChatMessageDTO } from '@/api/modules/chatAPI';
import { toastUtils } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

// Import modular components
import { ChatHeader } from './ChatHeader';
import { MessagesList } from './MessagesList';
import { TemplateForm } from './TemplateForm';
import { SessionTemplateForm } from './SessionTemplateForm';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';

export interface Contact {
  _id?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export interface ChatWindowProps {
  projectId: string;
  activeContact: string | undefined;
  contact?: Contact;
  disabled?: boolean;
  emptyState?: {
    title: string;
    description: string;
  };
  className?: string;
  onMessageSent?: (message: ChatMessageDTO) => void;
  onTemplateSent?: (payload: SendTemplateMessagePayload) => void;
  onInboundMessage?: (message: ChatMessageDTO) => void;
  headerActions?: React.ReactNode;
  onBack?: () => void;
}

export function ChatWindow({
  projectId,
  activeContact,
  contact,
  disabled = false,
  emptyState = {
    title: "Select a contact to start chatting",
    description: "Choose a contact from the sidebar to view your conversation"
  },
  className = "",
  onMessageSent,
  onTemplateSent,
  onInboundMessage,
  headerActions,
  onBack
}: ChatWindowProps) {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const {
    messages,
    sendText,
    sendTemplate,
    loadMore,
    hasMore,
    loading,
    templates,
    quickReplies,
    canSendDirect,
    sendTemplateMutation
  } = useChat(projectId, activeContact);

  const {
    data: mediaAssetsData,
    isLoading: mediaAssetsLoading,
    error: mediaAssetsError
  } = useMediaAssets({
    projectId: showTemplateForm ? projectId : '',
    page: 1,
    limit: 50,
  });

  const handleTemplateSubmit = useCallback(async (payload: SendTemplateMessagePayload) => {
    if (!projectId || !activeContact) return;

    const fullPayload = { ...payload, projectId, recipientPhoneNumber: activeContact };

    try {
      await sendTemplate(fullPayload);
      setShowTemplateForm(false);
      onTemplateSent?.(fullPayload);
    } catch (error) {
      console.error('Failed to send template:', error);
      toastUtils.error('Failed to send template message');
    }
  }, [projectId, activeContact, sendTemplate, onTemplateSent]);

  const handleSendText = useCallback(async (text: string, components?: any[]) => {
    if (!activeContact || !projectId) return;

    try {
      await sendText(text, components as any);
      const message: ChatMessageDTO = {
        phoneNumber: activeContact,
        textBody: text,
        direction: 'outbound',
        createdAt: new Date().toISOString(),
      };
      onMessageSent?.(message);
    } catch (error) {
      console.error('Failed to send text message:', error);
      toastUtils.error('Failed to send message');
    }
  }, [activeContact, projectId, sendText, onMessageSent]);

  useEffect(() => {
    setShowTemplateForm(false);
    setShowSessionForm(false);
  }, [activeContact]);

  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (!onInboundMessage || messages.length === 0) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      const newMessages = messages.slice(prevMessagesLengthRef.current);
      const inboundMessages = newMessages.filter((msg) => msg.direction === 'inbound');
      inboundMessages.forEach((message) => {
        onInboundMessage(message);
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, onInboundMessage]);

  const getContactDisplayName = () => {
    if (!activeContact) return '';
    if (contact) {
      const first = contact.firstName?.trim();
      const last = contact.lastName?.trim();
      const full = [first, last].filter(Boolean).join(' ').trim();
      if (full) return full;
    }
    return activeContact;
  };

  if (!activeContact) {
    return (
      <div className={`flex-1 flex flex-col h-full ${className}`}>
        <EmptyState title={emptyState.title} description={emptyState.description} />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full min-h-0 bg-[#f8fafc] relative animate-in fade-in duration-500 ${className}`}>
      <div className="flex-shrink-0 z-20">
        <ChatHeader
          contactName={getContactDisplayName()}
          contactPhone={activeContact}
          canSendDirect={canSendDirect}
          actions={headerActions}
          onBack={onBack}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative bg-[#efeae2] dark:bg-[#0b141a]">
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.04] pointer-events-none bg-repeat bg-[url('/whatsapp-bg.png')] z-0"
          style={{ backgroundSize: '400px' }}
        ></div>
        <div className="relative z-10 h-full">
          <MessagesList
            messages={messages}
            templates={templates}
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            contact={activeContact}
            contactName={getContactDisplayName()}
            projectId={projectId}
          />
        </div>

        {showTemplateForm && (
          <div className="absolute bottom-0 left-0 right-0 max-h-full bg-white dark:bg-[#111b21] z-50 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 shadow-[0_-12px_40px_rgba(0,0,0,0.3)] border-t border-gray-100 dark:border-slate-800">
            <TemplateForm
              templates={templates}
              mediaAssetsData={mediaAssetsData}
              mediaAssetsLoading={mediaAssetsLoading}
              mediaAssetsError={mediaAssetsError}
              onTemplateSubmit={handleTemplateSubmit}
              onCancel={() => setShowTemplateForm(false)}
              isSubmitting={sendTemplateMutation.isPending}
            />
          </div>
        )}

        {showSessionForm && (
          <div className="absolute bottom-0 left-0 right-0 max-h-full bg-white dark:bg-[#111b21] z-50 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 shadow-[0_-12px_40px_rgba(0,0,0,0.3)] border-t border-gray-100 dark:border-slate-800">
            <SessionTemplateForm
              quickReplies={quickReplies}
              mediaAssetsData={mediaAssetsData}
              mediaAssetsLoading={mediaAssetsLoading}
              mediaAssetsError={mediaAssetsError}
              onSend={async (text, components) => {
                await handleSendText(text, components);
                setShowSessionForm(false);
              }}
              onCancel={() => setShowSessionForm(false)}
              isSubmitting={false}
            />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 mt-auto z-30 relative shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <ChatInput
          disabled={disabled || !activeContact}
          canSendDirect={canSendDirect?.canSend ?? false}
          onSend={handleSendText}
          onShowTemplate={() => {
            setShowTemplateForm(!showTemplateForm);
            setShowSessionForm(false);
          }}
          onShowSessionTemplate={() => {
            setShowSessionForm(!showSessionForm);
            setShowTemplateForm(false);
          }}
          quickReplies={quickReplies}
        />
      </div>
    </div>
  );
}