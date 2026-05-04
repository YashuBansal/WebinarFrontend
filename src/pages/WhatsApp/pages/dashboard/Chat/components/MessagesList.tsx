import { useEffect, useLayoutEffect, useRef } from 'react';
import { Image, Video, Check, CheckCheck, Clock } from 'lucide-react';
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };


  return (
    <div
      ref={scrollContainerRef}
      className={`h-full overflow-y-auto custom-scrollbar p-4 space-y-3 bg-transparent ${className}`}
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
        messages.map((message, idx) => {
          // Check if we should show a date separator
          const messageDate = new Date(message.createdAt).toDateString();
          const prevMessageDate = idx > 0 ? new Date(messages[idx - 1].createdAt).toDateString() : null;
          const showDateSeparator = messageDate !== prevMessageDate;

          const getDateLabel = (dateStr: string) => {
            const date = new Date(dateStr);
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            if (date.toDateString() === now.toDateString()) {
              return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
              return 'Yesterday';
            } else {
              return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
            }
          };

          return (
            <div key={message._id || idx} className="space-y-3">
              {showDateSeparator && (
                <div className="flex justify-center my-4 sticky top-2 z-10">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[11px] font-bold text-gray-500 shadow-sm border border-gray-100 uppercase tracking-wider">
                    {getDateLabel(message.createdAt)}
                  </div>
                </div>
              )}
              
              <div
                className={`flex flex-col ${message.direction === 'outbound' ? 'items-end' : 'items-start'}`}
                role="article"
                aria-label={`${message.direction} message`}
              >
                {/* Bubble with Entrance Animation */}
                <div 
                  className={`max-w-[75%] px-4 py-2.5 shadow-sm animate-in fade-in zoom-in-95 duration-500 fill-mode-both ${
                    message.direction === 'outbound' 
                      ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm slide-in-from-right-4' 
                      : 'bg-white border border-slate-100 text-gray-800 rounded-2xl rounded-tl-sm slide-in-from-left-4'
                  }`}
                  style={{ animationDelay: `${(messages.length - 1 - idx) < 10 ? (messages.length - 1 - idx) * 30 : 0}ms` }}
                >
                  {/* Message content */}
                  <div className="text-[14.5px] leading-relaxed break-words">
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
                              <div className="flex-1 text-inherit">
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
                            <div className="flex-1 text-inherit">
                              {message.textBody || message.displayText || (message.mimeType?.startsWith('image/') ? '[Image]' : '[Video]')}
                            </div>
                          </div>
                        )}
                        {/* Show caption if available and different from placeholder */}
                        {message.textBody &&
                          message.textBody !== '[Image]' &&
                          message.textBody !== '[Video]' &&
                          message.mediaUrl && (
                            <div className="text-sm mt-2 text-inherit opacity-90">
                              {message.textBody}
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.textBody || message.displayText}</div>
                    )}
                  </div>
                </div>

                {/* Footer outside: Time + Status (outbound only) */}
                <div className="flex items-center gap-1.5 mt-1 px-1 opacity-60">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {formatMessageTime(message.createdAt)}
                  </span>
                  
                  {message.direction === 'outbound' && (
                    <div className="flex items-center">
                      {(() => {
                        const status = message.status || (message.readAt ? 'read' : message.deliveredAt ? 'delivered' : message.sentAt ? 'sent' : 'pending');
                        switch (status) {
                          case 'read':
                          case 'clicked':
                            return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
                          case 'delivered':
                            return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
                          case 'sent':
                            return <Check className="h-3.5 w-3.5 text-gray-400" />;
                          case 'failed':
                            return <span className="text-[10px] text-red-500 font-bold">!</span>;
                          default:
                            return <Clock className="h-3.5 w-3.5 text-gray-400" />;
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
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
