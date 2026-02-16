import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Typography, useMediaQuery } from "@mui/material";
import useRoles from "../../../hooks/useRoles";
import WebinarDropdown from "../../../components/Webinar/WebinarDropdown";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { errorToast, successToast } from "../../../utils/extra";
import { attendeeTableColumns } from "../../../utils/columnData";
import { globalButton } from "../../../utils/style";
import {
  expireTokenStatus,
  generatePablyToken,
  getAPIAccessTokens,
} from "../../../features/actions/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { clearOTPGenerated } from "../../../features/slices/auth";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";

// This large constant object remains unchanged.
const webinarFieldDescriptions = {
  webinar: {
    description:
      "The unique ID of the webinar in MongoDB format (24-character hexadecimal)",
    required: true,
  },
  attendee: {
    description: "The attendee object containing the following fields:",
    required: true,
  },
  email: {
    description: "Valid email address for the attendee (max 100 characters)",
    required: true,
  },
  firstName: {
    description: "Attendee's first name (max 100 characters)",
    required: false,
  },
  lastName: {
    description: "Attendee's last name (max 100 characters)",
    required: false,
  },
  phone: {
    description: "Phone number in any format",
    required: false,
  },
  gender: {
    description: "Must be one of: 'male', 'female', or 'other'",
    required: false,
  },
  location: {
    description: "Geographic location information (max 100 characters)",
    required: false,
  },
  tags: {
    description:
      "Array of text labels for Product enrollment and Employee Temporary Assignment",
    required: false,
  },
  source: {
    description:
      "Lead source tracking (e.g., 'social-media', 'email-campaign')",
    required: false,
  },
};

const superAdminJsonBody = `{
  "userName": "test4",
  "password": "test4@123",
  "email": "test4@test.com",
  "phone": "+911234567890",
  "plan": "673eeed7069c45d78e917ef4",
  "companyName": "test company",
  "durationType": "monthly"  // ["monthly", "quarterly", "halfyearly", "yearly", "custom"]
}`;

const adminJsonBody = `{
  "webinar": "507f1f77bcf86cd799439011", 
  "attendee": {
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "gender": "male",
    "location": "New York",
    "tags": ["vip", "new-lead"],
    "source": "website-registration"
  }
}`;

const apiCampaignJSONBody = `{
  "campaignName": "<CAMPAIGN_NAME>",
  "destination": "<RECIPIENT_PHONE_NUMBER>",
  "media": { // optional
    "url": "<MEDIA_URL>",
    "filename": "<MEDIA_FILENAME>"
  },
  "templateParams": [ // optional
    "<TEMPLATE_PARAM_1>",
    "<TEMPLATE_PARAM_2>",
    "<TEMPLATE_PARAM_3>"
  ]
}`;

// A reusable responsive header for each info box to reduce code duplication.
const InfoBoxHeader = ({ title, onCopy, copyText }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    {onCopy && (
      <button
        onClick={() => onCopy(copyText)}
        className={`${globalButton} w-full sm:w-auto`}
      >
        Copy
      </button>
    )}
  </div>
);

