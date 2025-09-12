import { toast } from "sonner";

// constants/activityActions.js
export const ActivityActions = {
  LOGIN: "login/refresh",
  LOGOUT: "logout",
  INACTIVE: "inactive",
  REACTIVE: "reActive",
  NAVIGATE: "navigate",
  EDIT: "edit",
  UPDATE: "update",
  CREATE: "create",
  DELETE: "delete",
  IMPORT: "import",
  SWITCH: "switch",
  FILTER: "filter",
  NOTE: "note",
  SET_ALARM: "setAlarm",
};

export const AttendeeAction =  {
    REGISTERED : 'Registered',
    NOTE : 'Note',
    LEAD_TYPE : 'Lead Type',
    ALARM : 'Alarm',
    ALARM_CANCELLED : 'Alarm Cancelled',
    UPDATE_ATTENDEE : 'Update Attendee',
    Enrollment_CREATED : "Enrollment Created",
    ADDED : 'Added',
    ASSIGNMENT : 'Assignment',
    REASSIGNMENT_REQUEST : 'Reassignment Request',
    REASSIGNMENT_APPROVED : 'Pullback Approved',
    REASSIGNMENT_REJECTED : 'Reassignment Rejected',
    REASSIGNMENT : 'Reassignment',
    PULLBACK : 'Pullback'
  }

export const DateFormat = {
  DD_MM_YYYY: "dd-MM-yyyy",
  MM_DD_YYYY: "MM-dd-yyyy",
  YYYY_MM_DD: "yyyy-MM-dd",
};

let store;
export const injectStoreInDateFormat = (_store) => {
  store = _store;
};

/**
 * This function is used by multiple pages/components to format the date and time
 * in a readable format.
 */

export const formatDate = (dateStr) => {
  return formatDateAsNumberWithTime(dateStr);
};

export const formatDateAsNumber = (dateStr) => {
  const dateFormat =
    store?.getState()?.auth?.userData?.dateFormat || DateFormat.MM_DD_YYYY;

  if (!dateStr) return "-";
  const date = new Date(dateStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "-";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based, so we add 1
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  if (dateFormat === DateFormat.DD_MM_YYYY) {
    return `${day}/${month}/${year}`;
  } else if (dateFormat === DateFormat.MM_DD_YYYY) {
    return `${month}/${day}/${year}`;
  } else if (dateFormat === DateFormat.YYYY_MM_DD) {
    return `${year}/${month}/${day}`;
  }
};

export const formatDateAsNumberWithTime = (dateStr) => {
  const dateFormat =
    store?.getState()?.auth?.userData?.dateFormat || DateFormat.MM_DD_YYYY;

  if (!dateStr) return "-";
  const date = new Date(dateStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "-";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based, so we add 1
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  let formattedDate = "";

  if (dateFormat === DateFormat.DD_MM_YYYY) {
    formattedDate = `${day}/${month}/${year}`;
  } else if (dateFormat === DateFormat.MM_DD_YYYY) {
    formattedDate = `${month}/${day}/${year}`;
  } else if (dateFormat === DateFormat.YYYY_MM_DD) {
    formattedDate = `${year}/${month}/${day}`;
  }

  return `${formattedDate} ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
};

export const formatIsoStringAsLocalAmPm = (dateStr) => {
const dateFormat =
    store?.getState()?.auth?.userData?.dateFormat || DateFormat.MM_DD_YYYY;

  if (!dateStr) return "-";
  const date = new Date(dateStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "-";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based, so we add 1
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  let formattedDate = "";

  if (dateFormat === DateFormat.DD_MM_YYYY) {
    formattedDate = `${day}/${month}/${year}`;
  } else if (dateFormat === DateFormat.MM_DD_YYYY) {
    formattedDate = `${month}/${day}/${year}`;
  } else if (dateFormat === DateFormat.YYYY_MM_DD) {
    formattedDate = `${year}/${month}/${day}`;
  }

  return ` ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
};



export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  if (phoneNumber.includes("E")) {
    return Number(phoneNumber).toFixed(0);
  }
  const cleanedPhoneNumber = phoneNumber.toString().replace(/[^0-9]/g, "");
  if (cleanedPhoneNumber.length === 12) return cleanedPhoneNumber.slice(2);
  if (cleanedPhoneNumber.length === 11 && cleanedPhoneNumber.startsWith("0")) {
    return cleanedPhoneNumber.slice(1);
  }
  return cleanedPhoneNumber;
};

export const errorToast = (message) => {
  let errorMessage = "";
  errorMessage = typeof message === "string" ? message : "Something went wrong";

  if (
    Array.isArray(message) &&
    message.length > 0 &&
    typeof message[0] === "string"
  ) {
    errorMessage = message[0];
  }
  toast.dismiss();
  toast.error(errorMessage, {
    position: "top-center",
    hideProgressBar: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  });
};

export const successToast = (message,position="top-center") => {
  let successMessage = "";
  successMessage = typeof message === "string" ? message : "Successful";

  // if (
  //   Array.isArray(message) &&
  //   message.length > 0 &&
  //   typeof message[0] === "string"
  // ) {
  //   errorMessage = message[0];
  // }
  toast.dismiss();
  toast.success(capitalizeWords(successMessage), {
    position: position,
    hideProgressBar: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export function filterTruthyValues(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const filteredObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (value instanceof Date) {
        if (!isNaN(value.getTime())) {
          filteredObj[key] = value;
        }
      } else if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            filteredObj[key] = value;
          }
          continue;
        }

        const nestedFiltered = filterTruthyValues(value);
        if (Object.keys(nestedFiltered).length > 0 || Array.isArray(value)) {
          filteredObj[key] = nestedFiltered;
        }
      } else if (
        value !== undefined &&
        value !== null &&
        value !== false &&
        value !== ""
      ) {
        filteredObj[key] = value;
      }
    }
  }
  return filteredObj;
}

