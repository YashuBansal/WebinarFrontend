import { createAsyncThunk } from "@reduxjs/toolkit";
import { instance } from "../../services/axiosInterceptor";
import { addUserActivity } from "./userActivity";

export const exportClientExcel = createAsyncThunk(
  "client/exportExcel",
  async (
    { limit = 100, columns = "", filters = {} },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `clients-${timestamp}.xlsx`;

      const response = await instance.post(`export-excel/client`, filters, {
        params: { limit, columns, fileName },
        responseType: "blob", // Ensure you get the file as a binary Blob
      });

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Clients, limit: ${limit}`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportWebinarAttendeesExcel = createAsyncThunk(
  "webinarAttendees/exportExcel",
  async (payload = {}, { rejectWithValue, dispatch }) => {
    try {
      // replace spaces with hyphen
      const webinarName = (payload.webinarName || "WebinarAttendees").replace(
        /\s+/g,
        "-"
      );
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `${webinarName}-attendees-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/webinar-attendees`,
        { fieldName: "attendeeTableConfig", ...payload, fileName },
        {
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        getUserDocuments({
          page: 1,
          limit: 10,
        })
      );

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Attendees, limit: ${
            !payload.limit ? "All" : payload.limit
          }`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportGroupedAttendeesExcel = createAsyncThunk(
  "groupedAttendees/exportExcel",
  async (payload = {}, { rejectWithValue, dispatch }) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `attendees-${timestamp}.xlsx`;
      const response = await instance.post(
        `export-excel/attendees`,
        { fieldName: "attendeeTableConfig", ...payload, fileName },
        {
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        getUserDocuments({
          page: 1,
          limit: 10,
        })
      );

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Attendees, limit: ${
            !payload.limit ? "All" : payload.limit
          }`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportWebinarExcel = createAsyncThunk(
  "webinar/exportExcel",
  async (
    { limit = 100, columns = [], filters = {} },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `webinars-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/webinars`,
        { filters, columns, fileName },
        {
          params: { limit },
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Webinars, limit: ${limit}`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportEmployeeAssignmentsExcel = createAsyncThunk(
  "employee/assignments/exportExcel",
  async (
    {
      id = "",
      limit,
      filters = {},
      webinarId = "",
      validCall,
      assignmentStatus = "",
      sort,
      validCallFlag,
      columns = [],
      employee,
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const now = new Date();
      const employeeName = (employee || "EmployeeName").replace(/\s+/g, "-");
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `${employeeName}-employee-assignments-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/employee-assignments/${id}`,
        {
          filters,
          validCall,
          assignmentStatus,
          sort,
          validCallFlag,
          fieldName: "attendeeTableConfig",
          fileName,
          columns,
        },
        {
          params: { limit, webinarId },
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Webinars, limit: ${limit}`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportProductRevenue = createAsyncThunk(
  "export/product/revenue",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `${payload.uniqueId}-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/product-revenue`,
        {
          ...payload,
          fileName,
        },
        {
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportClientBillings = createAsyncThunk(
  "client/billing-history",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `client-bills-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/client-billing`,
        {
          ...payload,
          fileName,
        },
        {
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportWebinarEnrollments = createAsyncThunk(
  "export/enrollments",
  async (payload, { rejectWithValue }) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const webinarName = (payload.webinarName || "Webinar").replace(
        /\s+/g,
        "-"
      );

      const fileName = `${webinarName}-enrollments-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/enrollments`,
        {
          ...payload,
          fileName,
        },
        {
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportUserActivitiesByUser = createAsyncThunk(
  "user-activities/user/exportExcel",
  async (
    { limit = 100, columns = [], filters = {}, userId },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await instance.post(
        `export-excel/user-activity/${userId}`,
        { filters, columns },
        {
          params: { limit },
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", "clients.xlsx");

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Webinars, limit: ${limit}`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const exportEmployeesExcel = createAsyncThunk(
  "employee/exportExcel",
  async (
    { limit = 100, columns = [], filters = {} },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/Z$/, "");

      const fileName = `webinars-${timestamp}.xlsx`;

      const response = await instance.post(
        `export-excel/employees`,
        { filters, columns, fileName },
        {
          params: { limit },
          responseType: "blob", // Ensure you get the file as a binary Blob
        }
      );

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      dispatch(
        addUserActivity({
          action: "export",
          details: `User Exported the Employees, limit: ${limit}`,
        })
      );

      return true; // Optional: Return a success status
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getUserDocuments = createAsyncThunk(
  "userDocuments/getUserDocuments",
  async ({ page = 1, limit = 10, bell }, { rejectWithValue }) => {
    try {
      const { data } = await instance.get(`export-excel/user-documents`, {
        params: { page, limit },
      });
      return { ...data, bell };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getUserDocument = createAsyncThunk(
  "userDocuments/getUserDocument",
  async ({ id, fileName }, { rejectWithValue }) => {
    try {
      const response = await instance.get(`export-excel/user-documents/${id}`, {
        responseType: "blob", // Ensure you get the file as a binary Blob
      });

      // Automatically trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name for download
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up after download

      return true; // Optional: Return a success status
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const deleteUserDocument = createAsyncThunk(
  "userDocuments/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await instance.delete(
        `export-excel/user-documents/${id}`
      ); // Optional: Return a success status
      return { id };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
