// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";
import { errorToast, successToast } from "../../utils/extra";
import {
  addLocation,
  addLocations,
  approveLocation,
  disapproveLocation,
  getLocationRequests,
  getLocations,
  updateLocationState,
} from "../actions/location";

const initialState = {
  isLoading: false,
  isSuccess: false,
  isFormLoading: false,
  locationsData: [],
  locationRequests: [],
  globalLocationsData: [],
  totalPages: 1,
  errorMessage: "",
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
  isImporting: false,
};

// ---------------------------------------------------------------------------------------

export const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    resetLocationSuccess: (state) => {
      state.isSuccess = false;
    },
    resetLocationData: (state) => {
      state.locationsData = [];
      state.locationRequests = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLocations.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data = [], pagination = {}, global } = action.payload;
        if (global) {
          state.globalLocationsData = data;
        } else {
          state.locationsData = data;
          state.pagination = pagination;
        }
      })
      .addCase(getLocations.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getLocationRequests.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getLocationRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data = [], pagination = {} } = action.payload;
        state.locationRequests = data;
        state.pagination = pagination;
      })
      .addCase(getLocationRequests.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      .addCase(addLocations.pending, (state, action) => {
        state.isImporting = true;
        state.isSuccess = false;
      })
      .addCase(addLocations.fulfilled, (state, action) => {
        state.isImporting = false;
        state.isSuccess = true;
        const { message } = action.payload || {};
        if (typeof message === "string") {
          successToast(message);
        } else successToast("Location added successfully.");
      })
      .addCase(addLocations.rejected, (state, action) => {
        state.isImporting = false;
        errorToast(action?.payload);
      })
      .addCase(addLocation.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(addLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // state.locationRequests = action.payload
        successToast("Location added/request sent.");
      })
      .addCase(addLocation.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(approveLocation.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(approveLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Location Approved.");
      })
      .addCase(approveLocation.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(disapproveLocation.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(disapproveLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Location DisApproved.");
      })
      .addCase(disapproveLocation.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(updateLocationState.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateLocationState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Location Updated Successfully.");
      })
      .addCase(updateLocationState.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      });
  },
});

// --------------------------------------------------------------------
// Action creators are generated for each case reducer function
export const { resetLocationData, resetLocationSuccess } =
  locationSlice.actions;
export default locationSlice.reducer;

// ================================================== THE END ==============
