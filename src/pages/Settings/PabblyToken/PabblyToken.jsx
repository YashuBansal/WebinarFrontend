import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  BookOpen,
  Code2,
  Copy,
  Download,
  Key,
  Sparkles,
  Trash2,
} from "lucide-react";
import useRoles from "../../../hooks/useRoles";
import useMediaQuery from "../../../hooks/useMediaQuery";
import WebinarDropdown from "../../../components/Webinar/WebinarDropdown";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { errorToast, successToast } from "../../../utils/extra";
import { attendeeTableColumns } from "../../../utils/columnData";
import {
  expireTokenStatus,
  generatePablyToken,
  getAPIAccessTokens,
} from "../../../features/actions/auth";
import { DatePicker } from "../../../components/ui/date-picker";
import { clearOTPGenerated } from "../../../features/slices/auth";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";

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
  profession: {
    description: "Profession or job title (max 100 characters)",
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
    "profession": "Engineer",
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

const sectionShell =
  "space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 sm:p-6";
const sectionTitle =
  "border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:border-slate-700 dark:text-slate-500";

const InfoBoxHeader = ({ title, onCopy, copyText }) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
    {onCopy ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-2 rounded-xl border-slate-200 font-bold dark:border-slate-600"
        onClick={() => onCopy(copyText)}
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    ) : null}
  </div>
);

