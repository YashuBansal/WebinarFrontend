import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

interface ChatInputProps {
  disabled?: boolean;
  canSendDirect: boolean;
  onSend: (text: string) => Promise<any>;
  onShowTemplate: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function ChatInput({ 
  disabled, 
  canSendDirect, 
  onSend, 
  onShowTemplate,
  placeholder,
  maxLength = 1000,
  className = ""
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

  return (
    <div className={`p-4 bg-white border-t ${className}`}>
      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex gap-3 items-end">
        {/* Template Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onShowTemplate}
          disabled={disabled}
          className="flex-shrink-0 h-10"
          aria-label="Send template message"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Template
        </Button>
        
        {/* Text Input Form */}
        <form
          className="flex gap-2 flex-1"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              className="w-full border border-gray-300 rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
              placeholder={placeholder || defaultPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || !canSendDirect || isSubmitting}
              maxLength={maxLength}
              aria-label="Message input"
              aria-describedby={error ? "error-message" : undefined}
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
              disabled={disabled || !canSendDirect || !text.trim() || isSubmitting}
              aria-label="Send message"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Character count */}
      {text.length > maxLength * 0.8 && (
        <div className="mt-2 text-xs text-gray-500 text-right">
          {text.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
