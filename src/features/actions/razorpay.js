import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";
// import { successToast } from "../../utils/extra";

export const checkout = createAsyncThunk(
  "checkout",
  async ({ plan, durationType }, { rejectWithValue }) => {
    try {
      const response = await instance.post(`/razorpay/checkout`, { plan, durationType });
      return response?.data;

    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const checkoutAddon = createAsyncThunk(
  "checkout/addon",
  async ({ addon }, { rejectWithValue }) => {
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const response = await instance.post(
        `/addons/purchases`,
        { addonId: addon },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );
      return response?.data; // { purchase, order, addon }
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getAddonPurchase = createAsyncThunk(
  "addonPurchase/get",
  async ({ purchaseId }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/addons/purchases/${purchaseId}`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
