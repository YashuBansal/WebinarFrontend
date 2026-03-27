import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";

// ------------------------------------Async Actions----------------------------------

//Signup Api
export const signUp = createAsyncThunk(
  "user/signup",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.post("auth/signup", payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

//Login Api
export const logIn = createAsyncThunk(
  "user/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await instance.post("auth/login", payload, {
        withCredentials: true,
      });
      console.log(data);
      return data;
    } catch (error) {
      console.log("error leleo bhia'", error);
      return rejectWithValue(error);
    }
  }
);

//Logout Api
export const logOutAndClearCookies = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.post("auth/logout", {
        withCredentials: true,
      });
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

//Update basic Info
export const updateUser = createAsyncThunk(
  "user/Update",
  async (payload, { rejectWithValue }) => {
    try {
      console.log("payload", payload);
      const { data } = await instance.patch("/users", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

//Update basic Info
export const updatePassword = createAsyncThunk(
  "userPassword/Update",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await instance.patch("/users/password", payload);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getAllRoles = createAsyncThunk(
  "roles/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/roles`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getGSTValue = createAsyncThunk(
  "subscription/gset-value",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/subscription/gst-value`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "currentUser/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get(`auth/current-user`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getCurrentUserForUpdate = createAsyncThunk(
  "currentUser/fetchData/update",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get(`auth/current-user`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const deleteUserDocumet = createAsyncThunk(
  "userDocuments/Delete",
  async (filename, { rejectWithValue }) => {
    try {
      const { data } = await instance.delete(`/users/document/${filename}`);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getUserDocuments = createAsyncThunk(
  "userDocuments/fetchData",
  async (filename, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/documents/${filename}`, {
        responseType: "blob", // Ensures the response is received as binary data
      });

      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = url;

      link.download = filename || "downloaded_file";

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response;
    } catch (e) {
      return rejectWithValue(e.message || "File download failed");
    }
  }
);

export const getSuperAdmin = createAsyncThunk(
  "super-admin/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get(`users/super-admin`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//Forgot Password
export const generateOTP = createAsyncThunk(
  "user/forgot-password",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await instance.post(`auth/forgot-password/${email}`);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Validate OTP
export const validateOTP = createAsyncThunk(
  "user/validate-otp",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.post(`auth/validate-otp`, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateWhatsappToken = createAsyncThunk(
  "user/updateWhatsappToken",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.patch(
        `users/super-admin/whatsapp-token`,
        payload
      );
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const generatePablyToken = createAsyncThunk(
  "user/generatePablyToken",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.post(`auth/pably-token`, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const expireTokenStatus = createAsyncThunk(
  "user/expireTokenStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`auth/pably-token/${id}`);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getAPIAccessTokens = createAsyncThunk(
  "user/accesstoken/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const {data} = await instance.get(`auth/pably-token`);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const generateTokenFor2FA = createAsyncThunk(
  "users/generate/token",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await instance.get(`users/secret`);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const VerifyAndToggle2FA = createAsyncThunk(
  "users/toggle/2fa",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`users/secret`, payload);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
