import { instance } from "./axiosInterceptor";
import { errorToast } from "../utils/extra";

class SuperAdminAffiliateService {
  async getAllProfiles() {
    try {
      const { data } = await instance.get("superadmin-affiliate/profiles");
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching affiliate profiles");
      throw error;
    }
  }

  async getAllReferrals() {
    try {
      const { data } = await instance.get("superadmin-affiliate/referrals");
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching affiliate referrals");
      throw error;
    }
  }

  async getAllPayouts() {
    try {
      const { data } = await instance.get("superadmin-affiliate/payouts");
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error fetching payout requests");
      throw error;
    }
  }

  async updatePayoutStatus(payoutId, status) {
    try {
      const { data } = await instance.post(`superadmin-affiliate/payouts/${payoutId}/status`, { status });
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error updating payout status");
      throw error;
    }
  }

  async updateAffiliateRates(affiliateId, rates) {
    try {
      const { data } = await instance.post(`superadmin-affiliate/profiles/${affiliateId}/rates`, rates);
      return data;
    } catch (error) {
      console.error(error);
      errorToast(error || "Error updating affiliate commission rates");
      throw error;
    }
  }
}

const superAdminAffiliateService = new SuperAdminAffiliateService();

export default superAdminAffiliateService;
