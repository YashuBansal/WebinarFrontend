import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";
import { successToast } from "../../utils/extra";

//set alarm
export const setAlarm = createAsyncThunk(
  "alarm",
  async ({ date, note, email, attendeeId, secondaryNumber, createdBy, attendeePhone="" }, { rejectWithValue }) => {
    try {
      const response = await instance.post(`/alarm`, {
        date,
        note,
        email,
        attendeeId,
        secondaryNumber,
        createdBy,
        attendeePhone
      });
      successToast(response?.data);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get Attendee alarm
export const getAttendeeAlarm = createAsyncThunk(
  "alarm/get",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/alarm?email=${email}`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const cancelAlarm = createAsyncThunk(
  "alarm/cancel",
  async ({ id, createdBy, date }, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`/alarm`, { id, date, createdBy });
      successToast("Alarm cancelled.");
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get User alarms
export const getUserAlarms = createAsyncThunk(
  "alarm/user/fetchData",
  async ({ id, year, month }, { rejectWithValue }) => {
    if (!id) return;
    try {
      const response = await instance.get(`/alarm/user/${id}`, {
        params: { year, month },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);


export const getUnAcknowledgedAlarms = createAsyncThunk(
  "alarm/unacknowledged/user/fetchData",
  async ({ id }, { rejectWithValue }) => {
    if (!id) return;
    try {
      const response = await instance.get(`/alarm/user/${id}`, {
        params: { isAcknowledged: true },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
