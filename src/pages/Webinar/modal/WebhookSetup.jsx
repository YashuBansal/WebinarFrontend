import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowBack, ContentCopy, CheckCircle } from "@mui/icons-material";
import tagsService from "../../../services/tagsService";
import { copyToClipboard, errorToast, successToast } from "../../../utils/extra";
import LoadingSpinner from "./components/LoadingSpinner";

// Helper function to flatten nested objects
const flattenObject = (obj, prefix = "") => {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
};

// Helper function to format value for display
const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value.toString();
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const WebhookSetup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [webhook, setWebhook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fieldMapping, setFieldMapping] = useState({});
  const [staticValues, setStaticValues] = useState({});
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  
  // Attendee fields that can be mapped
  const attendeeFields = [
    { value: "email", label: "Email", required: true },
    { value: "firstName", label: "First Name", required: false },
    { value: "lastName", label: "Last Name", required: false },
    { value: "phone", label: "Phone", required: false },
    { value: "location", label: "Location", required: false },
    { value: "gender", label: "Gender", required: false },
    { value: "tags", label: "Tags", required: false },
    { value: "source", label: "Source", required: false },
  ];

  const fetchWebhook = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await tagsService.getWebinarWebhookById(id);
      if (response?.success && response.data) {
        setWebhook(response.data);
      }
    } catch (error) {
      console.error("Error fetching webhook:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWebhook();
  }, [fetchWebhook]);

  // Update field mapping state when webhook data changes
  useEffect(() => {
    if (webhook?.fieldMapping) {
      // Reverse the mapping: from {email: "body.email"} to {"body.email": "email"}
      const reversedMapping = {};
      Object.entries(webhook.fieldMapping).forEach(([attendeeField, webhookPath]) => {
        if (webhookPath) {
          reversedMapping[webhookPath] = attendeeField;
        }
      });
      setFieldMapping(reversedMapping);
    } else {
      setFieldMapping({});
    }
    
    // Update static values state when webhook data changes
    if (webhook?.staticValues) {
      setStaticValues(webhook.staticValues);
    } else {
      setStaticValues({});
    }
  }, [webhook]);

  // Polling effect - check every 5 seconds if response is not captured
  useEffect(() => {
    if (!webhook || webhook.isResponseCaptured) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchWebhook();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [webhook?.isResponseCaptured, fetchWebhook]);

  const handleCopyUrl = () => {
    if (webhook?.webhookUrl) {
      copyToClipboard(webhook.webhookUrl, "Webhook URL");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMappingChange = (webhookFieldPath, attendeeField) => {
    // Update local state only - don't save yet
    const newMapping = { ...fieldMapping };
    const previouslyMappedField = newMapping[webhookFieldPath];
    const newStaticValues = { ...staticValues };
    
    if (attendeeField) {
      newMapping[webhookFieldPath] = attendeeField;
      // Clear static value for the newly mapped field when mapping dynamically (user chose dynamic mapping)
      if (attendeeField !== previouslyMappedField && attendeeField !== "email" && staticValues[attendeeField]) {
        delete newStaticValues[attendeeField];
        setStaticValues(newStaticValues);
      }
    } else {
      // Unmapping - don't clear static value, just remove the mapping (static input will become visible)
      delete newMapping[webhookFieldPath];
    }
    
    setFieldMapping(newMapping);
  };

  const handleSaveAllMappings = async () => {
    if (!webhook?._id) return;

    // Check if email is mapped (required field)
    const emailMapped = Object.values(fieldMapping).includes("email");
    if (!emailMapped) {
      errorToast("Email field mapping is required. Please map at least the email field.");
      return;
    }

    setIsSavingMapping(true);
    try {
      // Convert reversed mapping back to the format: {email: "body.email"}
      const mappingToSave = {};
      Object.entries(fieldMapping).forEach(([webhookPath, attendeeFieldKey]) => {
        if (attendeeFieldKey) {
          mappingToSave[attendeeFieldKey] = webhookPath;
        }
      });

      // Ensure email is included (required)
      if (!mappingToSave.email) {
        throw new Error("Email field mapping is required");
      }

      // Clean staticValues - remove empty values
      const staticValuesToSave = {};
      Object.entries(staticValues).forEach(([field, value]) => {
        if (value && value.trim()) {
          staticValuesToSave[field] = value.trim();
        }
      });

      const response = await tagsService.updateWebinarWebhook(webhook._id, {
        fieldMapping: mappingToSave,
        staticValues: staticValuesToSave,
      });

      if (response?.success) {
        // Refresh webhook data to get the updated mapping
        await fetchWebhook();
        successToast("Field mappings saved successfully");
      }
    } catch (error) {
      console.error("Error saving field mapping:", error);
      errorToast(error.message || "Error saving field mapping. Email field mapping is required.");
      // Revert on error
      if (webhook?.fieldMapping) {
        const reversedMapping = {};
        Object.entries(webhook.fieldMapping).forEach(([attendeeField, webhookPath]) => {
          if (webhookPath) {
            reversedMapping[webhookPath] = attendeeField;
          }
        });
        setFieldMapping(reversedMapping);
      }
      if (webhook?.staticValues) {
        setStaticValues(webhook.staticValues);
      } else {
        setStaticValues({});
      }
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleRecaptureData = async () => {
    if (!webhook?._id) return;

    setIsSavingMapping(true);
    try {
      const response = await tagsService.updateWebinarWebhook(webhook._id, {
        isResponseCaptured: false,
        fieldMapping: {}, // Clear previous mappings
        staticValues: {}, // Clear previous static values
      });

      if (response?.success) {
        // Clear local mapping state
        setFieldMapping({});
        setStaticValues({});
        // Refresh webhook data
        await fetchWebhook();
      }
    } catch (error) {
      console.error("Error recapturing data:", error);
    } finally {
      setIsSavingMapping(false);
    }
  };

  // Helper function to find which attendee field a webhook path is mapped to
  const getMappedField = (webhookFieldPath) => {
    return fieldMapping[webhookFieldPath] || "";
  };

  // Helper function to handle static value change
  const handleStaticValueChange = (field, value) => {
    const newStaticValues = { ...staticValues };
    if (value && value.trim()) {
      newStaticValues[field] = value.trim();
    } else {
      delete newStaticValues[field];
    }
    setStaticValues(newStaticValues);
  };

  // Helper function to check if a field is dynamically mapped
  const isFieldDynamicallyMapped = (fieldName) => {
    return Object.values(fieldMapping).includes(fieldName);
  };

  // Extract only the body from captured data for display
  const bodyData = webhook?.lastCapturedData?.body || webhook?.lastCapturedData || null;
  const flattenedData = bodyData
    ? flattenObject(bodyData)
    : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Webhook not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            type="button"
          >
            <ArrowBack className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {webhook.webhookName || "Webhook Setup"}
            </h1>
            <p className="text-gray-600 mt-1">Manage your webhook configuration</p>
          </div>
        </div>

        {/* Webhook URL Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Webhook URL
          </h2>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 overflow-hidden">
              <code className="text-sm text-gray-700 break-all">
                {webhook.webhookUrl || "No URL generated"}
              </code>
            </div>
            {webhook.webhookUrl && (
              <button
                onClick={handleCopyUrl}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                }`}
                type="button"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ContentCopy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Use this URL to receive webhook data. Send POST requests to this endpoint.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Status</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  webhook.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {webhook.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  webhook.isResponseCaptured
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {webhook.isResponseCaptured
                  ? "Response Captured"
                  : "Waiting for Response"}
              </span>
            </div>
            {webhook.lastCapturedAt && (
              <div className="text-sm text-gray-600">
                Last captured:{" "}
                {new Date(webhook.lastCapturedAt).toLocaleString()}
              </div>
            )}
          </div>
          {!webhook.isResponseCaptured && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Waiting for webhook data... Checking every 5 seconds.
              </p>
            </div>
          )}
          {webhook.isResponseCaptured && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleRecaptureData}
                disabled={isSavingMapping}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                  isSavingMapping
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
                type="button"
              >
                Recapture Data
              </button>
            </div>
          )}
        </div>

        {/* Captured Data Card */}
        {bodyData && webhook.isResponseCaptured && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Captured Data & Field Mapping
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Map each captured field to an attendee field using the dropdown, or set static values for fields below. <span className="font-semibold text-red-600">Email field mapping is required (must map from webhook data, not static).</span>
            </p>
            {Object.keys(flattenedData).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Map To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(flattenedData).map(([key, value]) => {
                      const mappedField = getMappedField(key);
                      return (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-sm font-mono text-gray-900">
                              {key}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words max-w-2xl">
                              {formatValue(value)}
                            </pre>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={mappedField}
                              onChange={(e) => handleMappingChange(key, e.target.value)}
                              disabled={isSavingMapping}
                              className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                isSavingMapping ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              } ${mappedField ? "bg-blue-50 border-blue-300" : "bg-white"}`}
                            >
                              <option value="">-- Select Field --</option>
                              {attendeeFields.map((field) => (
                                <option key={field.value} value={field.value}>
                                  {field.label} {field.required ? "(Required)" : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data fields found
              </div>
            )}

            {/* Static Values Section */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Static Values
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Set static values for attendee fields that will always use these values instead of mapping from webhook data. <span className="font-semibold">Email cannot be set as static (must be mapped from webhook).</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attendeeFields
                  .filter(
                    (field) =>
                      field.value !== "email" && // Exclude email
                      !isFieldDynamicallyMapped(field.value) // Exclude dynamically mapped fields
                  )
                  .map((field) => (
                    <div key={field.value} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={staticValues[field.value] || ""}
                        onChange={(e) =>
                          handleStaticValueChange(field.value, e.target.value)
                        }
                        disabled={isSavingMapping}
                        placeholder={`Enter static value for ${field.label}`}
                        className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          isSavingMapping
                            ? "opacity-50 cursor-not-allowed bg-gray-100"
                            : "bg-white"
                        } ${
                          staticValues[field.value]
                            ? "bg-blue-50 border-blue-300"
                            : ""
                        }`}
                      />
                    </div>
                  ))}
                {attendeeFields
                  .filter(
                    (field) =>
                      field.value !== "email" &&
                      isFieldDynamicallyMapped(field.value)
                  ).length > 0 && (
                  <div className="col-span-full mt-2">
                    <p className="text-xs text-gray-500 italic">
                      Note: Fields that are dynamically mapped from webhook data are not shown here. Unmap them to set static values.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveAllMappings}
                disabled={isSavingMapping}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                  isSavingMapping
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
                type="button"
              >
                {isSavingMapping ? "Saving..." : "Save Mappings"}
              </button>
            </div>

            {isSavingMapping && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Saving mappings...
                </p>
              </div>
            )}
            {((webhook?.fieldMapping && Object.keys(webhook.fieldMapping).length > 0) ||
              (webhook?.staticValues && Object.keys(webhook.staticValues).length > 0)) && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-2">Active Mappings:</p>
                <div className="space-y-1">
                  {webhook?.fieldMapping &&
                    Object.entries(webhook.fieldMapping).map(([attendeeField, webhookPath]) => (
                      <div key={attendeeField} className="text-sm text-green-700">
                        <span className="font-medium capitalize">{attendeeField}:</span>{" "}
                        <code className="bg-green-100 px-2 py-0.5 rounded">{webhookPath}</code>
                        <span className="ml-2 text-xs text-green-600">(mapped from webhook)</span>
                      </div>
                    ))}
                </div>
                {webhook?.staticValues &&
                  Object.keys(webhook.staticValues).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="text-sm font-semibold text-purple-800 mb-2">Static Values:</p>
                      <div className="space-y-1">
                        {Object.entries(webhook.staticValues).map(([attendeeField, staticValue]) => (
                          <div key={attendeeField} className="text-sm text-purple-700">
                            <span className="font-medium capitalize">{attendeeField}:</span>{" "}
                            <code className="bg-purple-100 px-2 py-0.5 rounded">{staticValue}</code>
                            <span className="ml-2 text-xs text-purple-600">(static)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {(!bodyData || !webhook.isResponseCaptured) && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              No data has been captured yet. Send a POST request to the webhook URL to test.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookSetup;
