import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";

//add user Activity
export const addUserActivity = createAsyncThunk(
  "userActivity/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.post(`/user-activities`, payload);
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get user Activity
export const getUserActivity = createAsyncThunk(
  "userActivity/fetch",
  async ({ id, page = 1, limit = 10, filters }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/user-activities/${id}`, {
        params: { page, limit, filters },
      });
      console.log(response.data);
      return response.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getUserActivitySilently = createAsyncThunk(
  "userActivity/fetch/silent",
  async ({ id, page = 1, limit = 10, filters }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/user-activities/${id}`, {
        params: { page, limit, filters },
      });
      console.log(response.data);
      return response.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getUserActivityByEmail = createAsyncThunk(
  "userActivityByEmail/fetch",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/user-activities`, {
        params: payload,
      });
      return response.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const sendInactiveNotification = createAsyncThunk(
  "userActivity/fetch",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.put(`/user-activities/inactive`, payload);
      console.log(response.data);
      return response.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getUserActivityOfEmployees = createAsyncThunk(
  "userActivity/Employees",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/user-activities/employee` );
      console.log(response.data);
      return response.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
