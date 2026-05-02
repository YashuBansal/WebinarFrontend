import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import type { AxiosError } from 'axios';
import { projectsApi } from '@/api/modules/projectsAPI';
import type { CreateProjectPayload, PaginatedProjectsResponse, Project, UpdateProjectPayload } from '@/schemas/projectSchema';
import { toastUtils } from '@/lib/utils';

// The base query key for all project-related queries.
const PROJECTS_QUERY_KEY = 'projects';

/**
 * Hook to fetch a paginated list of projects.
 * @param page - The page number to fetch.
 * @param limit - The number of items per page.
 */
export const useProjects = (page: number = 1, limit: number = 10) => {
  return useQuery<PaginatedProjectsResponse, AxiosError>({
    // The query key is an array that uniquely identifies this query.
    // It includes the base key and the parameters to differentiate between pages.
    queryKey: [PROJECTS_QUERY_KEY, { page, limit }],
    queryFn: () => projectsApi.getProjects({ page, limit }),
    refetchOnWindowFocus: false,
    // You can add options like staleTime or gcTime here if needed.
    // staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single project by its ID.
 * @param projectId - The ID of the project to fetch.
 */
export const useProject = (projectId: string | undefined) => {
    return useQuery<Project, AxiosError>({
        queryKey: [PROJECTS_QUERY_KEY, projectId],
        queryFn: () => {
            // Throwing an error or returning a rejected promise is a good pattern
            // to ensure the query function doesn't run with invalid input.
            if (!projectId) {
                return Promise.reject(new Error("Project ID is required."));
            }
            return projectsApi.getProjectById(projectId);
        },
        // The query will only execute if `projectId` is a truthy value.
        enabled: !!projectId,
    });
};


/**
 * A custom hook that provides mutation functions for creating, updating,
 * and deleting projects. This groups related mutations together.
 */
export const useProjectMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Mutation to create a new project.
   */
  const useCreateProject = () => {
    return useMutation<Project, Error, CreateProjectPayload>({
      mutationFn: projectsApi.createProject,
      onSuccess: () => {
        // When a new project is created, invalidate all queries starting
        // with PROJECTS_QUERY_KEY to refetch the project lists.
        console.log('Project created successfully');
        queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      },
      onError: (error: any) => {
        if (error instanceof ZodError) {
          console.error('Project creation failed: Validation error', error.flatten());
        } else {
          toastUtils.error(error, "Project creation failed")
          console.error('Project creation failed:', error);
        }
      },
    });
  };

  /**
   * Mutation to update an existing project.
   */
  const useUpdateProject = () => {
    return useMutation<Project, Error, { projectId: string; payload: UpdateProjectPayload }>({
      mutationFn: ({ projectId, payload }) => projectsApi.updateProject(projectId, payload),
      onSuccess: (updatedProject) => {
        console.log('Project updated successfully');
        // Invalidate all project lists.
        queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
        
        // You can also optimistically update the specific project's query cache.
        // This makes the UI feel faster as it doesn't have to wait for the refetch.
        queryClient.setQueryData([PROJECTS_QUERY_KEY, updatedProject._id], updatedProject);
      },
      onError: (error, variables) => {
        console.error(`Project update failed for ID ${variables.projectId}:`, error.message);
      },
    });
  };

  /**
   * Mutation to delete a project.
   */
  const useDeleteProject = () => {
    return useMutation<Project, Error, string>({ // The third generic is the type of the variable passed to mutationFn
      mutationFn: (projectId) => projectsApi.deleteProject(projectId),
      onSuccess: (deletedProject) => {
        console.log('Project deleted successfully');
        // After deletion, invalidate the list queries to remove the item from the UI.
        queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });

        // Optional: Immediately remove the deleted project's specific query from the cache.
        queryClient.removeQueries({ queryKey: [PROJECTS_QUERY_KEY, deletedProject._id] });
      },
      onError: (error, projectId) => {
        console.error(`Failed to delete project with ID ${projectId}:`, error.message);
      }
    });
  };

  return { useCreateProject, useUpdateProject, useDeleteProject };
};