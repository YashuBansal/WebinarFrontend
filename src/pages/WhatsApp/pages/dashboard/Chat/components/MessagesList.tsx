import { useEffect, useLayoutEffect, useRef } from 'react';
import { Image, Video } from 'lucide-react';
import { TemplateMessageRenderer } from './TemplateMessageRenderer';

interface Message {
  _id?: string;
  phoneNumber: string;
  textBody?: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
  // WhatsApp/WABA delivery lifecycle for outbound messages
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'clicked' | string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
  messageFormat?: 'text' | 'template' | 'media';
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  displayText?: string;
  mimeType?: string;
  mediaUrl?: string;
}


interface MessagesListProps {
  messages: Message[];
  templates: any[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  contact?: string | undefined;
  className?: string;
  projectId?: string;
}

export function MessagesList({ 
  messages, 
  templates, 
  hasMore, 
  loading, 
  onLoadMore,
  contact,
  className = "",
  projectId
}: MessagesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get proxy URL for media
  const getMediaProxyUrl = (mediaUrl?: string): string => {
    if (!projectId || !mediaUrl) return mediaUrl || '';
    const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL || '';
    const proxyUrl = `${apiBaseUrl}/whatsapp/media-proxy?url=${encodeURIComponent(mediaUrl)}&projectId=${projectId}`;
    return proxyUrl;
  };
  const isInitialLoadRef = useRef(true);
  const lastContactRef = useRef<string | undefined>(contact);
  const prevMessagesLengthRef = useRef(messages.length);
  const scrollPositionRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const pendingScrollToBottomRef = useRef(false);

  // Detect contact change and mark for scroll to bottom (don't touch scroll yet)
  useEffect(() => {
    const contactChanged = lastContactRef.current !== contact;
    if (contactChanged) {
      lastContactRef.current = contact;
      isInitialLoadRef.current = true;
      prevMessagesLengthRef.current = 0;
      scrollPositionRef.current = null;
      pendingScrollToBottomRef.current = true;
      // DON'T reset scroll here - it causes flash. Wait for messages to load.
    }
  }, [contact]);

  // Track when loading starts to save scroll position (only for loadMore, not initial load)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || pendingScrollToBottomRef.current) return;

    // When loading starts and we're not at bottom, save current scroll position
    if (loading && !isInitialLoadRef.current && messages.length > 0) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
      if (!isAtBottom) {
        scrollPositionRef.current = {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
        };
      }
    }
  }, [loading, messages.length]);

  // Restore scroll position after loading more messages at top (pre-paint)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !scrollPositionRef.current || pendingScrollToBottomRef.current) return;

    // Loading finished and messages increased (old messages were prepended)
    if (!loading && messages.length > prevMessagesLengthRef.current) {
      const prevState = scrollPositionRef.current;
      const heightDiff = container.scrollHeight - prevState.scrollHeight;
      
      // Adjust scroll position to maintain visual position
      if (heightDiff > 0) {
        container.scrollTop = prevState.scrollTop + heightDiff;
      }
      
      scrollPositionRef.current = null;
      prevMessagesLengthRef.current = messages.length;
    } else if (!loading) {
      prevMessagesLengthRef.current = messages.length;
    }
  }, [loading, messages.length]);

  // Scroll to bottom when contact changes or initial load - MUST be in useLayoutEffect (before paint, no flash)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Scroll to bottom when:
    // 1. Contact changed (pendingScrollToBottomRef is true)
    // 2. Or initial load (isInitialLoadRef is true)
    // After messages are ready and not loading
    if ((pendingScrollToBottomRef.current || isInitialLoadRef.current) && !loading && messages.length > 0) {
      const currentScrollHeight = container.scrollHeight;
      if (currentScrollHeight > 0) {
        container.scrollTop = currentScrollHeight;
        pendingScrollToBottomRef.current = false;
        isInitialLoadRef.current = false;
        prevMessagesLengthRef.current = messages.length;
      }
    }
  }, [messages, loading]);

  // Scroll to bottom when new messages arrive (but not when loading more at top)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loading || pendingScrollToBottomRef.current || isInitialLoadRef.current) return;

    // Check if a new message was added to the end
    const scrollToBottom = () => {
      // Only auto-scroll if user is near the bottom (within 100px)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Delay to ensure message is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, loading]);

  const formatMessageTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  const getOutboundStatusLabel = (message: Message): string => {
    // Prefer explicit status if backend provides it
    switch (message.status) {
      case 'failed':
        return 'Failed';
      case 'read':
        return 'Read';
      case 'delivered':
        return 'Delivered';
      case 'sent':
        return 'Sent';
      case 'pending':
        return 'Pending/Sending';
      case 'clicked':
        return 'Clicked';
      default:
        break;
    }

    // Fallback to timestamps (useful for optimistic UI or partial payloads)
    if (message.readAt) return 'Read';
    if (message.deliveredAt) return 'Delivered';
    if (message.sentAt) return 'Sent';
    return 'Pending/Sending';
  };

  return (
    <div 
      ref={scrollContainerRef}
      className={`h-full overflow-y-auto p-4 space-y-3 bg-gray-50 ${className}`} 
      role="log" 
      aria-label="Chat messages"
    >
      {/* Load More Button at Top */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <button 
            className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors" 
            onClick={onLoadMore} 
            disabled={loading}
            aria-label="Load older messages"
          >
            {loading ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}
      
      {/* Messages */}
      {messages.length === 0 && !loading ? (
        <div className="flex justify-center items-center h-32 text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No messages yet</div>
            <div className="text-sm">Start the conversation by sending a message</div>
          </div>
        </div>
      ) : (
        messages.map((message, idx) => (
          <div 
            key={message._id || idx} 
            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            role="article"
            aria-label={`${message.direction} message`}
          >
            <div className={`max-w-[70%] ${message.direction === 'outbound' ? 'bg-blue-500 text-white' : 'bg-white border'} rounded-2xl px-4 py-2 shadow-sm`}> 
              {/* Message content */}
              <div className="text-sm break-words">
                {message.messageFormat === 'template' ? (
                  <TemplateMessageRenderer message={message} templates={templates} />
                ) : message.messageFormat === 'media' ? (
                  <div className="space-y-2">
                    {message.mediaUrl ? (
                      <>
                        {message.mimeType?.startsWith('image/') ? (
                          <img
                            src={getMediaProxyUrl(message.mediaUrl)}
                            alt={message.textBody || 'Image'}
                            className="max-w-full rounded-lg object-contain"
                            style={{ maxHeight: '300px' }}
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : message.mimeType?.startsWith('video/') ? (
                          <video
                            src={getMediaProxyUrl(message.mediaUrl)}
                            controls
                            className="max-w-full rounded-lg"
                            style={{ maxHeight: '300px' }}
                            onError={(e) => {
                              // Fallback to icon if video fails to load
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {/* Fallback icon display (hidden by default, shown on error) */}
                        <div className="flex items-start gap-2" style={{ display: message.mediaUrl ? 'none' : 'flex' }}>
                          {message.mimeType?.startsWith('image/') ? (
                            <Image className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          ) : message.mimeType?.startsWith('video/') ? (
                            <Video className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Image className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            {message.textBody || message.displayText || (message.mimeType?.startsWith('image/') ? '[Image]' : '[Video]')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2">
                        {message.mimeType?.startsWith('image/') ? (
                          <Image className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : message.mimeType?.startsWith('video/') ? (
                          <Video className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Image className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          {message.textBody || message.displayText || (message.mimeType?.startsWith('image/') ? '[Image]' : '[Video]')}
                        </div>
                      </div>
                    )}
                    {/* Show caption if available and different from placeholder */}
                    {message.textBody && 
                     message.textBody !== '[Image]' && 
                     message.textBody !== '[Video]' && 
                     message.mediaUrl && (
                      <div className="text-sm mt-2">
                        {message.textBody}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{message.textBody || message.displayText}</div>
                )}
              </div>
              
              {/* Message timestamp */}
              <div className={`text-xs mt-1 ${message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatMessageTime(message.createdAt)}
              </div>

              {/* Message status (outbound only) */}
              {message.direction === 'outbound' && (
                <div className="text-[11px] mt-0.5 text-blue-200">
                  {getOutboundStatusLabel(message)}
                </div>
              )}
            </div>
          </div>
        ))
      )}
      
      {/* Loading indicator */}
      {loading && messages.length === 0 && (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      )}
    </div>
  );
}
