import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";

//add Attendees
export const addAttendees = createAsyncThunk(
  "attendees/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.post(`/attendees`, payload);
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get single Attendee
export const getAttendee = createAsyncThunk(
  "attendee",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/attendees/${email}`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//Update Attendee
export const updateAttendee = createAsyncThunk(
  "attendee/update",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instance.patch(
        `/attendees/${payload?.id}`,
        payload
      );
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get Attendees
export const getAttendees = createAsyncThunk(
  "attendees/fetchData",
  async (
    {
      id,
      isAttended,
      page = 1,
      limit = 10,
      filters = {},
      validCall,
      assignmentType,
      sort,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await instance.get(`/attendees/webinar`, {
        params: {
          page,
          limit,
          filters,
          fieldName: "attendeeTableConfig",
          webinarId: id,
          isAttended,
          validCall,
          assignmentType,
          sort,
        },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getWebinarParticipants = createAsyncThunk(
  "webinar/participants/fetchData",
  async (id, { rejectWithValue }) => {
    try {
      const response = await instance.get(
        `/attendees/webinar-participants/${id}`
      );
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getAttendeesSilently = createAsyncThunk(
  "attendees/fetchDataSilently",
  async (
    {
      id,
      isAttended,
      page = 1,
      limit = 10,
      filters = {},
      validCall,
      assignmentType,
      sort,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await instance.get(`/attendees/webinar`, {
        params: {
          page,
          limit,
          filters,
          fieldName: "attendeeTableConfig",
          webinarId: id,
          isAttended,
          validCall,
          assignmentType,
          sort,
        },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get Attendees
export const fetchGroupedAttendees = createAsyncThunk(
  "attendees/grouped/fetchData",
  async ({ page = 1, limit = 10, filters = {}, sort }, { rejectWithValue }) => {
    try {
      const response = await instance.post(
        `/attendees/grouped`,
        { filters, fieldName: "attendeeTableConfig", sort },
        {
          params: { page, limit },
        }
      );
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get Attendees
export const fetchGroupedAttendeesSilently = createAsyncThunk(
  "attendees/grouped/fetchData/silently",
  async ({ page = 1, limit = 10, filters = {}, sort }, { rejectWithValue }) => {
    try {
      const response = await instance.post(
        `/attendees/grouped`,
        { filters, fieldName: "attendeeTableConfig", sort },
        {
          params: { page, limit },
        }
      );
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//Update Attendee
export const updateAttendeeLeadType = createAsyncThunk(
  "attendee/lead-type/update",
  async (
    { email = "", leadType = "", createdBy, leadTypeLabel },
    { rejectWithValue }
  ) => {
    try {
      const response = await instance.post(`/attendee-association`, {
        email,
        leadType,
        createdBy,
        leadTypeLabel,
      });
      return response;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getAttendeeLeadTypeByEmail = createAsyncThunk(
  "attendee/lead-type/fetchData",
  async (email, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/attendee-association/${email}`);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get All Attendees
export const getWebinarEnrollments = createAsyncThunk(
  "enrollments/webinar",
  async ({ id, page = 1, limit = 10, product }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`/enrollments/webinar/${id}`, {
        params: { page, limit, product },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//get All Attendees
// export const getEnrollments = createAsyncThunk(
//   "enrollments/attendee",
//   async ({ id, page = 1, limit = 10 }, { rejectWithValue }) => {
//     try {
//       const response = await instance.get(`/enrollments/attendee/${id}`, {
//         params: { page, limit },
//       });
//       return response?.data;
//     } catch (e) {
//       return rejectWithValue(e);
//     }
//   }
// );

//Add Enrollment
export const addEnrollment = createAsyncThunk(
  "addEnrollment/attendee",
  async (data, { rejectWithValue }) => {
    try {
      const response = await instance.post(`/enrollments`, data);
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

//swap Attendee Fields
export const swapAttendeeFields = createAsyncThunk(
  "attendee/swap",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await instance.put(`/attendees/swap`, payload);
      return {
        data,
        ...payload,
      };
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const deleteWebinarAttendees = createAsyncThunk(
  "deleteWebinarAttendees",
  async ({ attendees, webinarId }, { rejectWithValue }) => {
    try {
      const response = await instance.delete(`/attendees/webinar`, {
        data: {
          attendees,
          webinarId,
        },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const deleteAllAttendeesData = createAsyncThunk(
  "deleteAllAttendeesData",
  async ({ attendees }, { rejectWithValue }) => {
    try {
      const response = await instance.delete(`/attendees/all`, {
        data: { attendees },
      });
      return response?.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const getAttendeeLogs = createAsyncThunk(
  "attendee/logs",
  async (
    { email, action, endDate, startDate, limit, page },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await instance.get(`/attendee-log/${email}`, {
        params: {
          action,
          endDate,
          startDate,
          limit,
          page,
        },
      });
      return data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
