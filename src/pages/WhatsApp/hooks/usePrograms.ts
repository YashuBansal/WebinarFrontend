import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { programApi } from '@/api/modules/programAPI';
import type {
  Program,
  ProgramAssignment,
  CreateProgramDto,
  UpdateProgramDto,
  CreateProgramAssignmentDto,
  ProgramsListResponse,
  ProgramAssignmentsListResponse,
} from '@/schemas/programSchema';
import { toastUtils } from '@/lib/utils';

/**
 * Hook to fetch all programs (optionally for a project)
 */
export const usePrograms = (
  projectId: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery<ProgramsListResponse, AxiosError>({
    queryKey: ['programs', projectId, page, limit],
    queryFn: () => programApi.findAll(projectId, page, limit),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError(error) {
      console.error('Failed to fetch programs:', error);
      toastUtils.error('Failed to fetch programs');
      return false;
    },
  });
};

/**
 * Hook to fetch a specific program by ID
 */
export const useProgramById = (programId: string) => {
  return useQuery<Program, AxiosError>({
    queryKey: ['program', programId],
    queryFn: () => programApi.findOne(programId),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new program
 */
export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation<Program, AxiosError, CreateProgramDto>({
    mutationFn: (payload) => programApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs', variables.projectId] });
      toastUtils.success('Sequence created successfully');
    },
    onError: (error) => {
      toastUtils.error(error, 'Failed to create sequence');
    },
  });
};

/**
 * Hook to update a program
 */
export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Program,
    AxiosError,
    { programId: string; payload: UpdateProgramDto }
  >({
    mutationFn: ({ programId, payload }) => programApi.update(programId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['program', data._id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignment-slots'] });
      toastUtils.success('Sequence updated successfully');
    },
    onError: (error) => {
      toastUtils.error(error, 'Failed to update sequence');
    },
  });
};

/**
 * Hook to delete a program
 */
export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (programId) => programApi.remove(programId),
    onSuccess: (_, programId) => {
      queryClient.removeQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignment-slots'] });
      toastUtils.success('Sequence deleted successfully');
    },
    onError: () => {
      toastUtils.error('Failed to delete sequence');
    },
  });
};

/**
 * Hook to list program assignments (optional filters)
 */
export const useProgramAssignments = (options: {
  programId?: string;
  projectId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { programId, projectId, status, page = 1, limit = 10 } = options;
  return useQuery<ProgramAssignmentsListResponse, AxiosError>({
    queryKey: ['program-assignments', programId, projectId, status, page, limit],
    queryFn: () =>
      programApi.listAssignments({
        programId,
        projectId,
        status,
        page,
        limit,
      }),
    enabled: !!(programId ?? projectId),
    staleTime: 2 * 60 * 1000,
    throwOnError(error) {
      console.error('Failed to fetch sequence assignments:', error);
      toastUtils.error('Failed to fetch assignments');
      return false;
    },
  });
};

/**
 * Hook to fetch slots for a program assignment
 */
export const useProgramAssignmentSlots = (assignmentId: string | null) => {
  return useQuery<any[], AxiosError>({
    queryKey: ['program-assignment-slots', assignmentId],
    queryFn: () => programApi.getAssignmentSlots(assignmentId!),
    enabled: !!assignmentId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook to create a program assignment
 */
export const useCreateProgramAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProgramAssignment,
    AxiosError,
    CreateProgramAssignmentDto
  >({
    mutationFn: (dto) => programApi.createAssignment(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['program-assignments', variables.programId],
      });
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      toastUtils.success('Assignment created successfully');
    },
    onError: () => {
      toastUtils.error('Failed to create assignment');
    },
  });
};

/**
 * Hook to pause a program assignment
 */
export const usePauseProgramAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<ProgramAssignment, AxiosError, string>({
    mutationFn: (assignmentId) => programApi.pauseAssignment(assignmentId),
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignment-slots', assignmentId] });
      toastUtils.success('Assignment paused');
    },
    onError: () => {
      toastUtils.error('Failed to pause assignment');
    },
  });
};

/**
 * Hook to resume a program assignment
 */
export const useResumeProgramAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<ProgramAssignment, AxiosError, string>({
    mutationFn: (assignmentId) => programApi.resumeAssignment(assignmentId),
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignment-slots', assignmentId] });
      toastUtils.success('Assignment resumed');
    },
    onError: () => {
      toastUtils.error('Failed to resume assignment');
    },
  });
};

/**
 * Hook to cancel a program assignment
 */
export const useCancelProgramAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<ProgramAssignment, AxiosError, string>({
    mutationFn: (assignmentId) => programApi.cancelAssignment(assignmentId),
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['program-assignment-slots', assignmentId] });
      toastUtils.success('Assignment cancelled');
    },
    onError: () => {
      toastUtils.error('Failed to cancel assignment');
    },
  });
};
