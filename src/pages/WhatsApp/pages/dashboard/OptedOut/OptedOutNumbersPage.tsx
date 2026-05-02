import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useProjectContext } from '@/context/ProjectContext';
import { toastUtils } from '@/lib/utils';
import {
  whatsappOptoutApi,
  type OptedOutNumber,
} from '@/api/modules/whatsappOptoutAPI';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2, RefreshCw } from 'lucide-react';

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
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-red-600">Failed to load opted out numbers</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Opted Out Numbers</h1>
        <p className="text-gray-600 mt-2">
          People who asked not to get messages from this number. They can text
          START anytime to hear from you again.
        </p>
        <p className="text-lg font-semibold text-gray-800 mt-2">
          Total opted out: {totalCount}
        </p>
      </div>

      <Card>
        <CardContent className="border-b py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {autoRefreshEnabled && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Auto-refresh active</span>
                </div>
              )}
              <div className="flex items-center gap-2">
              {lastRefreshTime && (
                <span className="text-xs text-gray-600">
                  Last refreshed: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || !projectId}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Button
                variant={autoRefreshEnabled ? 'default' : 'outline'}
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                disabled={!projectId}
              >
                <Clock className="h-4 w-4 mr-2" />
                {autoRefreshEnabled ? 'Disable Auto' : 'Enable Auto'}
              </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3">Phone Number</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-left px-4 py-3">Opted Out At</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={4}>
                      No opted out numbers found.
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <tr key={item._id} className="border-b">
                      <td className="px-4 py-3">{item.phoneNumber}</td>
                      <td className="px-4 py-3">{item.reason || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => optInMutation.mutate(item._id)}
                          disabled={optInMutation.isPending}
                        >
                          Opt In
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
