import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectContext } from '@/context/ProjectContext';
import { toastUtils } from '@/lib/utils';
import {
  whatsappOptoutApi,
  type OptedOutNumber,
} from '@/api/modules/whatsappOptoutAPI';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Loader2,
  RefreshCw,
  Hash,
  Calendar,
  X,
  ShieldCheck,
  Search,
  Filter,
  UserX,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OPT_OUT_QUERY_KEY = 'whatsapp-optout';

export default function OptedOutNumbersPage() {
  const { selectedProject } = useProjectContext();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const projectId = selectedProject?._id;

  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [OPT_OUT_QUERY_KEY, projectId, startDate, endDate],
    queryFn: () =>
      whatsappOptoutApi.getOptedOutNumbers(projectId as string, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: !!projectId,
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setLastRefreshTime(new Date());
    } catch (error) {
      toastUtils.error(error, 'Failed to refresh opted out numbers');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!autoRefreshEnabled || !projectId) return;

    const interval = setInterval(async () => {
      try {
        await refetch();
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, projectId, refetch]);

  const optInMutation = useMutation({
    mutationFn: (optoutId: string) =>
      whatsappOptoutApi.optInNumber(projectId as string, optoutId),
    onSuccess: () => {
      toastUtils.success('Number opted in successfully');
      queryClient.invalidateQueries({ queryKey: [OPT_OUT_QUERY_KEY, projectId] });
    },
    onError: (error) => {
      toastUtils.error(error, 'Failed to opt in number');
    },
  });

  const rows: OptedOutNumber[] = listData?.items || [];
  const totalCount = listData?.total ?? 0;

  if (isError) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 bg-white dark:bg-slate-950 shadow-sm">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border border-red-100 dark:border-red-900/50 shadow-2xl bg-white dark:bg-slate-900">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Error Loading Numbers</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Failed to load opted out numbers. Please check your connection and try again.
          </AlertDescription>
          <Button onClick={() => refetch()} variant="outline" className="mt-6 w-full rounded-xl border-slate-200 dark:border-slate-800">
            Retry Connection
          </Button>
        </Alert>
      </div>
    );
  }


  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-900 shadow-sm dark:border-slate-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Compliance Management
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
              Opted Out Numbers
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              People who asked not to get messages from this number. They can text START anytime to re-subscribe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2 hidden sm:flex">
              {lastRefreshTime && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Last Updated: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
              {autoRefreshEnabled && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Live Sync Active</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing || !projectId}
              className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${autoRefreshEnabled
                ? 'bg-slate-900 dark:bg-green-500/10 text-white dark:text-green-400 border-slate-900 dark:border-green-500/20 shadow-slate-900/10'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <motion.div
                animate={autoRefreshEnabled ? { rotate: 360 } : { rotate: 0 }}
                transition={autoRefreshEnabled ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
              >
                <Clock className="h-4 w-4" />
              </motion.div>
              {autoRefreshEnabled ? 'Live' : 'Manual'}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">

        {/* List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
        >
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Blocklist Management
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">View and manage recipients who opted out of communications</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="space-y-1 min-w-[140px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:bg-white text-xs font-bold dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1 min-w-[140px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Date</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:bg-white text-xs font-bold dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="h-10 w-10 mt-5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">Loading Records...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-[20px] border border-dashed border-slate-100 dark:border-slate-800">
                <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-50 dark:border-slate-800">
                  <ShieldCheck className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">No opted out numbers</p>
                <p className="text-xs font-medium mt-1">Your compliance list is currently empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex flex-col sm:flex-row sm:items-center gap-6 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-400/20 transition-all duration-300"
                  >
                    {/* Number Icon */}
                    <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Hash className="h-5 w-5" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-none bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                            Opted Out
                          </Badge>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-red-600 transition-colors">
                          {item.phoneNumber}
                        </h3>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</span>
                        </div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 italic">
                          {item.reason || 'No specific reason provided'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Date</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => optInMutation.mutate(item._id)}
                        disabled={optInMutation.isPending}
                        className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                      >
                        {optInMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        Re-Subscribe
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
