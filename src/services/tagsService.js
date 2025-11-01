import { instance } from "./axiosInterceptor";
import { errorToast } from "../utils/extra";

class TagsService {
  async getTags(params = {}) {
    try {
      const { data } = await instance.get(`tags`, { params });
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching tags");
      return { success: false };
    }
  }

  async getInvalidTags() {
    try {
      const { data } = await instance.get(`attendees/invalid-tags`);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching tags");
      return { success: false };
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
