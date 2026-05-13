import { useEffect, useLayoutEffect, useRef } from 'react';
import { Image, Video, Check, CheckCheck, Clock, FileText } from 'lucide-react';
import { TemplateMessageRenderer } from './TemplateMessageRenderer';

interface Message {
  _id?: string;
  phoneNumber: string;
  textBody?: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
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
  contactName?: string;
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
  contactName,
  className = '',
  projectId,
}: MessagesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getMediaProxyUrl = (mediaUrl?: string): string => {
    if (!projectId || !mediaUrl) return mediaUrl || '';
    const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL || '';
    return `${apiBaseUrl}/whatsapp/media-proxy?url=${encodeURIComponent(mediaUrl)}&projectId=${projectId}`;
  };

  const isInitialLoadRef = useRef(true);
  const lastContactRef = useRef<string | undefined>(contact);
  const prevMessagesLengthRef = useRef(messages.length);
  const scrollPositionRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const pendingScrollToBottomRef = useRef(false);

  useEffect(() => {
    const contactChanged = lastContactRef.current !== contact;
    if (contactChanged) {
      lastContactRef.current = contact;
      isInitialLoadRef.current = true;
      prevMessagesLengthRef.current = 0;
      scrollPositionRef.current = null;
      pendingScrollToBottomRef.current = true;
    }
  }, [contact]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || pendingScrollToBottomRef.current) return;
    if (loading && !isInitialLoadRef.current && messages.length > 0) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
      if (!isAtBottom) {
        scrollPositionRef.current = { scrollTop: container.scrollTop, scrollHeight: container.scrollHeight };
      }
    }
  }, [loading, messages.length]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !scrollPositionRef.current || pendingScrollToBottomRef.current) return;
    if (!loading && messages.length > prevMessagesLengthRef.current) {
      const prevState = scrollPositionRef.current;
      const heightDiff = container.scrollHeight - prevState.scrollHeight;
      if (heightDiff > 0) container.scrollTop = prevState.scrollTop + heightDiff;
      scrollPositionRef.current = null;
      prevMessagesLengthRef.current = messages.length;
    } else if (!loading) {
      prevMessagesLengthRef.current = messages.length;
    }
  }, [loading, messages.length]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if ((pendingScrollToBottomRef.current || isInitialLoadRef.current) && !loading && messages.length > 0) {
      const sh = container.scrollHeight;
      if (sh > 0) {
        container.scrollTop = sh;
        pendingScrollToBottomRef.current = false;
        isInitialLoadRef.current = false;
        prevMessagesLengthRef.current = messages.length;
      }
    }
  }, [messages, loading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loading || pendingScrollToBottomRef.current || isInitialLoadRef.current) return;
    const scrollToBottom = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) container.scrollTop = container.scrollHeight;
    };
    const t = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(t);
  }, [messages, loading]);

  // ── Helpers ──────────────────────────────────────────────────────
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const getDateLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStatusIcon = (msg: Message) => {
    const s = msg.status || (msg.readAt ? 'read' : msg.deliveredAt ? 'delivered' : msg.sentAt ? 'sent' : 'pending');
    if (s === 'read' || s === 'clicked') return <CheckCheck className="h-[14px] w-[14px] text-[#53bdeb]" />;
    if (s === 'delivered') return <CheckCheck className="h-[14px] w-[14px] text-[#8696a0]" />;
    if (s === 'sent') return <Check className="h-[14px] w-[14px] text-[#8696a0]" />;
    if (s === 'failed') return <span className="text-[11px] text-red-400 font-bold leading-none">!</span>;
    return <Clock className="h-[13px] w-[13px] text-[#8696a0]" />;
  };

  /**
   * Extract quick-reply buttons from a template message.
   * These render BELOW the bubble as separate pill buttons.
   * Action buttons (URL/PHONE) are rendered INSIDE the bubble by TemplateMessageRenderer.
   */
  const getQuickReplies = (msg: Message): { text: string }[] => {
    if (msg.messageFormat !== 'template') return [];
    const comps = msg.templateComponents || [];
    const tmpl = templates.find((t) => t.name === msg.templateName);

    // Session template (no matching meta template)
    if (!tmpl && comps.length > 0) {
      const btnComp = comps.find((c: any) => c.type?.toUpperCase() === 'BUTTONS');
      return (btnComp?.buttons || []).filter(
        (b: any) => b.type === 'QUICK_REPLY' || (!b.type && !b.url && !b.phone_number)
      );
    }
    // Meta template
    if (tmpl) {
      const btnComp = tmpl.components?.find((c: any) => c.type === 'BUTTONS');
      return (btnComp?.buttons || []).filter((b: any) => b.type === 'QUICK_REPLY');
    }
    return [];
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div
      ref={scrollContainerRef}
      className={`h-full overflow-y-auto wa-messages-scroll px-4 py-3 bg-transparent ${className}`}
      role="log"
      aria-label="Chat messages"
    >
      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mb-3">
          <button
            className="px-4 py-1.5 text-xs bg-white/90 border border-gray-200 rounded-full shadow-sm
                       hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-gray-600"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load older messages'}
          </button>
        </div>
      )}

      {/* Empty */}
      {messages.length === 0 && !loading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-center text-gray-400">
            <div className="text-[15px] font-medium mb-1">No messages yet</div>
            <div className="text-[13px]">Start the conversation below</div>
          </div>
        </div>
      )}

      {/* ── Message List ── */}
      {messages.map((msg, idx) => {
        const msgDate = new Date(msg.createdAt).toDateString();
        const prevDate = idx > 0 ? new Date(messages[idx - 1].createdAt).toDateString() : null;
        const showSep = msgDate !== prevDate;

        const isOut = msg.direction === 'outbound';
        const isTmpl = msg.messageFormat === 'template';
        const isMedia = msg.messageFormat === 'media';
        const isText = !isTmpl && !isMedia;

        const quickReplies = getQuickReplies(msg);
        
        // Calculate grouping: add more space only if the NEXT message is from a different sender
        const nextMsg = messages[idx + 1];
        const isLastOfGroup = !nextMsg || nextMsg.direction !== msg.direction;
        const rowMargin = isLastOfGroup ? 'mb-3' : 'mb-1';

        return (
          <div key={msg._id || idx}>
            {/* Date separator */}
            {showSep && (
              <div className="flex justify-center my-4">
                <div className="wa-date-chip">{getDateLabel(msg.createdAt)}</div>
              </div>
            )}

            {/* ── Row ── */}
            <div className={`flex ${rowMargin} ${isOut ? 'justify-end' : 'justify-start'}`}>
              <div style={{ maxWidth: 'min(72%, 380px)', minWidth: 60 }}>

                {/* ── Bubble ── */}
                <div className={`wa-bubble ${isOut ? 'wa-bubble-out' : 'wa-bubble-in'}`}>

                  {/* Inbound template: sender name header (amber, like WA) */}
                  {!isOut && isTmpl && (
                    <div className="wa-sender-name">
                      {contactName || contact || msg.phoneNumber}
                    </div>
                  )}

                  {/* ── Template content ── */}
                  {isTmpl && (
                    <TemplateMessageRenderer
                      message={msg}
                      templates={templates}
                      direction={msg.direction}
                    />
                  )}

                  {/* ── Media content ── */}
                  {isMedia && (
                    <div>
                      {msg.mediaUrl ? (
                        <>
                          {msg.mimeType?.startsWith('image/') && (
                            <img
                              src={getMediaProxyUrl(msg.mediaUrl)}
                              alt={msg.textBody || 'Image'}
                              className="wa-media-img"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          {msg.mimeType?.startsWith('video/') && (
                            <video
                              src={getMediaProxyUrl(msg.mediaUrl)}
                              controls
                              className="wa-media-img"
                              onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                            />
                          )}
                          {!msg.mimeType?.startsWith('image/') && !msg.mimeType?.startsWith('video/') && (
                            <div className="wa-doc-block">
                              <FileText className="h-5 w-5 flex-shrink-0" />
                              <span className="text-[13px] font-medium truncate">
                                {msg.textBody || msg.displayText || 'File'}
                              </span>
                            </div>
                          )}
                          {/* Caption */}
                          {msg.textBody && msg.textBody !== '[Image]' && msg.textBody !== '[Video]' && (
                            <div className="text-[13.5px] leading-relaxed mt-1.5 px-0.5">
                              {msg.textBody}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          {msg.mimeType?.startsWith('video/')
                            ? <Video className="h-5 w-5 flex-shrink-0 opacity-60" />
                            : <Image className="h-5 w-5 flex-shrink-0 opacity-60" />}
                          <span className="text-[13.5px]">{msg.textBody || msg.displayText || '[Media]'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Plain text ── */}
                  {isText && (
                    <div className="wa-plain-text">
                      {msg.textBody || msg.displayText}
                    </div>
                  )}

                  {/* ── Time + ticks — always at bottom-right inside bubble ── */}
                  {/*
                    WA approach: time sits in its own right-aligned flex row
                    BELOW the message content, with a small top-margin.
                    NO float, NO negative margin-top (those cause overlap).
                  */}
                  <div className={`wa-time-row ${isOut ? 'wa-time-row-out' : 'wa-time-row-in'}`}>
                    <span className="wa-time-text">{formatTime(msg.createdAt)}</span>
                    {isOut && <span className="flex items-center">{getStatusIcon(msg)}</span>}
                  </div>
                </div>

                {/* ── Quick Reply pills — BELOW bubble, white card per pill ── */}
                {quickReplies.length > 0 && (
                  <div className="wa-qr-list">
                    {quickReplies.map((btn, i) => (
                      <button key={i} disabled className="wa-qr-pill">
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading */}
      {loading && messages.length === 0 && (
        <div className="flex justify-center items-center h-32">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-[12px] text-gray-400">Loading messages…</div>
          </div>
        </div>
      )}
    </div>
  );
}
