import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";

//get All Locations
export const getLocations = createAsyncThunk(
  "locations",
  async ({ page, limit, global }, { rejectWithValue }) => {
    try {
      const { data } = await instance.get(`/location`, {
        params: { page, limit },
      });
      return {
        global,
        ...data,
      };
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get All Location Requests
export const getLocationRequests = createAsyncThunk(
  "locations/requests",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/location/requests`, {
        params: { page, limit },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const approveLocation = createAsyncThunk(
  "locations/approve",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`/location/approve/${id}`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const disapproveLocation = createAsyncThunk(
  "locations/disapprove",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`/location/disapprove/${id}`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const updateLocationState = createAsyncThunk(
  "locations/update-state",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`/location/update/${id}`, data);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const addLocation = createAsyncThunk(
  "locations/add",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.post("/location", payload);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const addLocations = createAsyncThunk(
  "multi-locations/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await instance.post("/location/import", payload);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteLocations = createAsyncThunk(
  "multi-locations/delete",
  async (locationIds , { rejectWithValue }) => {
    try {
      const { data } = await instance.delete("/location", { locationIds });
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
