import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle, Share2, Activity, Info } from 'lucide-react';
import type { WebhookSubscriptionStatus as WebhookSubscriptionStatusType } from '@/schemas/profileSchema';
import { Skeleton } from '@/components/ui/skeleton';

interface WebhookSubscriptionStatusProps {
  status: WebhookSubscriptionStatusType | undefined;
  isLoading: boolean;
  error: Error | null;
  projectId?: string;
  onSubscribe?: () => void;
  isSubscribing?: boolean;
}

export const WebhookSubscriptionStatus = ({
  status,
  isLoading,
  error,
  projectId,
  onSubscribe,
  isSubscribing = false,
}: WebhookSubscriptionStatusProps) => {
  if (isLoading) {
    return (
      <div className="h-full bg-white border border-slate-200 rounded-[20px] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white border border-red-100 rounded-[20px] p-6 flex flex-col justify-center text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-1">Webhook Status Error</h3>
        <p className="text-xs text-slate-500 font-medium">{error.message || "Failed to load status"}</p>
      </div>
    );
  }

  const isSubscribed = status?.isSubscribed ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative h-full bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[20px] p-6 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 right-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-green-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
            <Share2 className="h-5 w-5" />
          </div>
          <Badge className={`rounded-lg font-bold px-3 py-1 ${
            isSubscribed 
              ? 'bg-green-50 text-green-700 border-green-100' 
              : 'bg-red-50 text-red-700 border-red-100'
          } border`}>
            {isSubscribed ? 'Subscribed' : 'Disconnected'}
          </Badge>
        </div>

        <h3 className="text-base font-black text-slate-900 mb-1">Webhook Events</h3>
        <p className="text-[10px] text-slate-500 font-medium mb-6 leading-relaxed italic">
          {isSubscribed 
            ? "Your app is receiving real-time updates for messages, delivery status, and other WhatsApp events." 
            : "Your app is not receiving real-time updates. You will not see incoming messages until this is configured."}
        </p>

        <div className="mt-auto space-y-4">
          <div className={`p-4 rounded-2xl border ${isSubscribed ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full animate-pulse ${isSubscribed ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {isSubscribed ? 'System Online' : 'Action Required'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              {isSubscribed ? "Real-time sync active" : "Event notifications are disabled"}
            </p>
          </div>

          {!isSubscribed && projectId && onSubscribe && (
            <Button
              onClick={onSubscribe}
              disabled={isSubscribing}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe to Webhook"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
