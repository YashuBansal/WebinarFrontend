// ----------------------------------------------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

import { toast } from "sonner";

import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getAllProductsByAdminId,
  // getProductLevelCounts,
  // getEnrollmentsByProductLevel,
  getEnrollmentsByEmail,
  updateProduct,
  getEnrollmentsByLevelOrId,
} from "../actions/product";
import { errorToast, successToast } from "../../utils/extra";

const initialState = {
  isLoading: false,
  productData: [],
  isSuccess: false,
  productDropdownData: [],
  totalPages: 1,
  errorMessage: "",
  productLevelCounts: [],
  enrollmentsByEmail: [],
  enrollmentsByProductLevel: [],
  enrollmentsData: [],
  pagination: {},
};

// ---------------------------------------------------------------------------------------

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearEnrollmentsByProductLevel: (state) => {
      state.enrollmentsByProductLevel = [];
    },
    resetProductState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.errorMessage = "";
    },
    clearProductData: (state) => {
      state.productData = [];
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(addProduct.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Product Added Successfully");
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      .addCase(updateProduct.pending, (state, action) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        successToast("Product updated Successfully");
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })

      .addCase(getAllProducts.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productData = action.payload?.result || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(getAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })
      .addCase(getAllProductsByAdminId.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(getAllProductsByAdminId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        state.productDropdownData = action.payload;
      })
      .addCase(getAllProductsByAdminId.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })

      .addCase(deleteProduct.pending, (state, action) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = "";
        successToast(action?.payload?.data);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload;
        errorToast(action?.payload);
      })

      // .addCase(getProductLevelCounts.pending, (state, action) => {
      //   state.isLoading = true;
      // })
      // .addCase(getProductLevelCounts.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.productLevelCounts = action.payload;
      // })
      // .addCase(getProductLevelCounts.rejected, (state, action) => {
      //   state.isLoading = false;
      //   errorToast(action?.payload);
      // })

      // .addCase(getEnrollmentsByProductLevel.pending, (state, action) => {
      //   state.isLoading = true;
      // })
      // .addCase(getEnrollmentsByProductLevel.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.enrollmentsByProductLevel = action.payload;
      // })
      // .addCase(getEnrollmentsByProductLevel.rejected, (state, action) => {
      //   state.isLoading = false;
      //   errorToast(action?.payload);
      // })

      .addCase(getEnrollmentsByEmail.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getEnrollmentsByEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrollmentsByEmail = action.payload;
      })
      .addCase(getEnrollmentsByEmail.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      })
      .addCase(getEnrollmentsByLevelOrId.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getEnrollmentsByLevelOrId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrollmentsData = action.payload?.data || [];
        state.pagination = action.payload?.pagination || {};
      })
      .addCase(getEnrollmentsByLevelOrId.rejected, (state, action) => {
        state.isLoading = false;
        errorToast(action?.payload);
      });
  },
});

// -------------------------------------------------------------------------

// Action creators are generated for each case reducer function
export const {
  resetProductState,
  clearEnrollmentsByProductLevel,
  clearProductData,
} = productSlice.actions;
export default productSlice.reducer;

// ================================================== THE END ==================================================