export const AssignmentStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  COMPLETED: "completed",
  REASSIGN_REQUESTED: "reassignrequested",
  REASSIGN_APPROVED: "reassignapproved",
};

export const NotifActionType = {
  REASSIGNMENT: "reassignment",
  ASSIGNMENT: "assignment",
  USER_ACTIVITY: "user_activity",
  WEBINAR_ASSIGNMENT: "webinar_assignment",
  ACCOUNT_DEACTIVATION: "account_deactivation",
  ATTENDEE_REGISTRATION: "attendee_registration",
  NOTICE_BOARD_UPDATE: "notice_board_update",
  LOCATION_REQUEST: "location_request",
};

export const Usecase = {
  EMPLOYEE_ASSIGNMENT: "employee_assignment",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILURE: "payment_failure",
  PRODUCT_TAGGING: "product",
};

export const SocketEvents = {
  ATTENDEE_STATUS_UPDATE: "attendeeStatusUpdate",
  EMPLOYEE_ACTIVITY_LOG: "employee_activity_log",
};

export const copyToClipboard = (id, name) => {
  navigator.clipboard.writeText(id).then(
    () => {
      toast.dismiss();
      toast.success(`${name} ID copied!`);
    },
    (err) => {
      toast.dismiss();
      toast.error(`Failed to copy ${name} ID!`);
    }
  );
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const capitalizeWords = (str) => {
  if (!str) return "";
  // Ensure it's a string before processing
  if (typeof str !== "string") {
    console.warn("capitalizeWords expected a string, received:", str);
    str = String(str); // Attempt conversion
  }
  return str
    .toLowerCase() // Optional: ensures consistent casing before capitalizing
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


export const flattenObjectForURLSearchParams = (obj, prefix = '') => {
  const result = [];

  for (const key in obj) {
    // Ensure it's an own property to avoid iterating prototype chain
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // Construct the new key with bracket notation for nested properties
      const newKey = prefix ? `${prefix}[${key}]` : key;

      // Rule 1: Skip if value is undefined, null, or an empty string
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Rule 2: Handle objects (nested or potentially empty)
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (Object.keys(value).length === 0) {
          // If it's an empty object ({}), skip it entirely (e.g., `filters={}` should not appear)
          continue;
        } else {
          // If it's a non-empty object, recurse to flatten its properties
          result.push(...flattenObjectForURLSearchParams(value, newKey));
        }
      } else {
        // Rule 3: For primitive values (string, number, boolean) or arrays, add them directly.
        // URLSearchParams will automatically stringify numbers/booleans/arrays.
        result.push([newKey, value]);
      }
    }
  }
  return result;
};


export  const getBestHeaderMatch = (fieldNamesArray, headers) => {
  for (let fieldName of fieldNamesArray) {
    // Exact match
    let match = headers.find(
      (h) => h.trim().toLowerCase() === fieldName.trim().toLowerCase()
    );
    if (match) return match;

    // Partial match
    match = headers.find((h) =>
      h.trim().toLowerCase().includes(fieldName.trim().toLowerCase())
    );
    if (match) return match;
  }

  return null;
};