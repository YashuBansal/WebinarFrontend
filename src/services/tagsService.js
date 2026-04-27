import { instance } from "./axiosInterceptor";
import { errorToast } from "../utils/extra";

/** Normalize GET /tags bodies: raw array, or { data }, { tags }, { success, data }. */
export function normalizeTagsListResponse(res) {
  if (res == null) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.tags)) return res.tags;
  if (Array.isArray(res?.results)) return res.results;
  return [];
}

class TagsService {
  async getTags(params = {}) {
    try {
      const { data } = await instance.get(`tags`, { params });
      const list = normalizeTagsListResponse(data);
      if (data && typeof data === "object" && !Array.isArray(data) && "success" in data) {
        return { ...data, data: list };
      }
      return { success: true, data: list, message: "Tags fetched successfully" };
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching tags");
      return { success: false, data: [] };
    }
  }

    async getWebinarById(id) {
    try {
      const { data } = await instance.get(`webinar/${id}`);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching Webinar");
      return { success: false };
    }
  }

    async updateWebinarSetting(payload) {
    try {
      const { data } = await instance.patch(`webinar/setting`, payload);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching Webinar");
      return { success: false };
    }
  }

  async createTag(payload) {
    try {
      const { data } = await instance.post(`tags`, payload);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error creating tag");
      return { success: false };
    }
  }

  async deleteTag(id) {
    try {
      const { data } = await instance.delete(`tags/${id}`);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error deleting tag");
      return { success: false };
    }
  }

  async updateAttendeeAssociationTag(email, tag, action) {
    try {
      const { data } = await instance.patch(
        `attendee-association/${email}/tags`,
        { tag, action }
      );
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error updating tag");
      return { success: false };
    }
  }

  async getWebinarWebhooks(webinarId) {
    try {
      const { data } = await instance.get(`webinar-webhook`, {
        params: { webinarId },
      });
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching webhooks");
      return { success: false };
    }
  }

  async createWebinarWebhook(payload) {
    try {
      const { data } = await instance.post(`webinar-webhook`, payload);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error creating webhook");
      return { success: false };
    }
  }

  async updateWebinarWebhook(id, payload) {
    try {
      const { data } = await instance.patch(`webinar-webhook/${id}`, payload);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error updating webhook");
      return { success: false };
    }
  }

  async deleteWebinarWebhook(id) {
    try {
      const { data } = await instance.delete(`webinar-webhook/${id}`);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error deleting webhook");
      return { success: false };
    }
  }

  async getWebinarWebhookById(id) {
    try {
      const { data } = await instance.get(`webinar-webhook/${id}`);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching webhook");
      return { success: false };
    }
  }
}

const tagsService = new TagsService();

export default tagsService;
