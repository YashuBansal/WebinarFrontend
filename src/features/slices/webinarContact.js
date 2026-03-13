// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";
import {
  getAllWebinars,
  getAllWebinarsForPage,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  getEmployeeWebinars,
  getAssignedEmployees,
  getAllWebinarsSilently,
} from "../actions/webinarContact";
import { errorToast, successToast } from "../../utils/extra";

const initialState = {
  isLoading: false,
  isCreating: false,
  webinarData: [],
  webinarPageData: [],
  totalPages: null,
  isSuccess: false,
  errorMessage: "",
  assignedEmployees: [],
  pagination: {
    totalPages: 1,
    page: 1,
    total: 0,
    limit: 10,
  },
};

// ---------------------------------------------------------------------------------------

export const webinarContactSlice = createSlice({
  name: "webinarContact",
  initialState,
  reducers: {
    resetWebinarSuccess: (state) => {
      state.isSuccess = false;
    },
    clearWebinarError: (state) => {
      state.errorMessage = "";
    },

    clearAssignedEmployees: (state) => {
      state.assignedEmployees = [];
    },

    clearWebinarData: (state) => {
      console.log("clearing webinarData");
      state.webinarData = [];
      state.pagination = {
        totalPages: 1,
        page: 1,
        total: 0,
        limit: 10,
      };
    },
    clearWebinarPageData: (state) => {
      console.log("clearing webinarPageData");
      state.webinarPageData = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllWebinars.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getAllWebinars.fulfilled, (state, action) => {
        state.isLoading = false;
        const { result = [], pagination = {} } = action.payload;
        state.webinarData = result;
        state.pagination = pagination;
      })
      .addCase(getAllWebinars.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAllWebinarsForPage.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getAllWebinarsForPage.fulfilled, (state, action) => {
        state.isLoading = false;
        const { result = [], pagination = {} } = action.payload;
        state.webinarPageData = result;
        state.pagination = pagination;
      })
      .addCase(getAllWebinarsForPage.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getAllWebinarsSilently.pending, (state, action) => {})
      .addCase(getAllWebinarsSilently.fulfilled, (state, action) => {
        const { result = [], pagination = {} } = action.payload;
        state.webinarPageData = result;
        state.pagination = pagination;
      })
      .addCase(getAllWebinarsSilently.rejected, (state, action) => {
        errorToast(action?.payload);
      })
      .addCase(createWebinar.pending, (state, action) => {
        state.isCreating = true;
        state.errorMessage = "";
        state.isSuccess = false;
      })
      .addCase(createWebinar.fulfilled, (state, action) => {
        state.isCreating = false;
        state.errorMessage = "";
        state.isSuccess = true;
        successToast("Webinar Created Successfully");
      })
      .addCase(createWebinar.rejected, (state, action) => {
        state.isCreating = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(updateWebinar.pending, (state, action) => {
        state.isCreating = true;
        state.errorMessage = "";
        state.isSuccess = false;
      })
      .addCase(updateWebinar.fulfilled, (state, action) => {
        state.isCreating = false;
        state.errorMessage = "";
        state.isSuccess = true;
        successToast("Webinar Updated Successfully");
      })
      .addCase(updateWebinar.rejected, (state, action) => {
        state.isCreating = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(deleteWebinar.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(deleteWebinar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(deleteWebinar.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getEmployeeWebinars.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getEmployeeWebinars.fulfilled, (state, action) => {
        state.isLoading = false;
        state.webinarData = action.payload || [];
      })
      .addCase(getEmployeeWebinars.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      .addCase(getAssignedEmployees.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getAssignedEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assignedEmployees = action.payload || [];
      })
      .addCase(getAssignedEmployees.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      });
  },
});

// -------------------------------------------------------------------------

// Action creators are generated for each case reducer function
export const {
  resetAttendeeContactDetails,
  resetWebinarSuccess,
  clearWebinarError,
  clearAssignedEmployees,
  clearWebinarData,
  clearWebinarPageData,
} = webinarContactSlice.actions;
export default webinarContactSlice.reducer;

// ================================================== THE END ==================================================
