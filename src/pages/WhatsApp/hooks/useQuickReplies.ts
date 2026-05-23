import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quickReplyApi, type CreateQuickReplyPayload } from '../api/modules/quickReplyAPI';
import { toastUtils } from '@/lib/utils';

export function useQuickReplies(projectId: string) {
  const queryClient = useQueryClient();

  const { data: quickReplies = [], isLoading, error } = useQuery({
    queryKey: ['quick-replies', projectId],
    queryFn: () => quickReplyApi.list(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateQuickReplyPayload) => quickReplyApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies', projectId] });
      toastUtils.success('Quick reply created successfully');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create quick reply';
      toastUtils.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quickReplyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies', projectId] });
      toastUtils.success('Quick reply deleted successfully');
    },
    onError: () => {
      toastUtils.error('Failed to delete quick reply');
    },
  });

  return {
    quickReplies,
    isLoading,
    error,
    createQuickReply: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteQuickReply: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
