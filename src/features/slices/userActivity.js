// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

import { addUserActivity, getUserActivity, getUserActivityOfEmployees, getUserActivitySilently } from "../actions/userActivity.js";
import { errorToast } from "../../utils/extra.js";

const initialState = {
  isLoading: false,
  userActivities: [],
  totalPages: 1,
  isEmployee: false,
  employeeActivities: [],
};

// ---------------------------------------------------------------------------------------

export const userActivitySlice = createSlice({
  name: "userActivity",
  initialState,
  reducers: {
    resetUserActivities: (state) => {
      state.userActivities = [];
    },
    setIsEmployee: (state, action) => {
      state.isEmployee = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addUserActivity.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(addUserActivity.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(addUserActivity.rejected, (state, action) => {
        state.isLoading = false;
      })
      .addCase(getUserActivity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userActivities = action.payload?.data || [];
        state.totalPages = action.payload?.pagination?.totalPages || 1;
      })
      .addCase(getUserActivity.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action.payload);
      })
      .addCase(getUserActivitySilently.fulfilled, (state, action) => {
        state.userActivities = action.payload?.data || [];
        state.totalPages = action.payload?.pagination?.totalPages || 1;
      })
      .addCase(getUserActivityOfEmployees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserActivityOfEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employeeActivities = action.payload || [];
      })
      .addCase(getUserActivityOfEmployees.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action.payload);
      });
  },
});

// -------------------------------------------------------------------------

// Action creators are generated for each case reducer function
export const { resetUserActivities ,setIsEmployee } = userActivitySlice.actions;
export default userActivitySlice.reducer;

// ================================================== THE END ==================================================


export const selectEmployeeActivities = (state) => state.userActivity.employeeActivities;