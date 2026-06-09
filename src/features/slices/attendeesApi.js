import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseURL } from '../../services/axiosInterceptor'; // Align base URL with existing Axios setup

export const attendeesApi = createApi({
  reducerPath: 'attendeesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: baseURL || '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      // Extract authentication token from Redux Auth slice state
      const token = getState().auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('accept', 'application/json');
      return headers;
    },
  }),
  // Globally cache inactive queries for 60 seconds before executing garbage collection
  keepUnusedDataFor: 60,
  
  // Tag types for smart cache invalidation
  tagTypes: ['Attendee'],

  endpoints: (builder) => ({
    // Paginated fetch with automatic filters cache keying
    getAttendees: builder.query({
      query: ({ webinarId, page = 1, limit = 20, ...filters }) => ({
        url: '/attendees/webinar',
        method: 'GET',
        params: { webinarId, page, limit, ...filters },
      }),
      // Set distinct data lifetime for this heavy analytical component (cache for 45s)
      keepUnusedDataFor: 45,
      
      // Bind entities to the cache tags
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Attendee', id: _id })),
              { type: 'Attendee', id: 'LIST' },
            ]
          : [{ type: 'Attendee', id: 'LIST' }],
    }),

    // Single Lead Patch Mutation with smart Cache Revalidation
    updateAttendee: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/attendees/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // Auto-invalidates the specific attendee cache as well as the active table query list
      invalidatesTags: (result, error, { id }) => [
        { type: 'Attendee', id },
        { type: 'Attendee', id: 'LIST' },
      ],
    }),

    // Bulk Delete Mutation
    deleteAttendeesForWebinar: builder.mutation({
      query: (body) => ({
        url: '/attendees/webinar',
        method: 'DELETE',
        body,
      }),
      // Evict entire lists of attendees from cached states on delete
      invalidatesTags: [{ type: 'Attendee', id: 'LIST' }],
    }),
  }),
});

// Auto-generated React hooks matching the endpoints above
export const {
  useGetAttendeesQuery,
  useUpdateAttendeeMutation,
  useDeleteAttendeesForWebinarMutation,
} = attendeesApi;
