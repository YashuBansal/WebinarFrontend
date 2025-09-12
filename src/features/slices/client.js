// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

import { toast } from "sonner";

import {
  getAllClients,
  getClientById,
  clientSignup,
  updateClient,
  getAllClientsForDropdown,
  updateClientPlan,
  softDeleteClient,
  hardDeleteData,
} from "../actions/client";
import { errorToast, successToast } from "../../utils/extra";

const initialState = {
  isLoading: false,
  isUpdating: false,
  isSuccess: false,
  totalPages: null,
  errorMessage: "",
  clientsData: [],
  singleClientData: null,
  clientsDropdownData: [],
};

// ---------------------------------------------------------------------------------------

export const clientSlce = createSlice({
  name: "client",
  initialState,
  reducers: {
    resetClientState: (state) => {
      state.isSuccess = false;
    },

    clearSingleClientData: (state) => {
      state.singleClientData = null;
    },
    clearClientData: (state) => {
      state.clientsData = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllClients.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(getAllClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        state.clientsData = action.payload?.result || [];
        state.totalPages = action.payload?.totalPages;
      })
      .addCase(getAllClients.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(getClientById.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(getClientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        state.singleClientData = action.payload;
      })
      .addCase(getClientById.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(clientSignup.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(clientSignup.fulfilled, (state, action) => {
        state.isLoading = false;
        successToast("New Client Account Created Successfully")
      })
      .addCase(clientSignup.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(updateClient.pending, (state, action) => {
        state.isUpdating = true;
        state.isSuccess = false;
        state.errorMessage = "";
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.isSuccess = true;
        successToast("Client Updated Successfully")
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isUpdating = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(softDeleteClient.pending, (state, action) => {
        state.isUpdating = true;
        state.isSuccess = false;
        state.errorMessage = "";
      })
      .addCase(softDeleteClient.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.isSuccess = true;
        successToast("Client Soft Deleted Successfully")
      })
      .addCase(softDeleteClient.rejected, (state, action) => {
        state.isUpdating = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
       .addCase(hardDeleteData.pending, (state, action) => {
        state.isUpdating = true;
        state.isSuccess = false;
        state.errorMessage = "";
      })
      .addCase(hardDeleteData.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.isSuccess = true;
        successToast("Client Permanent Deleted Successfully")
      })
      .addCase(hardDeleteData.rejected, (state, action) => {
        state.isUpdating = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(getAllClientsForDropdown.fulfilled, (state, action) => {
        state.clientsDropdownData = Array.isArray(action.payload)? action.payload : [];
      })
      .addCase(getAllClientsForDropdown.rejected, (state, action) => {
        errorToast(action?.payload);
      })
      .addCase(updateClientPlan.pending, (state, action) => {
        state.isUpdating = true;
        state.isSuccess = false;
      })
      .addCase(updateClientPlan.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.isSuccess = true;
        successToast("Client Plan Updated Successfully")
      })
      .addCase(updateClientPlan.rejected, (state, action) => {
        state.isUpdating = false;
        errorToast(action?.payload);
      });
  },
});

// -------------------------------------------------------------------------

// Action creators are generated for each case reducer function
export const {resetClientState, clearClientData, clearSingleClientData} = clientSlce.actions;
export default clientSlce.reducer;

// ================================================== THE END ==================================================
