import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, AlertCircle, Loader2, Smile, Zap } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatInputProps {
  disabled?: boolean;
  canSendDirect: boolean;
  onSend: (text: string) => Promise<any>;
  onShowTemplate: () => void;
  onShowSessionTemplate?: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  quickReplies?: any[];
}

export function ChatInput({
  disabled,
  canSendDirect,
  onSend,
  onShowTemplate,
  onShowSessionTemplate,
  placeholder,
  maxLength = 1000,
  className = "",
  quickReplies = []
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = canSendDirect
    ? "Type a message..."
    : "Use template messages (24h window expired)";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled || !canSendDirect || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSend(text.trim());
      setText('');
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Failed to send message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const onEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`flex-shrink-0 mt-auto p-2 bg-white dark:bg-slate-950 border-t border-gray-100/50 dark:border-slate-800/50 ${className}`}>
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2.5 text-[12px] text-red-700 dark:text-red-400 animate-in slide-in-from-bottom-2 duration-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto">
        <TooltipProvider>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/50 rounded-2xl p-2 shadow-sm transition-all duration-300">
            {/* Action Buttons Left */}
            <div className="flex items-center gap-0.5">
              {canSendDirect && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all"
                      disabled={disabled || isSubmitting}
                    >
                      <Smile className="h-5.5 w-5.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={12}
                    avoidCollisions={true}
                    collisionPadding={16}
                    className="p-0 border-none shadow-2xl z-[100] w-[90vw] max-w-[350px] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      autoFocusSearch={false}
                      theme={Theme.LIGHT}
                      width="100%"
                      height={400}
                      lazyLoadEmojis={true}
                      previewConfig={{ showPreview: false }}
                      searchPlaceHolder="Search emoji..."
                    />
                  </PopoverContent>
                </Popover>
              )}

              {canSendDirect && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onShowTemplate}
                      className="h-10 w-10 rounded-xl text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <MessageSquare className="h-5.5 w-5.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send Template</TooltipContent>
                </Tooltip>
              )}

              {canSendDirect && quickReplies.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onShowSessionTemplate}
                      className="h-10 w-10 rounded-xl text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <Zap className="h-5.5 w-5.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Replies</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Input area */}
            <form
              className="flex-1 flex items-center gap-2"
              onSubmit={handleSubmit}
            >
              <div className="flex-1 relative group">
                <input
                  ref={inputRef}
                  className={`w-full bg-transparent border-none py-2 px-1 text-[14.5px] font-medium focus:outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all ${!canSendDirect ? 'pl-40' : ''}`}
                  placeholder={placeholder || defaultPlaceholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled || !canSendDirect || isSubmitting}
                  maxLength={maxLength}
                  aria-label="Message input"
                />
                {!canSendDirect && (
                  <button
                    type="button"
                    onClick={onShowTemplate}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-teal-600 bg-teal-50 dark:bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-100 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors uppercase tracking-widest shadow-sm"
                  >
                    Template Required
                  </button>
                )}
              </div>

              {text.trim() && (
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                  disabled={disabled || !canSendDirect || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              )}
            </form>
          </div>
        </TooltipProvider>
      </div>

      {/* Character count */}
      {text.length > maxLength * 0.8 && (
        <div className="mt-2 text-[10px] text-gray-400 text-right font-bold uppercase tracking-widest pr-4">
          {text.length} / {maxLength}
        </div>
      )}
    </div>
  );
}
