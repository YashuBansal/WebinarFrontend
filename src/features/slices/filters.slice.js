import { createSlice } from "@reduxjs/toolkit";
import {
  allAttendeesSortByOptions,
  salesAttendeesSortByOptions,
  webinarAttendeesSortByOptions,
} from "../../utils/columnData";
// -------------------------------------------------------------------------------------------

const initialState = {
  allAttendeesFilters: {},
  allAttendeesSortBy: {
    sortBy: allAttendeesSortByOptions[0].value,
    sortOrder: "asc",
  },
  webinarAttendeesFilters: {},
  webinarAttendeesSortBy: {
    sortBy: webinarAttendeesSortByOptions[0].value,
    sortOrder: "desc",
  },
  salesAttendeesSortBy: {
    sortBy: salesAttendeesSortByOptions[0].value,
    sortOrder: "desc",
  },
};

// -------------------------------------- Slices------------------------------------------------
const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setAllAttendeesFilters: (state, action) => {
      if (action.payload) {
        if (action.payload.filters)
          state.allAttendeesFilters = action.payload.filters;
        if (action.payload.sortBy)
          state.allAttendeesSortBy = action.payload.sortBy;
      } else {
        state.allAttendeesFilters = {};
        state.allAttendeesSortBy = {
          sortBy: allAttendeesSortByOptions[0].value,
          sortOrder: "asc",
        };
      }
    },

    setWebinarAttendeesFilters: (state, action) => {
      if (action.payload) {
        if (action.payload.filters)
          state.webinarAttendeesFilters = action.payload.filters;
        if (action.payload.sortBy) {
          if (action.payload.recordType === "postWebinar") {
            state.salesAttendeesSortBy = action.payload.sortBy;
          } else {
            state.webinarAttendeesSortBy = action.payload.sortBy;
          }
        }
      } else {
        state.webinarAttendeesFilters = {};
      }
    },
  },
});

// ===========================================Exports==================================================

export default filtersSlice.reducer;
export const { setAllAttendeesFilters, setWebinarAttendeesFilters } =
  filtersSlice.actions;