const PabblyToken = () => {
  const { userData, isSuccess } = useSelector((state) => state.auth);
  const role = userData?.role;
  const roles = useRoles();
  const dispatch = useDispatch();

  const [label, setLabel] = useState("");
  const [pabblyTokenData, setPabblyTokenData] = useState([]);
  console.log(pabblyTokenData);
  const [secondaryJsonBody, setSecondaryJsonBody] = useState(`{
  "email": "client@example.com", // <CLIENT_EMAIL>
  "planId": "673lllu70werjhg2f6917ef4", // <PLAN_ID>
  "durationType": "monthly"  // ["monthly", "quarterly", "halfyearly", "yearly"]
}`);
  const [expiryDate, setExpiryDate] = useState(new Date());

  const apiUrl = `${
    import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
      ? import.meta.env.VITE_REACT_APP_API_BASE_URL_DEVELOPMENT
      : import.meta.env.VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION
  }`;

  const [salesSelectedFields, setsalesSelectedFields] = useState([
    "email",
    "phone",
  ]);
  const [reminderSelectedFields, setreminderSelectedFields] = useState([
    "email",
    "phone",
  ]);

  const salesAttendeesAPIEndpoint = `${apiUrl}/attendees/webinar?limit=1000&fields=${salesSelectedFields.join(
    ","
  )}&fieldName=attendeeTableConfig&webinarId=<WEBINAR_ID>&isAttended=true&leadType=true&accessToken=<BEARER_TOKEN>`;
  const reminderAttendeesAPIEndpoint = `${apiUrl}/attendees/webinar?limit=1000&fields=${reminderSelectedFields.join(
    ","
  )}&fieldName=attendeeTableConfig&webinarId=<WEBINAR_ID>&isAttended=false&leadType=true&accessToken=<BEARER_TOKEN>`;

  const authClientAPIEndpoint = `${apiUrl}/auth/client`;
  const preWebinarAPIEndpoint = `${apiUrl}/assignment/prewebinar`;

  const apiCampaignAPIEndpoint = `${apiUrl}/api-campaign/execute`;

  const fetchData = useCallback(() => {
    dispatch(getAPIAccessTokens())
      .unwrap()
      .then((res) => {
        if (Array.isArray(res)) {
          setPabblyTokenData(res);
        }
      });
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleChip = (key, selectedFields, type) => {
    let updatedFields = selectedFields.includes(key)
      ? selectedFields.filter((item) => item !== key)
      : [...selectedFields, key];
    if (type === "sales") {
      setsalesSelectedFields(updatedFields);
    } else {
      setreminderSelectedFields(updatedFields);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    successToast("Copied to clipboard!");
  };

  const handleExpire = (id) => {
    dispatch(expireTokenStatus(id)).then((res) => {
      if (res?.meta?.requestStatus === "fulfilled") {
        fetchData();
      }
    });
  };

  const handleDownload = (json) => {
    const blob = new Blob([json], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webinar-assignment.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateToken = () => {
    if (typeof label !== "string" || label.trim() === "") {
      errorToast("Label is Required");
      return;
    }
    const payload = {};
    if (expiryDate) {
      payload.expiry = expiryDate.toISOString();
    }
    payload.label = label;
    dispatch(generatePablyToken(payload)).then((res) => {
      if (res?.meta?.requestStatus === "fulfilled") {
        fetchData();
        setLabel("");
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 py-10 sm:py-14 flex flex-col items-center text-gray-800 bg-gray-50 min-h-screen">
      <div className="max-w-4xl w-full space-y-8">
        <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
          <Typography
            variant="h4"
            component="h1"
            className="text-center sm:text-left font-bold text-gray-900"
          >
            External API for Creating User (Role: ADMIN)
          </Typography>
        </ComponentGuard>
        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          <Typography
            variant="h4"
            component="h1"
            className="text-center sm:text-left font-bold text-gray-900"
          >
            External API Documentation
          </Typography>

          <WebinarDropdown />
        </ComponentGuard>

        {/* Token Management Section - Combined */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
            API Token Management
          </h2>
          
          <div>
            <TokenList
              pabblyTokenData={pabblyTokenData}
              onCopy={handleCopy}
              onDelete={handleExpire}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Generate New API Token
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* === NEW: Label Input Field === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Enter a label  "
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="API Token Label"
                  />
                </div>

                {/* === Existing: Date Picker === */}
                <div className="w-full grid">
                  <DatePicker
                    selected={expiryDate}
                    onChange={(date) => setExpiryDate(date)}
                    isClearable
                    placeholderText="Select expiry date (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateToken}
                className={`${globalButton} w-full sm:w-auto`}
              >
                Generate Token
              </button>
            </div>
          </div>
        </div>

        <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
          {/* Clients API Endpoints - Grouped */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Fetch Clients API
            </h2>
            
            <div className="space-y-4">

              <div className="">
                <InfoBoxHeader
                  title="Fetch Clients ( Method: GET )"
                  onCopy={handleCopy}
                  copyText={`${apiUrl}/users/clients?page=1&limit=1000`}
                />
                <p className="text-gray-700 text-sm break-words">{`${apiUrl}/users/clients?page=1&limit=1000`}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Client Creation API
            </h2>
            
            <div className="space-y-4">
              <div>
                <InfoBoxHeader
                  title="Create Client ( Method: POST )"
                  onCopy={handleCopy}
                  copyText={authClientAPIEndpoint}
                />
                <p className="text-gray-700 text-sm break-words mb-4">
                  {authClientAPIEndpoint}
                </p>

                <div className="border-t pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      JSON Body:
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleDownload(superAdminJsonBody)}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleCopy(superAdminJsonBody)}
                        className={`${globalButton} flex-1`}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 overflow-auto">
                    {superAdminJsonBody}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Update Client Subscription - Endpoint + JSON Body Combined */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Update Client Subscription Plan
            </h2>
            
            <div>
              <InfoBoxHeader
                title="Endpoint ( Method: PATCH )"
                onCopy={handleCopy}
                copyText={`${apiUrl}/subscription/update`}
              />
              <p className="text-gray-700 text-sm break-words mb-4">{`${apiUrl}/subscription/update`}</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  JSON Body:
                </h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownload(secondaryJsonBody)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleCopy(secondaryJsonBody)}
                    className={`${globalButton} flex-1`}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 overflow-auto">
                {secondaryJsonBody}
              </pre>
            </div>
          </div>
        </ComponentGuard>

        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          {/* Webinar Attendees APIs - Grouped */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Webinar Attendees APIs
            </h2>
            
            <div className="space-y-6">
              <div>
                <InfoBoxHeader
                  title="Sales Attendees API Endpoint (Method: GET)"
                  onCopy={handleCopy}
                  copyText={salesAttendeesAPIEndpoint}
                />
                <p className="text-gray-700 text-sm mb-4 break-words">
                  {salesAttendeesAPIEndpoint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendeeTableColumns.map((col) => (
                    <button
                      key={col.key}
                      onClick={() =>
                        toggleChip(col.key, salesSelectedFields, "sales")
                      }
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        salesSelectedFields.includes(col.key)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {col.header}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <InfoBoxHeader
                  title="Reminder Attendees API Endpoint (Method: GET)"
                  onCopy={handleCopy}
                  copyText={reminderAttendeesAPIEndpoint}
                />
                <p className="text-gray-700 text-sm mb-4 break-words">
                  {reminderAttendeesAPIEndpoint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendeeTableColumns.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => toggleChip(col.key, reminderSelectedFields)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        reminderSelectedFields.includes(col.key)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {col.header}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Webinar Lead Creation - Endpoint + JSON Body + Field Descriptions Combined */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Webinar Lead Creation
            </h2>
            
            <div>
              <InfoBoxHeader
                title="Endpoint ( Method: POST )"
                onCopy={handleCopy}
                copyText={preWebinarAPIEndpoint}
              />
              <p className="text-gray-700 text-sm break-words mb-4">
                {preWebinarAPIEndpoint}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  JSON Body:
                </h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownload(adminJsonBody)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleCopy(adminJsonBody)}
                    className={`${globalButton} flex-1`}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 overflow-auto">
                {adminJsonBody}
              </pre>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Field Descriptions:
              </h3>
              <div className="space-y-3">
                {Object.entries(webinarFieldDescriptions).map(
                  ([key, { description, required }]) => (
                    <div className="text-sm" key={key}>
                      <p
                        className={`font-mono ${
                          key === "webinar" || key === "attendee"
                            ? "text-red-600"
                            : "text-blue-600 ps-4 sm:ps-10"
                        }`}
                      >{`${key}:`}</p>
                      <p
                        className={`text-gray-600 ${
                          key === "webinar" || key === "attendee"
                            ? ""
                            : "ps-4 sm:ps-10"
                        }`}
                      >
                        {description}
                        <span className="text-neutral-900 font-semibold ml-2">
                          {required ? "(Required)" : "(Optional)"}
                        </span>
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </ComponentGuard>

        {/* API Campaign Execution - Endpoint + JSON Body Combined */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
            API Campaign Execution
          </h2>
          
          <div>
            <InfoBoxHeader
              title="Endpoint ( Method: POST )"
              onCopy={handleCopy}
              copyText={apiCampaignAPIEndpoint}
            />
            <p className="text-gray-700 text-sm break-words mb-4">
              {apiCampaignAPIEndpoint}
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">JSON Body:</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDownload(apiCampaignJSONBody)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => handleCopy(apiCampaignJSONBody)}
                  className={`${globalButton} flex-1`}
                >
                  Copy
                </button>
              </div>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 overflow-auto">
              {apiCampaignJSONBody}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PabblyToken;

// --- MOCK ICONS (Replace with your actual icon imports) ---
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
  </svg>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
    <path
      fillRule="evenodd"
      d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
    />
  </svg>
);

// The simple, responsive component you asked for.
const TokenList = ({ pabblyTokenData, onCopy, onDelete }) => {
  // Hook to switch between mobile and desktop views
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [deleteModal, setDeteleModal] = useState(null);
  const { isLoading, isSuccess } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isSuccess) {
      setDeteleModal(null);
      dispatch(clearOTPGenerated);
    }
  }, [isSuccess]);

  // Handle the case where there's no data
  if (!pabblyTokenData || pabblyTokenData.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">No API tokens found.</p>
      </div>
    );
  }

  // --- Mobile View: A list of cards ---
  if (isSmallScreen) {
    return (
      <div className="space-y-4">
        {pabblyTokenData.map((token) => {
          const isExpired =
            (token.tokenExpiry && new Date(token.tokenExpiry) < new Date()) ||
            token.isExpired;
          const statusText = isExpired ? "Expired" : "Active";
          const expiryText = token.tokenExpiry
            ? new Date(token.tokenExpiry).toLocaleDateString()
            : "Never";

          return (
            <div
              key={token._id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-gray-900">{token.label}</h3>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isExpired
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {statusText}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-gray-100 p-2">
                <pre className="truncate text-sm text-gray-700">
                  {token.token}
                </pre>
                <button
                  onClick={() => onCopy(token.token)}
                  className="flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-gray-200"
                  aria-label="Copy token"
                >
                  <CopyIcon />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500">
                  Expires:{" "}
                  <span className="font-medium text-gray-700">
                    {expiryText}
                  </span>
                </p>
                <button
                  onClick={() => setDeteleModal(token)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <DeleteIcon /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --- Desktop View: A table ---
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Label</th>
            <th className="px-4 py-3 font-medium text-gray-600">Token</th>
            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 font-medium text-gray-600">Expires</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pabblyTokenData.map((token) => {
            const isExpired =
              (token.tokenExpiry && new Date(token.tokenExpiry) < new Date()) ||
              token.isExpired;
            return (
              <tr
                key={token._id}
                className="hover:bg-gray-50 whitespace-nowrap"
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {token.label}
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  ...{token.token.substring(token.token.length - 30)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isExpired
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isExpired ? "Expired" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {token.tokenExpiry
                    ? new Date(token.tokenExpiry).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center items-center gap-2">
                    {!isExpired && (
                      <>
                        <button
                          onClick={() => onCopy(token.token)}
                          className="p-1.5 rounded-full hover:bg-gray-200"
                        >
                          <CopyIcon />
                        </button>
                        <button
                          onClick={() => setDeteleModal(token)}
                          className="p-1.5 rounded-full hover:bg-red-100 text-red-600"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {deleteModal && (
        <ConfirmDeleteModal
          setModal={setDeteleModal}
          triggerDelete={() => {
            onDelete(deleteModal._id);
          }}
          isLoading={isLoading}
          title="Please confirm deletion by entering the number below:"
        />
      )}
    </div>
  );
};
