import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import Papa from "papaparse";
import { useParams } from "react-router-dom";
import { addAttendees } from "../../../features/actions/attendees";
import { ClipLoader } from "react-spinners";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { formatPhoneNumber, successToast } from "../../../utils/extra";

// Define stages for the modal workflow
const MODAL_STAGES = {
  UPLOAD_FILE: "uploadFile",
  PREVIEW_DATA: "previewData", // New stage for previewing and selecting header
  MAP_FIELDS: "mapFields",
};

// Define the required and optional fields for mapping (remains the same)
const FIELDS_TO_MAP = [
  {
    name: "email",
    label: "Email",
    required: true,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "firstName",
    label: "First Name",
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "lastName",
    label: "Last Name",
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "phone",
    label: "Phone Number",
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "location",
    label: "Location",
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "source",
    label: "Source",
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "gender",
    label: "Gender",
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
];

const MAX_PREVIEW_ROWS = 20;
const MAX_PREVIEW_COLS = 5;

const UploadXslxModal = ({ tabValue, setModal }) => {
  const logUserActivity = useAddUserActivity();
  const dispatch = useDispatch();
  const { id: webinarId } = useParams();

  const {
    isLoading: isImporting,
    error,
    isSuccess,
  } = useSelector((state) => state.attendee);

  // --- Component States ---
  const [stage, setStage] = useState(MODAL_STAGES.UPLOAD_FILE); // Start with file upload
  const [headerRowNumber, setHeaderRowNumber] = useState(""); // User-specified header row
  const [rawSheetData, setRawSheetData] = useState([]); // Full data from sheet (array of arrays)
  const [previewDisplayData, setPreviewDisplayData] = useState([]); // Data for preview table
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const mergedAttendeeCountRef = useRef(0);

  // --- React Hook Form Setup ---
  const formFields =
    tabValue === "postWebinar"
      ? [
          ...FIELDS_TO_MAP,
          {
            name: "sessionMinutes",
            label: "Session Minutes",
            required: false,
            exampleFormatter: (val) => (val ? val.toString() : ""),
          },
        ]
      : FIELDS_TO_MAP;

  const defaultFormValues = formFields.reduce((acc, field) => {
    acc[field.name] = null;
    return acc;
  }, {});

  const {
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
    trigger,
    watch,
    reset,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const selectedMapping = watch();

  // --- Utility Functions ---
  const generateSelectOptions = (headers) => {
    if (!headers || headers.length === 0) return [];
    return headers.map((header) => ({
      label: header,
      value: header,
    }));
  };

  const formatDisplayedValue = (
    fieldValue,
    data,
    formatter = (val) => (val ? val.toString() : "")
  ) => {
    if (!fieldValue || !data || data.length === 0) return "";
    const headerKey = fieldValue.value;
    const sampleRow = data.find((row) => {
      const val = row[headerKey];
      return val !== undefined && val !== null && String(val).trim() !== "";
    });
    if (sampleRow) {
      try {
        const rawValue = sampleRow[headerKey];
        return formatter(rawValue);
      } catch (e) {
        console.error(
          `Error applying formatter for field ${fieldValue.label}:`,
          e
        );
        return `Formatting Error: ${rawValue}`;
      }
    }
    return "[Empty]";
  };

  // --- Handlers ---

  // Stage 1: File Upload Handling

  // Assume these are defined elsewhere, e.g., in your component's scope or as constants
  // const toast = { error: (msg, opts) => console.error(msg, opts), success: (msg, opts) => console.log(msg, opts) };
  // const setIsParsingFile = (isParsing) => console.log(`setIsParsingFile: ${isParsing}`);
  // const setRawSheetData = (data) => console.log('setRawSheetData with:', data ? data.length : 0, 'rows');
  // const setPreviewDisplayData = (data) => console.log('setPreviewDisplayData with:', data ? data.length : 0, 'rows');
  // const setHeaderRowNumber = (num) => console.log(`setHeaderRowNumber: ${num}`);
  // const setStage = (stage) => console.log(`setStage: ${stage}`);
  // const MAX_PREVIEW_ROWS = 10; // Example value
  // const MAX_PREVIEW_COLS = 5;  // Example value
  // const MODAL_STAGES = { PREVIEW_DATA: 'preview_data' }; // Example value

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "text/csv",
      "application/csv",
      // Some systems might use generic types for CSV, or it might not be set.
      // A file extension check can be a good fallback.
    ];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && fileExtension !== "csv") {
      toast.error("Invalid file type. Please upload a .csv file.", {
        position: "top-center",
      });
      event.target.value = null; // Reset file input
      return;
    }

    setIsParsingFile(true);

    Papa.parse(file, {
      header: false, // We want an array of arrays, not objects
      skipEmptyLines: true, // Skip lines that are completely empty
      dynamicTyping: false, // Treat all values as strings initially, like the original XLSX
      complete: (results) => {
        try {
          const jsonData = results.data;

          if (!jsonData || jsonData.length === 0) {
            toast.error("The uploaded file is empty or could not be read.", {
              position: "top-center",
            });
            setRawSheetData([]);
            setPreviewDisplayData([]);
            // No need to setIsParsingFile(false) here, it's in finally
            // event.target.value = null; // Done in finally
            setIsParsingFile(false); // Explicitly set here for this path
            event.target.value = null; // Reset input
            return;
          }

          // PapaParse can also return errors for specific rows in results.errors
          if (results.errors && results.errors.length > 0) {
            console.warn("Parsing errors encountered:", results.errors);
            // You might want to inform the user or handle these errors
            // For now, we'll proceed with the data that was successfully parsed.
          }

          setRawSheetData(jsonData);

          const preview = jsonData.slice(0, MAX_PREVIEW_ROWS).map((row) => {
            const newRow = [];
            // Ensure row is an array, as PapaParse might return non-array for malformed lines
            const currentRow = Array.isArray(row) ? row : [];
            for (
              let i = 0;
              i < Math.min(currentRow.length, MAX_PREVIEW_COLS);
              i++
            ) {
              newRow.push(
                currentRow[i] === null || currentRow[i] === undefined
                  ? ""
                  : String(currentRow[i])
              );
            }
            // Pad with empty strings if row has less than MAX_PREVIEW_COLS but sheet has more
            const actualMaxColsInFile = jsonData[0] ? jsonData[0].length : 0;
            while (
              newRow.length < MAX_PREVIEW_COLS &&
              newRow.length < actualMaxColsInFile
            ) {
              newRow.push("");
            }
            return newRow;
          });
          setPreviewDisplayData(preview);
          // Suggest CSV default (first row is often header), user can change
          setHeaderRowNumber("1");

          setStage(MODAL_STAGES.PREVIEW_DATA);
          successToast("File parsed. Please select or confirm the header row.");
        } catch (error) {
          console.error("Error processing CSV data:", error);
          toast.error(
            `Error processing file data: ${error.message || "Unknown error."}`,
            { position: "top-center" }
          );
          setRawSheetData([]);
          setPreviewDisplayData([]);
        } finally {
          setIsParsingFile(false);
          event.target.value = null; // Reset input for re-upload
        }
      },
      error: (error) => {
        console.error("PapaParse error:", error);
        toast.error(
          `Error parsing CSV file: ${error.message || "Could not read file."}`,
          { position: "top-center" }
        );
        setRawSheetData([]);
        setPreviewDisplayData([]);
        setIsParsingFile(false);
        event.target.value = null; // Reset input
      },
    });
  };

  // Stage 2: Preview Data and Header Row Confirmation
  const handlePreviewAndProceedToMap = () => {
    const rowNum = parseInt(headerRowNumber, 10);
    if (isNaN(rowNum) || rowNum < 1) {
      toast.error("Header row number must be a positive integer.", {
        position: "top-center",
      });
      return;
    }
    if (rowNum > rawSheetData.length) {
      toast.error(
        `Header row ${rowNum} is out of bounds. File has ${rawSheetData.length} rows.`,
        { position: "top-center" }
      );
      return;
    }

    const adjustedHeaderRowIndex = rowNum - 1;
    const actualHeaderRowArray = rawSheetData[adjustedHeaderRowIndex];

    const uniqueHeaders = [];
    const seenHeaders = new Set();
    if (actualHeaderRowArray) {
      actualHeaderRowArray.forEach((h) => {
        if (h !== null && h !== undefined) {
          const headerStr = String(h).trim();
          if (headerStr !== "" && !seenHeaders.has(headerStr)) {
            uniqueHeaders.push(headerStr);
            seenHeaders.add(headerStr);
          }
        }
      });
    }

    if (uniqueHeaders.length === 0) {
      toast.error(
        `No valid, unique headers found in selected row ${rowNum}. Please check the row or file.`,
        { position: "top-center" }
      );
      return;
    }

    const dataRowsAfterHeader = rawSheetData.slice(adjustedHeaderRowIndex + 1);
    const formattedDataObjects = dataRowsAfterHeader.map((dataRowArray) => {
      const obj = {};
      actualHeaderRowArray.forEach((headerValue, cellIndex) => {
        if (headerValue !== null && headerValue !== undefined) {
          const headerString = String(headerValue).trim();
          if (headerString !== "") {
            // Only create key if header cell wasn't empty
            obj[headerString] = dataRowArray[cellIndex];
          }
        }
      });
      return obj;
    });

    setParsedHeaders(uniqueHeaders);
    setParsedData(formattedDataObjects);

    if (formattedDataObjects.length === 0) {
      toast.info("Header row confirmed, but no data rows found after it.", {
        position: "top-center",
      });
    } else {
      successToast("Header row confirmed. Map fields below.");
    }

    setStage(MODAL_STAGES.MAP_FIELDS);
    trigger("email"); // Trigger RHF validation for email field
  };

  // Stage 3: Map Fields Submission (largely unchanged)
  const mergeDataByEmail = (dataToMerge, currentMapping) => {
    const mergedData = {};
    let processedCount = 0;
    let invalidEmailCount = 0;

    dataToMerge.forEach((item) => {
      const emailValue = item[currentMapping.email];
      const email = emailValue ? String(emailValue).trim().toLowerCase() : "";

      if (email && email.includes("@") && email.includes(".")) {
        processedCount++;
        if (!mergedData[email]) {
          mergedData[email] = {
            email: email,
            firstName:
              currentMapping.firstName && item[currentMapping.firstName]
                ? String(item[currentMapping.firstName]).trim()
                : null,
            lastName:
              currentMapping.lastName && item[currentMapping.lastName]
                ? String(item[currentMapping.lastName]).trim()
                : null,
            phone:
              currentMapping.phone && item[currentMapping.phone]
                ? formatPhoneNumber(String(item[currentMapping.phone]).trim())
                : null,
            location:
              currentMapping.location && item[currentMapping.location]
                ? String(item[currentMapping.location]).trim()
                : null,
            source:
              currentMapping.source && item[currentMapping.source]
                ? String(item[currentMapping.source]).trim()
                : null,
            gender:
              currentMapping.gender && item[currentMapping.gender]
                ? String(item[currentMapping.gender]).trim()
                : null,
            totalTimeInSession:
              currentMapping.sessionMinutes &&
              item[currentMapping.sessionMinutes]
                ? parseInt(
                    String(item[currentMapping.sessionMinutes]).trim(),
                    10
                  ) || 0
                : 0,
          };
        } else {
          if (
            currentMapping.sessionMinutes &&
            item[currentMapping.sessionMinutes]
          ) {
            const sessionValue = String(
              item[currentMapping.sessionMinutes]
            ).trim();
            mergedData[email].totalTimeInSession +=
              parseInt(sessionValue, 10) || 0;
          }
        }
      } else {
        invalidEmailCount++;
      }
    });

    const finalData = Object.values(mergedData).map((item) => ({
      email: item.email,
      firstName: item.firstName,
      lastName: item.lastName,
      phone: item.phone,
      location: item.location,
      source: item.source,
      gender: item.gender,
      timeInSession: item.totalTimeInSession,
    }));
    return { finalData, processedCount, invalidEmailCount };
  };

  const onSubmit = (formData) => {
    if (!formData.email?.value) {
      toast.error("Email field mapping is required.", {
        position: "top-center",
      });
      setError("email", {
        type: "manual",
        message: "Email mapping is required",
      });
      return;
    }

    const currentMapping = formFields.reduce((acc, field) => {
      acc[field.name] = formData[field.name]?.value || null;
      return acc;
    }, {});

    const {
      finalData: mergedResult,
      processedCount,
      invalidEmailCount,
    } = mergeDataByEmail(parsedData, currentMapping);

    if (mergedResult.length === 0) {
      let message = "No valid attendee data found after processing.";
      if (processedCount === 0 && invalidEmailCount > 0) {
        message += ` All ${invalidEmailCount} rows were skipped due to invalid/empty email.`;
      } else if (invalidEmailCount > 0) {
        message += ` ${processedCount} rows processed, ${invalidEmailCount} skipped.`;
      }
      message +=
        " Ensure email column is correctly mapped and contains valid emails.";
      toast.error(message, { position: "top-center", duration: 6000 });
      return;
    }

    mergedAttendeeCountRef.current = mergedResult.length; // Store for success message

    logUserActivity({
      action: "import",
      type: "XLSX Data",
      detailItem: `${tabValue} webinar for webinar ID: ${webinarId}. Attempting import of ${mergedResult.length} attendees.`,
    });

    dispatch(
      addAttendees({
        webinarId: webinarId,
        isAttended: tabValue === "postWebinar",
        data: mergedResult,
      })
    );
  };

  // --- Effects ---
  useEffect(() => {
    if (isSuccess) {
      successToast(
        `Successfully imported ${mergedAttendeeCountRef.current} attendees for ${tabValue}.`
      );
      handleCloseModal();
    }
    if (error) {
      console.error("Attendee import error:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "An unexpected error occurred.";
      toast.error(`Import failed: ${errorMessage}`, {
        position: "top-center",
        duration: 6000,
      });
    }
    // No Redux clear here, assuming it's handled by the slice or a wrapper component
  }, [isSuccess, error]); // Removed dispatch, tabValue, parsedData as they don't gate the effect logic directly for toast/close

  const handleCloseModal = () => {
    setModal(false);
    reset(defaultFormValues);
    setStage(MODAL_STAGES.UPLOAD_FILE);
    setRawSheetData([]);
    setPreviewDisplayData([]);
    setParsedHeaders([]);
    setParsedData([]);
    setHeaderRowNumber("");
    setIsParsingFile(false);
    clearErrors();
    mergedAttendeeCountRef.current = 0;
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      if (!isSubmitting && !isImporting && !isParsingFile) {
        handleCloseModal();
      }
    }
  };

  const overallLoading = isSubmitting || isImporting || isParsingFile;

  // Dynamic preview table headers
  let actualColsToDisplayInPreview = 0;
  if (previewDisplayData.length > 0) {
    actualColsToDisplayInPreview = previewDisplayData.reduce(
      (max, row) => Math.max(max, row.length),
      0
    );
  } else if (rawSheetData.length > 0 && rawSheetData[0]) {
    actualColsToDisplayInPreview = Math.min(
      rawSheetData[0].length,
      MAX_PREVIEW_COLS
    );
  }
  actualColsToDisplayInPreview = Math.min(
    actualColsToDisplayInPreview,
    MAX_PREVIEW_COLS
  );

  const previewTableHeadersJSX = Array.from({
    length: actualColsToDisplayInPreview,
  }).map((_, i) => (
    <th
      key={`col-header-${i}`}
      className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap"
    >
      Col {i + 1}
    </th>
  ));

  return (
    <div
      className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-300/20 backdrop-blur-sm"
      aria-labelledby="modal-title"
      aria-modal="true"
      tabIndex="-1"
      role="dialog"
      id="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="rounded bg-white shadow-xl py-2 overflow-y-auto max-h-[90vh] w-[95%] max-w-3xl flex flex-col"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 border-b shrink-0">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
            Import Attendees -{" "}
            {tabValue === "preWebinar" ? "Registered" : "Attended"}
          </h3>
          <button
            onClick={handleCloseModal}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition duration-300"
            aria-label="close dialog"
            disabled={overallLoading}
          >
            <span className="relative only:-mx-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          </button>
        </div>

        <div className="px-6 md:px-8 py-4 flex flex-col gap-6 grow overflow-y-auto">
          {/* Stage 1: Upload File */}
          {stage === MODAL_STAGES.UPLOAD_FILE && (
            <div className="max-w-md mx-auto h-48 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
              {isParsingFile ? (
                <div className="flex flex-col items-center">
                  <ClipLoader color="#3b82f6" size={30} />
                  <p className="mt-2 text-gray-700 text-sm">Parsing file...</p>
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer text-center p-4 md:p-8 ${
                    overallLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <svg
                    className="w-12 h-12 mx-auto text-indigo-500"
                    viewBox="0 0 41 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.1667 26.6667C8.48477 26.6667 5.5 23.6819 5.5 20C5.5 16.8216 7.72428 14.1627 10.7012 13.4949C10.5695 12.9066 10.5 12.2947 10.5 11.6667C10.5 7.0643 14.231 3.33334 18.8333 3.33334C22.8655 3.33334 26.2288 6.19709 27.0003 10.0016C27.0556 10.0006 27.1111 10 27.1667 10C31.769 10 35.5 13.731 35.5 18.3333C35.5 22.3649 32.6371 25.7279 28.8333 26.5M25.5 21.6667L20.5 16.6667M20.5 16.6667L15.5 21.6667M20.5 16.6667L20.5 36.6667"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-3 text-gray-700 max-w-xs mx-auto">
                    <span className="font-medium text-indigo-600">
                      Select an XLSX or XLS file
                    </span>{" "}
                    or drag and drop here.
                  </p>
                </label>
              )}
              <input
                id="file-upload"
                accept=".csv, text/csv"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={overallLoading}
              />
            </div>
          )}

          {/* Stage 2: Preview Data & Select Header Row */}
          {stage === MODAL_STAGES.PREVIEW_DATA && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  File Preview (First {MAX_PREVIEW_ROWS} rows,{" "}
                  {MAX_PREVIEW_COLS} columns):
                </p>
                <div className="overflow-x-auto border border-slate-300 rounded-md max-h-60">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Select (Row #)
                        </th>
                        {previewTableHeadersJSX}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {previewDisplayData.map((row, rowIndex) => (
                        <tr
                          key={`preview-row-${rowIndex}`}
                          onClick={() =>
                            setHeaderRowNumber(String(rowIndex + 1))
                          }
                          className={`cursor-pointer hover:bg-slate-50 ${
                            parseInt(headerRowNumber, 10) === rowIndex + 1
                              ? "bg-blue-100"
                              : ""
                          }`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="radio"
                              name="headerRowSelect"
                              checked={
                                parseInt(headerRowNumber, 10) === rowIndex + 1
                              }
                              onChange={() =>
                                setHeaderRowNumber(String(rowIndex + 1))
                              }
                              className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 font-medium">
                              {rowIndex + 1}
                            </span>
                          </td>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`cell-${rowIndex}-${cellIndex}`}
                              className="px-3 py-2 whitespace-nowrap truncate max-w-xs"
                              title={cell}
                            >
                              {cell}
                            </td>
                          ))}
                          {/* Fill empty cells if row has fewer than actualColsToDisplayInPreview */}
                          {Array.from({
                            length: actualColsToDisplayInPreview - row.length,
                          }).map((_, k) => (
                            <td
                              key={`empty-cell-${rowIndex}-${k}`}
                              className="px-3 py-2"
                            ></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rawSheetData.length > MAX_PREVIEW_ROWS && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing first {MAX_PREVIEW_ROWS} of {rawSheetData.length}{" "}
                    total rows.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label
                  htmlFor="header-row-input"
                  className="font-medium text-sm text-gray-700 sm:w-48 shrink-0"
                >
                  Specify Header Row:
                </label>
                <input
                  id="header-row-input"
                  type="number"
                  min="1"
                  max={rawSheetData.length}
                  className="w-full mt-1 sm:mt-0 px-3 py-2 text-gray-700 border border-slate-300 rounded-lg outline-none focus:border-teal-400 shadow-sm disabled:opacity-50"
                  placeholder={`e.g., 1`}
                  value={headerRowNumber}
                  onChange={(e) => setHeaderRowNumber(e.target.value)}
                  disabled={overallLoading}
                />
              </div>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md text-center transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePreviewAndProceedToMap}
                disabled={
                  overallLoading ||
                  !headerRowNumber ||
                  parseInt(headerRowNumber, 10) < 1 ||
                  parseInt(headerRowNumber, 10) > rawSheetData.length
                }
              >
                Next: Map Fields
              </button>
            </div>
          )}

          {/* Stage 3: Map Fields */}
          {stage === MODAL_STAGES.MAP_FIELDS && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="h-full flex flex-col"
            >
              {" "}
              {/* Allow form to grow */}
              <div className="shrink-0">
                {parsedData.length === 0 && parsedHeaders.length > 0 && (
                  <p className="text-sm text-orange-600 font-medium mb-2">
                    No data rows found after the header. You can map headers,
                    but no data will be imported.
                  </p>
                )}
                {parsedHeaders.length === 0 && (
                  <p className="text-sm text-red-600 font-medium mb-2">
                    No headers were parsed. Cannot proceed with mapping. Please
                    go back and check header row selection.
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-slate-300 overflow-auto grow">
                {" "}
                {/* Table takes available space */}
                <table className="min-w-full text-gray-800 divide-y divide-slate-200">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Attendee Field
                      </th>
                      <th className="px-6 py-3 max-w-60 min-w-w-60 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        File Column
                      </th>
                      <th className="px-6 w-72 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Example Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {formFields.map((field, index) => (
                      <tr key={field.name}>
                        <td className="px-6 py-2 whitespace-nowrap">
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </td>
                        <td className="px-6 py-2 w-60">
                          <Controller
                            control={control}
                            name={field.name}
                            rules={{
                              required: field.required
                                ? `${field.label} mapping is required`
                                : false,
                            }}
                            render={({ field: controllerField }) => (
                              <Select
                                {...controllerField}
                                options={generateSelectOptions(parsedHeaders)}
                                isClearable={!field.required}
                                placeholder={
                                  field.required
                                    ? `Select ${field.label}`
                                    : "Optional"
                                }
                                isDisabled={
                                  overallLoading || parsedHeaders.length === 0
                                }
                                menuPlacement={
                                  index > formFields.length - 3 ? "top" : "auto"
                                } // Adjust for last few items
                                styles={{
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 99999,
                                  }),
                                }} // Ensure dropdown is on top
                                menuPortalTarget={document.body}
                              />
                            )}
                          />
                          {errors[field.name] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[field.name]?.message}
                            </p>
                          )}
                        </td>
                        <td
                          className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs"
                          title={formatDisplayedValue(
                            selectedMapping[field.name],
                            parsedData,
                            field.exampleFormatter
                          )}
                        >
                          {formatDisplayedValue(
                            selectedMapping[field.name],
                            parsedData,
                            field.exampleFormatter
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="shrink-0 mt-4">
                {" "}
                {/* Submit button section */}
                <button
                  type="submit"
                  disabled={
                    overallLoading ||
                    !isValid ||
                    parsedData.length === 0 ||
                    parsedHeaders.length === 0
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md text-center transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {overallLoading ? (
                    <ClipLoader color="#fff" size={20} />
                  ) : (
                    "Import Attendees"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadXslxModal;
