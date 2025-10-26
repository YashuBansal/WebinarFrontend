// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";
import { errorToast, successToast } from "../../utils/extra";
import { getPullbacks } from "../actions/assign";
import {
  addAttendees,
  addEnrollment,
  swapAttendeeFields,
  getAttendee,
  getAttendeeLeadTypeByEmail,
  getAttendees,
  // getEnrollments,
  getWebinarEnrollments,
  updateAttendee,
  updateAttendeeLeadType,
  fetchGroupedAttendees,
  getAttendeesSilently,
  fetchGroupedAttendeesSilently,
  deleteWebinarAttendees,
  deleteAllAttendeesData,
  getAttendeeLogs,
  getWebinarParticipants,
  updateAttendeeTag,
} from "../actions/attendees";

const initialState = {
  isLoading: false,
  isSuccess: false,
  selectedAttendee: [],
  attendeeData: [],
  attendeeEnrollments: [],
  webinarEnrollments: [],
  enrollmentCounts: {},
  singleAttendeeData: null,
  totalPages: 1,
  errorMessage: "",
  tabValue: "preWebinar",
  attendeeLeadType: {},
  pagination: {},
  isSwapping: false,
  isImporting: false,
  isDeleting: false,
  attendeeLogs: [],
  attendeeLogsPagination: {},
  isLogsLoading: false,
  webinarName: "",
  webinarParticipants: [],
};
// ---------------------------------------------------------------------------------------

export const attendeeSlice = createSlice({
  name: "attendee",
  initialState,
  reducers: {
    clearSuccess(state) {
      state.isSuccess = false;
    },
    clearAttendeeData(state) {
      state.attendeeData = [];
      state.webinarName = "";
    },
    setTabValue(state, action) {
      state.tabValue = action.payload;
    },
    clearLeadType(state) {
      state.attendeeLeadType = {};
      state.attendeeEnrollments = [];
      state.selectedAttendee = [];
    },
    clearAttendeeLogs: (state) => {
      state.attendeeLogs = [];
    },

    clearWebinarParticipants: (state) => {
      state.webinarParticipants = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addAttendees.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isImporting = true;
      })
      .addCase(addAttendees.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isImporting = false;
        successToast("Attendees Added Successfully");
      })
      .addCase(addAttendees.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
        state.isImporting = false;
      })
      .addCase(updateAttendeeTag.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateAttendeeTag.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Attendees Tag Added Successfully");
      })
      .addCase(updateAttendeeTag.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(updateAttendee.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateAttendee.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("attendees Updated Successfully");
      })
      .addCase(updateAttendee.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAttendee.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAttendee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedAttendee = action.payload || [];
      })
      .addCase(getAttendee.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAttendeeLogs.pending, (state) => {
        state.isLogsLoading = true;
      })
      .addCase(getAttendeeLogs.fulfilled, (state, action) => {
        state.isLogsLoading = false;
        const { data = [], pagination = {} } = action.payload;
        state.attendeeLogs = data;
        state.attendeeLogsPagination = pagination;
      })
      .addCase(getAttendeeLogs.rejected, (state, action) => {
        state.isLogsLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAttendees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAttendees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendeeData = action.payload?.result || [];
        state.pagination = action.payload?.pagination || {};
        state.webinarName = action.payload?.webinarName || "";
      })

      .addCase(getAttendees.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      .addCase(getWebinarParticipants.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getWebinarParticipants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.webinarParticipants = Array.isArray(action.payload)
          ? action.payload
          : [];
      })

      .addCase(getWebinarParticipants.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAttendeesSilently.pending, (state) => {})
      .addCase(getAttendeesSilently.fulfilled, (state, action) => {
        state.attendeeData = action.payload?.result || [];
        state.pagination = action.payload?.pagination || {};
      })
      .addCase(getAttendeesSilently.rejected, (state, action) => {
        errorToast(action?.payload);
      })
      .addCase(getPullbacks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPullbacks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendeeData = action.payload || [];
      })

      .addCase(getPullbacks.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(updateAttendeeLeadType.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateAttendeeLeadType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Lead Type Updated Successfully");
      })
      .addCase(updateAttendeeLeadType.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAttendeeLeadTypeByEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAttendeeLeadTypeByEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendeeLeadType = action.payload || {};
      })
      .addCase(getAttendeeLeadTypeByEmail.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      // .addCase(getEnrollments.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(getEnrollments.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.attendeeEnrollments = action?.payload?.result || [];
      // })
      // .addCase(getEnrollments.rejected, (state, action) => {
      //   state.isLoading = false;
      //   errorToast(action?.payload);
      // })

      .addCase(getWebinarEnrollments.pending, (state) => {
        state.isLoading = true;
        state.enrollmentCounts = {};
      })
      .addCase(getWebinarEnrollments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.webinarEnrollments = action?.payload?.result || [];
        state.enrollmentCounts = {
          totalRevenue: action?.payload?.totalRevenue || 0,
          totalEnrollments: action?.payload?.totalEnrollments || 0,
        };
        state.totalPages = action?.payload?.totalPages || 1;
      })
      .addCase(getWebinarEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      .addCase(addEnrollment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addEnrollment.fulfilled, (state, action) => {
        state.isLoading = false;
        successToast("Enrollment Added Successfully");
      })
      .addCase(addEnrollment.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(swapAttendeeFields.pending, (state) => {
        state.isSwapping = true;
        state.isSuccess = false;
      })

      .addCase(swapAttendeeFields.fulfilled, (state, action) => {
        state.isSwapping = false;
        state.isSuccess = true;
        successToast(" Attendees Swapped Successfully");
      })
      .addCase(swapAttendeeFields.rejected, (state, action) => {
        state.isSwapping = false;
        errorToast(action?.payload);
      })
      .addCase(fetchGroupedAttendees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchGroupedAttendees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendeeData = action?.payload?.data || [];
        state.pagination = action?.payload?.pagination || {};
      })
      .addCase(fetchGroupedAttendees.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(fetchGroupedAttendeesSilently.fulfilled, (state, action) => {
        state.attendeeData = action?.payload?.data || [];
        state.pagination = action?.payload?.pagination || {};
      })
      .addCase(fetchGroupedAttendeesSilently.rejected, (state, action) => {
        errorToast(action?.payload);
      })
      .addCase(deleteWebinarAttendees.pending, (state) => {
        state.isDeleting = true;
        state.isSuccess = false;
      })
      .addCase(deleteWebinarAttendees.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.isSuccess = true;
        successToast("Attendees Deleted Successfully");
      })
      .addCase(deleteWebinarAttendees.rejected, (state, action) => {
        state.isDeleting = false;
        errorToast(action?.payload);
      })
      .addCase(deleteAllAttendeesData.pending, (state) => {
        state.isDeleting = true;
        state.isSuccess = false;
      })
      .addCase(deleteAllAttendeesData.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.isSuccess = true;
        successToast("Attendees Deleted Successfully");
      })
      .addCase(deleteAllAttendeesData.rejected, (state, action) => {
        state.isDeleting = false;
        errorToast(action?.payload);
      });
  },
});

// -------------------------------------------------------------------------

// Action creators are generated for each case reducer function
export const {
  clearSuccess,
  setTabValue,
  clearLeadType,
  clearAttendeeLogs,
  clearAttendeeData,
  clearWebinarParticipants,
} = attendeeSlice.actions;
export default attendeeSlice.reducer;

// ================================================== THE END ==================================================
