import { createSlice } from "@reduxjs/toolkit";
import {
  deleteUserDocumet,
  generateOTP,
  getAllRoles,
  getCurrentUser,
  getSuperAdmin,
  logIn,
  signUp,
  updatePassword,
  updateUser,
  updateWhatsappToken,
  validateOTP,
  generatePablyToken,
  generateTokenFor2FA,
  VerifyAndToggle2FA,
  getCurrentUserForUpdate,
  getGSTValue,
  expireTokenStatus,
} from "../actions/auth";
import { errorToast, successToast } from "../../utils/extra";
import { socket } from "../../socket";
// -------------------------------------------------------------------------------------------

// initialState -- initial state of authentication
const initialState = {
  isLoading: false,
  isLoggingIn: false,
  errorMessage: "",
  isUserLoggedIn: false,
  userData: null,
  isSuccess: false,
  isOTPGenerated: false,
  isRolesLoading: false,
  roles: [],
  superAdminData: null,
  isSomethingStillLoading: false,
  secretToken: null,
  GST_VALUE: 0,
  HEADER_LABEL: undefined
};

// -------------------------------------- Slices------------------------------------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      socket.disconnect();
      state.isUserLoggedIn = false;
      state.userData = null;
    },
    clearLoadingAndData: (state) => {
      state.isLoading = false;
      state.userData = null;
    },
    clearAuthLoading: (state) => {
      state.isLoggingIn = false;
    },
    clearOTPGenerated: (state) => {
      state.isOTPGenerated = false;
      state.isSuccess = false;
    },
    clearSecretToken: (state) => {
      state.secretToken = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // signUp lifecycle methods
      .addCase(signUp.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userData = action.payload.data;
        successToast("New Account Created Successfully");
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })

      .addCase(expireTokenStatus.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(expireTokenStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Token Expired Successfully");
      })
      .addCase(expireTokenStatus.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(logIn.pending, (state, action) => {
        state.isLoggingIn = true;
        state.isUserLoggedIn = false;
      })
      .addCase(logIn.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        if (!action.payload.twoFa) {
          state.isUserLoggedIn = true;
          state.userData = action.payload;
          successToast("Login Successfully");
        }
      })
      .addCase(logIn.rejected, (state, action) => {
        state.isLoggingIn = false;
        errorToast(action?.payload);
      })
      // Login cases
      .addCase(updateUser.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
        state.isSuccess = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userData = action.payload?.data || action.payload;
        state.isSuccess = true;
        successToast("User Updated Successfully");
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(updatePassword.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
        state.isSuccess = false;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("User Password Updated Successfully");
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(getAllRoles.pending, (state, action) => {
        state.isRolesLoading = true;
      })
      .addCase(getAllRoles.fulfilled, (state, action) => {
        state.isRolesLoading = false;
        state.roles = action.payload;
      })
      .addCase(getAllRoles.rejected, (state, action) => {
        state.isRolesLoading = false;
      })
      .addCase(getGSTValue.fulfilled, (state, action) => {
        if (typeof action.payload?.GST_VALUE === "number" && action.payload.GST_VALUE >= 0)
          state.GST_VALUE = action.payload.GST_VALUE;
        else {
          state.GST_VALUE = 0;
        }
        state.HEADER_LABEL = action.payload?.HEADER_LABEL;
      })
      .addCase(getGSTValue.rejected, (state, action) => {
        errorToast(action?.payload || "Error getting user subscription");
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.userData = action.payload?.data;
      })
      .addCase(getCurrentUserForUpdate.fulfilled, (state, action) => {
        state.userData = action.payload?.data;
      })
      .addCase(deleteUserDocumet.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(deleteUserDocumet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userData = action.payload;
        state.isSuccess = true;
        successToast("User Deleted Successfully");
      })
      .addCase(deleteUserDocumet.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getSuperAdmin.fulfilled, (state, action) => {
        state.superAdminData = action.payload || null;
      })
      .addCase(generateOTP.pending, (state, action) => {
        state.isSomethingStillLoading = true;
        state.isOTPGenerated = false;
      })
      .addCase(generateOTP.fulfilled, (state, action) => {
        state.isSomethingStillLoading = false;
        state.isOTPGenerated = true;
        successToast("OTP Generated Successfully");
      })
      .addCase(generateOTP.rejected, (state, action) => {
        state.isSomethingStillLoading = false;
        errorToast(action?.payload);
      })
      .addCase(validateOTP.pending, (state, action) => {
        state.isSomethingStillLoading = true;
        state.isSuccess = false;
      })

      .addCase(validateOTP.fulfilled, (state, action) => {
        state.isSomethingStillLoading = false;
        state.isSuccess = true;
        successToast(
          "OTP Validated Successfully! A new password has been sent to your email. Please check your mail and reset your password."
        );
      })
      .addCase(validateOTP.rejected, (state, action) => {
        state.isSomethingStillLoading = false;
        errorToast(action?.payload);
      })
      .addCase(updateWhatsappToken.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateWhatsappToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Whatsapp Token Updated Successfully");
      })
      .addCase(updateWhatsappToken.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(generatePablyToken.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(generatePablyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        successToast("Pabbly Token Generated Successfully");
      })
      .addCase(generatePablyToken.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(generateTokenFor2FA.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(generateTokenFor2FA.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        console.log(action.payload);
        state.secretToken = action.payload.secret;
        successToast("Security Code Generated Successfully");
      })
      .addCase(generateTokenFor2FA.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(VerifyAndToggle2FA.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(VerifyAndToggle2FA.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Security Code Verified Successfully");
      })
      .addCase(VerifyAndToggle2FA.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      });
  },
});

// ===========================================Exports==================================================
export default authSlice.reducer;
export const {
  logout,
  clearLoadingAndData,
  clearOTPGenerated,
  clearAuthLoading,
  clearSecretToken,
} = authSlice.actions;

export const getUserData = (state) => state.auth.userData;


export const getGSTStateValue = (state) => state.auth.GST_VALUE || 0;