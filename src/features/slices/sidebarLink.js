// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

import { toast } from "sonner";
import { addSidebarLink, deleteSidebarLink, getAllSidebarLinks, getAllSidebarLinksForSuperAdmin } from "../actions/sidebarLink";
import { errorToast, successToast } from "../../utils/extra";

const initialState = {
  isLoading: false,
  sidebarLinkData: [],
  allSidebarLinks: [],
  totalPages: null,
  errorMessage: "",
};

// ---------------------------------------------------------------------------------------

export const sidebarLinkSlice = createSlice({
  name: "sidebarLink",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      .addCase(addSidebarLink.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(addSidebarLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        successToast("Product updated Successfully")
      })
      .addCase(addSidebarLink.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        console.log('its madafaka console',action.payload);
   
        errorToast(action.payload);
      })
      .addCase(getAllSidebarLinks.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(getAllSidebarLinks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        state.sidebarLinkData = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getAllSidebarLinks.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action.payload);
      })
      .addCase(getAllSidebarLinksForSuperAdmin.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(getAllSidebarLinksForSuperAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        state.allSidebarLinks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getAllSidebarLinksForSuperAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action.payload);
      })
      .addCase(deleteSidebarLink.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(deleteSidebarLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
      })
      .addCase(deleteSidebarLink.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action.payload);
      });
  },
});

// -------------------------------------------------------------------------

// Action creators are generated for each case reducer function
export const {} = sidebarLinkSlice.actions;
export default sidebarLinkSlice.reducer;

// ================================================== THE END ==================================================
