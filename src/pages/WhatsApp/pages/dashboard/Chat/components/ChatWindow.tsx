import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import { wabaMessageApi } from '@/api/modules/wabaMessageAPI';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';
import type { ChatMessageDTO } from '@/api/modules/chatAPI';
import { toastUtils } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

// Import modular components
import { ChatHeader } from './ChatHeader';
import { MessagesList } from './MessagesList';
import { TemplateForm } from './TemplateForm';
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
  /** The selected project ID */
  projectId: string;
  /** The active contact/phone number */
  activeContact: string | undefined;
  /** Optional full contact object for richer header rendering */
  contact?: Contact;
  /** Whether the chat window is disabled */
  disabled?: boolean;
  /** Custom empty state configuration */
  emptyState?: {
    title: string;
    description: string;
  };
  /** Custom class names for styling */
  className?: string;
  /** Callback when a message is sent */
  onMessageSent?: (message: ChatMessageDTO) => void;
  /** Callback when template is sent */
  onTemplateSent?: (payload: SendTemplateMessagePayload) => void;
  /** Callback when an inbound message is received */
  onInboundMessage?: (message: ChatMessageDTO) => void;
  /** Custom header actions */
  headerActions?: React.ReactNode;
  /** Callback to go back to contact list (mobile only) */
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

  const {
    messages,
    sendText,
    sendTemplate,
    loadMore,
    hasMore,
    loading,
    templates,
    canSendDirect,
    sendTemplateMutation
  } = useChat(projectId, activeContact);


  // Fetch media assets for template headers
  // Lazy load media assets only when template form is visible
  const {
    data: mediaAssetsData,
    isLoading: mediaAssetsLoading,
    error: mediaAssetsError
  } = useMediaAssets({
    projectId: showTemplateForm ? projectId : '',
    page: 1,
    limit: 50,
  });

  // Handle template form submission
  const handleTemplateSubmit = useCallback(async (payload: SendTemplateMessagePayload) => {
    if (!projectId || !activeContact) return;

    const fullPayload = {
      ...payload,
      projectId,
      recipientPhoneNumber: activeContact,
    };

    try {
      await sendTemplate(fullPayload);
      setShowTemplateForm(false);
      onTemplateSent?.(fullPayload);
    } catch (error) {
      console.error('Failed to send template:', error);
      toastUtils.error('Failed to send template message');
    }
  }, [projectId, activeContact, sendTemplate, onTemplateSent]);

  // Handle text message sending
  const handleSendText = useCallback(async (text: string) => {
    if (!activeContact || !projectId) return;

    try {
      await sendText(text);
      // Create a message object for the callback
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

  // Reset template form when switching contacts
  useEffect(() => {
    setShowTemplateForm(false);
  }, [activeContact]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (activeContact && projectId) {
      wabaMessageApi.markAsRead(projectId, activeContact).catch((error) => {
        console.error('Failed to mark messages as read:', error);
        // Don't show error toast - this is a background operation
      });
    }
  }, [activeContact, projectId]);

  // Track inbound messages and notify via callback
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (!onInboundMessage || messages.length === 0) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    // Check for new inbound messages since last render
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessages = messages.slice(prevMessagesLengthRef.current);
      const inboundMessages = newMessages.filter(
        (msg) => msg.direction === 'inbound'
      );

      // Notify about each new inbound message
      inboundMessages.forEach((message) => {
        onInboundMessage(message);
      });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, onInboundMessage]);

  // Get contact display name
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
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
        />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full min-h-0 bg-[#f8fafc] relative animate-in fade-in duration-500 ${className}`}>
      {/* Chat Header - Fixed at top */}
      <div className="flex-shrink-0 z-20">
        <ChatHeader
          contactName={getContactDisplayName()}
          contactPhone={activeContact}
          canSendDirect={canSendDirect}
          actions={headerActions}
          onBack={onBack}
        />
      </div>

      {/* Messages List - Scrollable area with custom background pattern */}
      <div className="flex-1 min-h-0 overflow-hidden relative bg-[#f8fafc]">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none bg-repeat bg-[url('/whatsapp-bg.png')] z-0"
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
            projectId={projectId}
          />
        </div>

        {/* Template Form - Bottom-anchored overlay (grows up to header, then scrolls) */}
        {showTemplateForm && (
          <div className="absolute bottom-0 left-0 right-0 max-h-full bg-white z-50 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] border-t border-gray-100">
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
      </div>

      {/* Chat Footer - Contains Chat Input */}
      <div className="flex-shrink-0 mt-auto z-30 relative shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <ChatInput
          disabled={disabled || !activeContact}
          canSendDirect={canSendDirect?.canSend ?? false}
          onSend={handleSendText}
          onShowTemplate={() => setShowTemplateForm(!showTemplateForm)}
        />
      </div>
    </div>
  );
}
