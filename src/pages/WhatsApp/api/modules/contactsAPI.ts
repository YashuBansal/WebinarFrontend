import axiosInstance from '../axios';
import type {
  Contact,
  PaginatedContactsResponse,
  CreateContactPayload,
  UpdateContactPayload,
  BulkCreateContactsPayload,
  BulkCreateContactsResponse,
  BulkDeleteContactsPayload,
  BulkDeleteContactsResponse,
  BulkUpdateContactTagsPayload,
  BulkUpdateContactTagsResponse,
  ContactStats,
  ImportHistoryListResponse,
  ImportHistoryDetailResponse,
} from '@/schemas/contactSchema';
import {
  contactSchema,
  paginatedContactsResponseSchema,
  bulkCreateContactsResponseSchema,
  bulkDeleteContactsResponseSchema,
  bulkUpdateContactTagsResponseSchema,
  contactStatsSchema,
  importHistoryListResponseSchema,
  importHistoryDetailResponseSchema,
} from '@/schemas/contactSchema';

/** Flat query params the backend expects (page, limit, search, projectId, etc.) */
interface GetContactsParamsFlat {
  page?: number;
  limit?: number;
  search?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  tagFilterMode?: 'has_any' | 'not_has_any';
  isActive?: boolean;
  projectId?: string;
}

interface GetImportHistoryParams {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: 'queued' | 'processing' | 'success' | 'failed' | 'partial_success';
}

/** Params from useContacts: optional pagination + nested filters */
export interface GetContactsParams {
  page?: number;
  limit?: number;
  filters?: GetContactsParamsFlat;
}

const getContacts = async (params?: GetContactsParams): Promise<PaginatedContactsResponse> => {
  const flat: any = {
    ...(params?.filters ?? {}),
    ...(params?.page !== undefined && { page: params.page }),
    ...(params?.limit !== undefined && { limit: params.limit }),
  };

  // Ensure tags are sent as a comma-separated string if it's an array
  if (Array.isArray(flat.tags)) {
    flat.tags = flat.tags.join(',');
  }

  const query = Object.fromEntries(
    Object.entries(flat).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data } = await axiosInstance.get('/contacts', { params: query });
  return paginatedContactsResponseSchema.parse(data);
};

/** Page size for campaign contact picker (many pages, smaller payloads). */
const CAMPAIGN_CONTACTS_PAGE_SIZE = 5000;
/** Safety cap (~25M rows) so a bug cannot infinite-loop. */
const CAMPAIGN_CONTACTS_MAX_PAGES = 5000;

/**
 * Loads every contact for a project for the campaign wizard (virtualized UI).
 * Replaces a single huge `limit` request.
 */
const fetchAllContactsForCampaign = async (
  projectId: string,
): Promise<PaginatedContactsResponse> => {
  const allContacts: Contact[] = [];
  let totalCount = 0;
  let page = 1;

  while (page <= CAMPAIGN_CONTACTS_MAX_PAGES) {
    const res = await getContacts({
      page,
      limit: CAMPAIGN_CONTACTS_PAGE_SIZE,
      filters: { projectId },
    });
    allContacts.push(...res.contacts);
    totalCount = res.pagination.totalCount;

    if (!res.pagination.hasNextPage || res.contacts.length === 0) {
      break;
    }
    page += 1;
  }

  const n = allContacts.length;
  return {
    contacts: allContacts,
    pagination: {
      page: 1,
      limit: n > 0 ? n : 1,
      totalCount,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

const getContactById = async (contactId: string): Promise<Contact> => {
  const { data } = await axiosInstance.get(`/contacts/${contactId}`);
  return contactSchema.parse(data);
};

const createContact = async (payload: CreateContactPayload): Promise<any> => {
  const { data } = await axiosInstance.post('/contacts', payload);
  return data;
};

const updateContact = async (
  contactId: string,
  payload: UpdateContactPayload,
): Promise<any> => {
  const { data } = await axiosInstance.patch(`/contacts/${contactId}`, payload);
  return data;
};

const deleteContact = async (contactId: string): Promise<Contact> => {
  const { data } = await axiosInstance.delete(`/contacts/${contactId}`);
  return contactSchema.parse(data);
};

const bulkCreateContacts = async (payload: BulkCreateContactsPayload): Promise<BulkCreateContactsResponse> => {
  const { data } = await axiosInstance.post('/contacts/bulk', payload);
  return bulkCreateContactsResponseSchema.parse(data);
};

const getImportHistory = async (
  params?: GetImportHistoryParams,
): Promise<ImportHistoryListResponse> => {
  const { data } = await axiosInstance.get('/contacts/import-history', { params });
  return importHistoryListResponseSchema.parse(data);
};

const getImportHistoryById = async (
  importHistoryId: string,
): Promise<ImportHistoryDetailResponse> => {
  const { data } = await axiosInstance.get(`/contacts/import-history/${importHistoryId}`);
  return importHistoryDetailResponseSchema.parse(data);
};

const getContactStats = async (): Promise<ContactStats> => {
  const { data } = await axiosInstance.get('/contacts/stats');
  return contactStatsSchema.parse(data);
};

const getContactsByProject = async (
  projectId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedContactsResponse> => {
  const { data } = await axiosInstance.get(`/contacts/project/${projectId}`, { params });
  return paginatedContactsResponseSchema.parse(data);
};

const bulkDeleteContacts = async (payload: BulkDeleteContactsPayload): Promise<BulkDeleteContactsResponse> => {
  const { data } = await axiosInstance.delete('/contacts/bulk', { data: payload });
  return bulkDeleteContactsResponseSchema.parse(data);
};

const bulkUpdateContactTags = async (
  payload: BulkUpdateContactTagsPayload,
): Promise<BulkUpdateContactTagsResponse> => {
  const { data } = await axiosInstance.patch('/contacts/bulk/tags', payload);
  return bulkUpdateContactTagsResponseSchema.parse(data);
};

export const contactsApi = {
  getContacts,
  fetchAllContactsForCampaign,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  bulkCreateContacts,
  bulkDeleteContacts,
  bulkUpdateContactTags,
  getContactStats,
  getContactsByProject,
  getImportHistory,
  getImportHistoryById,
};
