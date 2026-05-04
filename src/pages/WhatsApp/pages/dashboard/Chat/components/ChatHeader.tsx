import { User, Info, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  contactName: string;
  contactPhone?: string;
  canSendDirect?: {
    canSend: boolean;
    reason?: string;
  } | null;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export function ChatHeader({ 
  contactName, 
  contactPhone,
  canSendDirect, 
  actions,
  onBack,
}: ChatHeaderProps) {
  // Extract initials logic (same as sidebar)
  const getInitials = (name: string) => {
    if (!name || name === contactPhone) return null;
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(contactName);
  const hasName = !!initials;

  return (
    <div className="flex flex-col flex-shrink-0 z-10">
      <div className="flex items-center justify-between p-3 px-4 md:px-6 border-b border-gray-100/80 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2 md:gap-4">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-full -ml-2 text-gray-500"
              onClick={onBack}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <Avatar className="h-9 w-9 md:h-10 md:w-10 border border-gray-100 shadow-sm relative">
            <AvatarFallback 
              className={`${hasName ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'} text-[13px] font-bold rounded-full flex items-center justify-center`}
            >
              {hasName ? (
                initials
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <h2 className="text-[15px] font-medium text-gray-900 leading-tight tracking-tight">
              {contactName || contactPhone}
            </h2>
            <p className="text-[13px] text-gray-500 font-normal">
              {contactPhone}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>

      {/* 24-hour window warning - Modern banner */}
      {canSendDirect && !canSendDirect.canSend && (
        <div className="px-6 py-2 bg-amber-50/60 backdrop-blur-sm border-b border-amber-100/50 text-[11px] text-amber-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600">
            <Info className="w-3 h-3" />
          </div>
          <span className="font-medium">{canSendDirect.reason}</span>
          <button className="ml-auto text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">
            Learn More
          </button>
        </div>
      )}
    </div>
  );
}
