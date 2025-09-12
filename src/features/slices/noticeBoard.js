import { createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { updateNoticeBoard, getNoticeBoard } from "../actions/noticeBoard";
import { errorToast, successToast } from "../../utils/extra";

const initialState = {
  isLoading: false,
  isSuccess: false,
  noticeData: null,
  isUpdated: false,
};

export const noticeBoardSlice = createSlice({
  name: "noticeBoard",
  initialState,
  reducers: {
    resetSuccessAndUpdate: (state) => {
      state.isSuccess = false;
      state.isUpdated = false;
    },

    setNoticeBoardUpdated: (state, action) => {
      state.noticeData = action.payload;
    },
    clearNoticeBoardUpdated: (state, action) => {
      state.noticeData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateNoticeBoard.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateNoticeBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(updateNoticeBoard.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      // Get Notice Board
      .addCase(getNoticeBoard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getNoticeBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        const newNoticeData = action.payload;

        // Check if updatedAt has changed
        if (
          !state.noticeData ||
          (state.noticeData?.updatedAt &&
            newNoticeData?.updatedAt &&
            state.noticeData.updatedAt !== newNoticeData?.updatedAt)
        ) {
          state.isUpdated = true;
        }

        state.noticeData = newNoticeData;
      })
      .addCase(getNoticeBoard.rejected, (state, action) => {
        state.isLoading = false;
      });
  },
});

export const { resetSuccessAndUpdate, setNoticeBoardUpdated, clearNoticeBoardUpdated } =
  noticeBoardSlice.actions;
export default noticeBoardSlice.reducer;
