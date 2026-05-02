import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Phone, MessageCircle } from 'lucide-react';

interface ChatHeaderProps {
  contactName: string;
  contactPhone?: string;
  canSendDirect?: {
    canSend: boolean;
    reason?: string;
  } | null;
  actions?: React.ReactNode;
  showContactInfo?: boolean;
}

export function ChatHeader({ 
  contactName, 
  contactPhone,
  canSendDirect, 
  actions,
  showContactInfo = true 
}: ChatHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{contactName}</div>
            {showContactInfo && contactPhone && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contactPhone}
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* 24-hour window warning */}
      {canSendDirect && !canSendDirect.canSend && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {canSendDirect.reason}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
