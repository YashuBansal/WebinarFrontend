import type {
  Program,
  ProgramAssignment,
  CreateProgramDto,
  UpdateProgramDto,
  CreateProgramAssignmentDto,
  ProgramsListResponse,
  ProgramAssignmentsListResponse,
} from '@/schemas/programSchema';
import axiosInstance from '../axios';

const PROGRAM_BASE_URL = '/whatsapp-program';

export const programApi = {
  /**
   * Create a new program
   */
  create: async (payload: CreateProgramDto): Promise<Program> => {
    const response = await axiosInstance.post<Program>(PROGRAM_BASE_URL, payload);
    return response.data;
  },

  /**
   * Update a program
   */
  update: async (id: string, payload: UpdateProgramDto): Promise<Program> => {
    const response = await axiosInstance.patch<Program>(`${PROGRAM_BASE_URL}/${id}`, payload);
    return response.data;
  },

  /**
   * Get all programs (optionally filtered by projectId)
   */
  findAll: async (
    projectId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ProgramsListResponse> => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const response = await axiosInstance.get<ProgramsListResponse>(
      `${PROGRAM_BASE_URL}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single program by ID
   */
  findOne: async (id: string): Promise<Program> => {
    const response = await axiosInstance.get<Program>(`${PROGRAM_BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Delete (soft-delete) a program
   */
  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${PROGRAM_BASE_URL}/${id}`);
  },

  /**
   * Create a program assignment
   */
  createAssignment: async (
    dto: CreateProgramAssignmentDto
  ): Promise<ProgramAssignment> => {
    const response = await axiosInstance.post<ProgramAssignment>(
      `${PROGRAM_BASE_URL}/assignments`,
      dto
    );
    return response.data;
  },

  /**
   * List program assignments (optional filters: programId, projectId, status)
   */
  listAssignments: async (
    options?: {
      programId?: string;
      projectId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ProgramAssignmentsListResponse> => {
    const params = new URLSearchParams();
    if (options?.programId) params.set('programId', options.programId);
    if (options?.projectId) params.set('projectId', options.projectId);
    if (options?.status) params.set('status', options.status);
    params.set('page', String(options?.page ?? 1));
    params.set('limit', String(options?.limit ?? 10));
    const response = await axiosInstance.get<ProgramAssignmentsListResponse>(
      `${PROGRAM_BASE_URL}/assignments/list?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single assignment by ID
   */
  getAssignment: async (assignmentId: string): Promise<ProgramAssignment> => {
    const response = await axiosInstance.get<ProgramAssignment>(
      `${PROGRAM_BASE_URL}/assignments/${assignmentId}`
    );
    return response.data;
  },

  /**
   * Get slots for a single assignment
   */
  getAssignmentSlots: async (assignmentId: string): Promise<any[]> => {
    const response = await axiosInstance.get<any[]>(
      `${PROGRAM_BASE_URL}/assignments/${assignmentId}/slots`
    );
    return response.data;
  },

  /**
   * Pause an assignment
   */
  pauseAssignment: async (assignmentId: string): Promise<ProgramAssignment> => {
    const response = await axiosInstance.post<ProgramAssignment>(
      `${PROGRAM_BASE_URL}/assignments/${assignmentId}/pause`
    );
    return response.data;
  },

  /**
   * Resume an assignment
   */
  resumeAssignment: async (assignmentId: string): Promise<ProgramAssignment> => {
    const response = await axiosInstance.post<ProgramAssignment>(
      `${PROGRAM_BASE_URL}/assignments/${assignmentId}/resume`
    );
    return response.data;
  },

  /**
   * Cancel an assignment
   */
  cancelAssignment: async (assignmentId: string): Promise<ProgramAssignment> => {
    const response = await axiosInstance.post<ProgramAssignment>(
      `${PROGRAM_BASE_URL}/assignments/${assignmentId}/cancel`
    );
    return response.data;
  },
};