const PabblyToken = () => {
  const { userData } = useSelector((state) => state.auth);
  const role = userData?.role;
  const roles = useRoles();
  const dispatch = useDispatch();

  const [label, setLabel] = useState("");
  const [pabblyTokenData, setPabblyTokenData] = useState([]);
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
    <HubSubpageShell maxWidthClass="max-w-6xl">
      <div className="flex w-full flex-col space-y-8 text-slate-800 dark:text-slate-200">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 sm:mb-2"
        >
          <div className="flex items-start gap-4">
            <motion.div
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/15"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.05 }}
            >
              <Key className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </motion.div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                  External API token
                </h1>
                <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
              </div>
              <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Provision clients, subscriptions, and tokens from your own systems — same REST patterns your
                  engineers already use.
                </p>
              </ComponentGuard>
              <ComponentGuard allowedRoles={[roles.ADMIN]}>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Pull attendees, create leads, and wire campaigns with scoped tokens. Pick a webinar where
                  relevant.
                </p>
              </ComponentGuard>
            </div>
          </div>
        </motion.header>

        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-600 dark:bg-slate-900/50 sm:rounded-2xl sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Context
            </div>
            <WebinarDropdown />
          </motion.div>
        </ComponentGuard>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className={sectionShell}
        >
          <h2 className={sectionTitle}>
            <span className="inline-flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-500" />
              API token management
            </span>
          </h2>
          
          <div>
            <TokenList
              pabblyTokenData={pabblyTokenData}
              onCopy={handleCopy}
              onDelete={handleExpire}
            />
          </div>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Generate new token
            </h3>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <div className="w-full">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Label (e.g. Zapier production)"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    aria-label="API Token Label"
                  />
                </div>
                <div className="grid w-full">
                  <DatePicker
                    date={expiryDate}
                    setDate={(date) => setExpiryDate(date)}
                    placeholder="Expiry (optional)"
                    className="h-10 w-full"
                  />
                </div>
              </div>
              <Button
                type="button"
                className="h-10 shrink-0 rounded-xl bg-blue-500 px-5 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
                onClick={handleGenerateToken}
              >
                Generate token
              </Button>
            </div>
          </div>
        </motion.div>

        <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
          {/* Clients API Endpoints - Grouped */}
          <div className={sectionShell}>
            <h2 className={sectionTitle}>Fetch clients API</h2>
            
            <div className="space-y-4">

              <div className="">
                <InfoBoxHeader
                  title="Fetch Clients ( Method: GET )"
                  onCopy={handleCopy}
                  copyText={`${apiUrl}/users/clients?page=1&limit=1000`}
                />
                <p className="break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">{`${apiUrl}/users/clients?page=1&limit=1000`}</p>
              </div>
            </div>
          </div>

          <div className={sectionShell}>
            <h2 className={sectionTitle}>Client creation API</h2>
            
            <div className="space-y-4">
              <div>
                <InfoBoxHeader
                  title="Create Client ( Method: POST )"
                  onCopy={handleCopy}
                  copyText={authClientAPIEndpoint}
                />
                <p className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                  {authClientAPIEndpoint}
                </p>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      JSON body
                    </h3>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 flex-1 gap-2 rounded-xl font-bold sm:flex-initial"
                        onClick={() => handleDownload(superAdminJsonBody)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 flex-1 gap-2 rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-600 sm:flex-initial"
                        onClick={() => handleCopy(superAdminJsonBody)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <pre className="overflow-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100">
                    {superAdminJsonBody}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Update Client Subscription - Endpoint + JSON Body Combined */}
          <div className={sectionShell}>
            <h2 className={sectionTitle}>Update client subscription</h2>
            
            <div>
              <InfoBoxHeader
                title="Endpoint ( Method: PATCH )"
                onCopy={handleCopy}
                copyText={`${apiUrl}/subscription/update`}
              />
              <p className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">{`${apiUrl}/subscription/update`}</p>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  JSON body
                </h3>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 gap-2 rounded-xl font-bold sm:flex-initial"
                    onClick={() => handleDownload(secondaryJsonBody)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 flex-1 gap-2 rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-600 sm:flex-initial"
                    onClick={() => handleCopy(secondaryJsonBody)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
              <pre className="overflow-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100">
                {secondaryJsonBody}
              </pre>
            </div>
          </div>
        </ComponentGuard>

        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          {/* Webinar Attendees APIs - Grouped */}
          <div className={sectionShell}>
            <h2 className={sectionTitle}>Webinar attendees APIs</h2>
            
            <div className="space-y-6">
              <div>
                <InfoBoxHeader
                  title="Sales Attendees API Endpoint (Method: GET)"
                  onCopy={handleCopy}
                  copyText={salesAttendeesAPIEndpoint}
                />
                <p className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                  {salesAttendeesAPIEndpoint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendeeTableColumns.map((col) => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() =>
                        toggleChip(col.key, salesSelectedFields, "sales")
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                        salesSelectedFields.includes(col.key)
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {col.header}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <InfoBoxHeader
                  title="Reminder Attendees API Endpoint (Method: GET)"
                  onCopy={handleCopy}
                  copyText={reminderAttendeesAPIEndpoint}
                />
                <p className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                  {reminderAttendeesAPIEndpoint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendeeTableColumns.map((col) => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleChip(col.key, reminderSelectedFields)}
                      className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                        reminderSelectedFields.includes(col.key)
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
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
          <div className={sectionShell}>
            <h2 className={sectionTitle}>Webinar lead creation</h2>

            <div>
              <InfoBoxHeader
                title="Endpoint ( Method: POST )"
                onCopy={handleCopy}
                copyText={preWebinarAPIEndpoint}
              />
              <p className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                {preWebinarAPIEndpoint}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  JSON body
                </h3>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 gap-2 rounded-xl font-bold sm:flex-initial"
                    onClick={() => handleDownload(adminJsonBody)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 flex-1 gap-2 rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-600 sm:flex-initial"
                    onClick={() => handleCopy(adminJsonBody)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
              <pre className="overflow-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100">
                {adminJsonBody}
              </pre>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Field descriptions
              </h3>
              <div className="space-y-3">
                {Object.entries(webinarFieldDescriptions).map(
                  ([key, { description, required }]) => (
                    <div className="text-sm" key={key}>
                      <p
                        className={`font-mono ${
                          key === "webinar" || key === "attendee"
                            ? "text-red-600 dark:text-red-400"
                            : "ps-4 text-blue-600 dark:text-blue-400 sm:ps-10"
                        }`}
                      >{`${key}:`}</p>
                      <p
                        className={`text-slate-600 dark:text-slate-400 ${
                          key === "webinar" || key === "attendee"
                            ? ""
                            : "ps-4 sm:ps-10"
                        }`}
                      >
                        {description}
                        <span className="ml-2 font-semibold text-slate-900 dark:text-slate-100">
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
        <div className={sectionShell}>
          <h2 className={sectionTitle}>API campaign execution</h2>

          <div>
            <InfoBoxHeader
              title="Endpoint ( Method: POST )"
              onCopy={handleCopy}
              copyText={apiCampaignAPIEndpoint}
            />
            <p className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              {apiCampaignAPIEndpoint}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                JSON body
              </h3>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 gap-2 rounded-xl font-bold sm:flex-initial"
                  onClick={() => handleDownload(apiCampaignJSONBody)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 flex-1 gap-2 rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-600 sm:flex-initial"
                  onClick={() => handleCopy(apiCampaignJSONBody)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </div>
            <pre className="overflow-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100">
              {apiCampaignJSONBody}
            </pre>
          </div>
        </div>
      </div>
    </HubSubpageShell>
  );
};

export default PabblyToken;

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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center dark:border-slate-600 dark:bg-slate-900/40"
      >
        <Key className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No API tokens yet</p>
        <p className="mt-1 max-w-xs px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          Generate a labelled token below — it will appear here with copy and expiry.
        </p>
      </motion.div>
    );
  }

  // --- Mobile View: A list of cards ---
  if (isSmallScreen) {
    return (
      <div className="space-y-4">
        {pabblyTokenData.map((token, i) => {
          const isExpired =
            (token.tokenExpiry && new Date(token.tokenExpiry) < new Date()) ||
            token.isExpired;
          const statusText = isExpired ? "Expired" : "Active";
          const expiryText = token.tokenExpiry
            ? new Date(token.tokenExpiry).toLocaleDateString()
            : "Never";

          return (
            <motion.div
              key={token._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900/80"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">{token.label}</h3>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    isExpired
                      ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  }`}
                >
                  {statusText}
                </span>
              </div>
              <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-950/90 p-2 dark:border-slate-600">
                <pre className="truncate font-mono text-xs text-emerald-100/90">
                  {token.token}
                </pre>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg text-emerald-200 hover:bg-white/10 hover:text-white"
                  onClick={() => onCopy(token.token)}
                  aria-label="Copy token"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Expires{" "}
                  <span className="text-slate-800 dark:text-slate-200">{expiryText}</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-xl border-red-200 font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                  onClick={() => setDeteleModal(token)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // --- Desktop View: A table ---
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-left dark:border-slate-700 dark:bg-slate-900/80">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Label
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Token
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Expires
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
            {pabblyTokenData.map((token, index) => {
              const isExpired =
                (token.tokenExpiry && new Date(token.tokenExpiry) < new Date()) ||
                token.isExpired;
              return (
                <motion.tr
                  key={token._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.35) }}
                  className="whitespace-nowrap bg-white transition-colors hover:bg-slate-50/90 dark:bg-slate-800/20 dark:hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {token.label}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    ...{token.token.substring(token.token.length - 30)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        isExpired
                          ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                      }`}
                    >
                      {isExpired ? "Expired" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {token.tokenExpiry
                      ? new Date(token.tokenExpiry).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {!isExpired && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            onClick={() => onCopy(token.token)}
                            aria-label="Copy token"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            onClick={() => setDeteleModal(token)}
                            aria-label="Revoke token"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
