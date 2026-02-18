import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { useParams } from "react-router-dom";
import { addAttendees } from "../../../features/actions/attendees";
import { ClipLoader } from "react-spinners";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { formatPhoneNumber, getBestHeaderMatch, successToast } from "../../../utils/extra";

const MODAL_STAGES = {
  UPLOAD_FILE: "uploadFile",
  PREVIEW_DATA: "previewData",
  MAP_FIELDS: "mapFields",
};

const excelSerialDateToJSDate = (input) => {
  console.log(input, typeof input, new Date(input));
  if (input === null || input === undefined || input === "") {
    return null;
  }

  if (typeof input === "string") {
    const customFormatRegex =
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/i;

    const match = input.match(customFormatRegex);
    if (match) {
      const [, day, month, year, hourStr, minuteStr, secondStr, meridian] =
        match;

      let hours = parseInt(hourStr, 10);
      const minutes = parseInt(minuteStr, 10);
      const seconds = parseInt(secondStr, 10);

      // Convert to 24-hour format
      if (meridian.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
      } else if (meridian.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      // Note: month - 1 because JS months are 0-based
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hours,
        minutes,
        seconds
      );

      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    // Fallback to standard ISO-like parsing
    const standardDate = new Date(input);
    if (!isNaN(standardDate.getTime())) {
      return standardDate;
    }
  }

  let serialNum;
  if (typeof input === "string") {
    serialNum = parseFloat(input);
  } else if (typeof input === "number") {
    serialNum = input;
  } else {
    return null;
  }

  if (isNaN(serialNum)) {
    return null;
  }

  if (serialNum < 1) {
    return null;
  }

  const excelEpoch = new Date("1899-12-30T00:00:00.000Z");
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const dateInMilliseconds =
    excelEpoch.getTime() + serialNum * millisecondsPerDay;
  const jsDate = new Date(dateInMilliseconds);

  if (isNaN(jsDate.getTime())) {
    return null;
  }

  const istOffsetInMs = 5.5 * 60 * 60 * 1000; // This equals 19,800,000

  const utcMilliseconds = jsDate.getTime() - istOffsetInMs;

  const utcDate = new Date(utcMilliseconds);

  return utcDate;
};

// Define the required and optional fields for mapping (remains the same)
const FIELDS_TO_MAP = [
  {
    name: "email",
    label: "Email",
    keywords: ["email"],
    required: true,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "firstName",
    label: "First Name / Original Name",
    keywords: ["firstname", "first name", "original name", "originalname"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "lastName",
    label: "Last Name",
    keywords: ["lastname", "last name", "sur name", "surname"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "phone",
    label: "Phone Number",
    keywords: ["phone", "phone number", "phonenumber"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "location",
    label: "Location",
    keywords: ["location", "city"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "source",
    label: "Source",
    keywords: ["source"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "tags",
    label: "Tags",
    keywords: ["tags"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
  {
    name: "gender",
    label: "Gender",
    keywords: ["gender"],
    required: false,
    exampleFormatter: (val) => (val ? val.toString() : ""),
  },
];

const MAX_PREVIEW_ROWS = 20;
const MAX_PREVIEW_COLS = 100;

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
            keywords: [
              "session minutes",
              "duration",
              "time in session",
              "duration minutes",
              "session time",
            ],
            required: false,
            exampleFormatter: (val) => (val ? val.toString() : ""),
          },
          {
            name: "inTime",
            label: "Join Time (Datetime)",
            keywords: ["join time", "jointime"],
            required: false,
            exampleFormatter: (val) => {
              if (val === null || val === undefined || val === "") return "";
              const date = excelSerialDateToJSDate(val);
              // Format for display: local date/time string, or original value if conversion fails
              return date ? date.toLocaleString() : String(val);
            },
          },
          {
            name: "outTime",
            label: "Leave Time (Datetime)",
            keywords: ["leave time", "leavetime"],
            required: false,
            exampleFormatter: (val) => {
              if (val === null || val === undefined || val === "") return "";
              const date = excelSerialDateToJSDate(val);
              // Format for display: local date/time string, or original value if conversion fails
              return date ? date.toLocaleString() : String(val);
            },
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
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an .xlsx or .xls file.", {
        position: "top-center",
      });
      event.target.value = null;
      return;
    }

    setIsParsingFile(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: null,
        });

        if (!jsonData || jsonData.length === 0) {
          toast.error("The uploaded file is empty or could not be read.", {
            position: "top-center",
          });
          setIsParsingFile(false);
          event.target.value = null;
          return;
        }

        console.log("[UploadXlsx] XLSX parsed", {
          fileName: file.name,
          sheetName,
          totalRowsFromFile: jsonData.length,
        });

        setRawSheetData(jsonData);

        const preview = jsonData.slice(0, MAX_PREVIEW_ROWS).map((row) => {
          const newRow = [];
          for (let i = 0; i < Math.min(row.length, MAX_PREVIEW_COLS); i++) {
            newRow.push(
              row[i] === null || row[i] === undefined ? "" : String(row[i])
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
        // Suggest Zoom default, user can change
        setHeaderRowNumber("1");

        setStage(MODAL_STAGES.PREVIEW_DATA);
        successToast("File parsed. Please select or confirm the header row.");
      } catch (error) {
        console.error("Error parsing XLSX file:", error);
        toast.error(
          `Error processing file: ${error.message || "Unknown error."}`,
          { position: "top-center" }
        );
        setRawSheetData([]);
        setPreviewDisplayData([]);
      } finally {
        setIsParsingFile(false);
        event.target.value = null; // Reset input for re-upload
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      toast.error(
        `Error reading file: ${error.message || "Could not read file."}`,
        { position: "top-center" }
      );
      setIsParsingFile(false);
      event.target.value = null;
    };
    reader.readAsBinaryString(file);
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
    const isBlankRow = (row) => {
      const arr = Array.isArray(row) ? row : [];
      return arr.every(
        (cell) =>
          cell == null ||
          cell === undefined ||
          String(cell).trim() === ""
      );
    };
    const blankRowCount = dataRowsAfterHeader.filter(isBlankRow).length;

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

    console.log("[UploadXlsx] Header applied", {
      headerRowNumber: rowNum,
      dataRowsAfterHeader: dataRowsAfterHeader.length,
      blankRowsCount: blankRowCount,
      dataRowsForMapping: formattedDataObjects.length,
    });

    setParsedHeaders(uniqueHeaders);
    setParsedData(formattedDataObjects);

    const autofillMapping = {};
    formFields.forEach((field) => {
      const match =
        getBestHeaderMatch(field.keywords, uniqueHeaders);
      autofillMapping[field.name] = match
        ? { label: match, value: match }
        : null;
    });
    reset(autofillMapping);

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
    const unMergedData = [];
    let processedCount = 0;
    let invalidEmailCount = 0;
    let invalidDateCount = 0;

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
            tags:
              currentMapping.tags && item[currentMapping.tags]
                ? String(item[currentMapping.tags]).trim()
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

        const rawInTime = currentMapping.inTime
          ? item[currentMapping.inTime]
          : null;
        const rawOutTime = currentMapping.outTime
          ? item[currentMapping.outTime]
          : null;

        // 2. Attempt to parse both dates. The function will return a Date object or null.
        const parsedInTime = excelSerialDateToJSDate(rawInTime);
        const parsedOutTime = excelSerialDateToJSDate(rawOutTime);

        // 3. The CRITICAL check: Only proceed if BOTH dates are valid Date objects.
        if (parsedInTime && parsedOutTime) {
          // Both dates are valid, so we can build and push the object.
          const objForUnmerdedData = {
            email: email,
            firstName:
              currentMapping.firstName && item[currentMapping.firstName]
                ? String(item[currentMapping.firstName]).trim()
                : null,
            lastName:
              currentMapping.lastName && item[currentMapping.lastName]
                ? String(item[currentMapping.lastName]).trim()
                : null,

            // Use the already parsed and validated Date objects.
            inTime: parsedInTime,
            outTime: parsedOutTime,
          };

          unMergedData.push(objForUnmerdedData);
        } else {
          invalidDateCount++;
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
      tags: item.tags,
      gender: item.gender,
      timeInSession: item.totalTimeInSession,
    }));
    return { finalData, processedCount, invalidEmailCount, unMergedData, invalidDateCount };
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
      unMergedData,
      invalidDateCount,
    } = mergeDataByEmail(parsedData, currentMapping);

    console.log("[UploadXlsx] Processing summary", {
      inputRowsToMerge: parsedData.length,
      rowsWithValidEmail: processedCount,
      invalidOrBlankEmailRows: invalidEmailCount,
      skippedInvalidDates: invalidDateCount,
      duplicateRowsMerged: processedCount - mergedResult.length,
      uniqueMergedRecords: mergedResult.length,
      unMergedRecords: unMergedData.length,
      totalRecordsToSendToBackend: mergedResult.length + unMergedData.length,
      skippedRowsTotal: invalidEmailCount + invalidDateCount,
    });

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

    console.log("[UploadXlsx] Sending to backend", {
      mainAttendeesCount: mergedResult.length,
      unMergedDataCount: unMergedData.length,
      webinarId,
      tab: tabValue,
    });

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
        unMergedData,
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
        className="rounded bg-white shadow-xl py-2 overflow-y-auto max-h-[90vh] w-[95%] max-w-5xl flex flex-col"
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
            <div className="w-full max-w-lg mx-auto h-48 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
              {isParsingFile ? (
                <div className="flex flex-col items-center">
                  <ClipLoader color="#3b82f6" size={30} />
                  {/* 2. Adjusted text size for consistency */}
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
                    className="w-10 h-10 md:w-12 md:h-12 mx-auto text-indigo-500"
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
                  <p className="mt-3 text-gray-700 text-sm md:text-base max-w-xs mx-auto">
                    <span className="font-medium text-indigo-600">
                      Select an XLSX or XLS file
                    </span>{" "}
                    or drag and drop here.
                  </p>
                </label>
              )}
              <input
                id="file-upload"
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
                <div className="overflow-x-auto border border-slate-300 rounded-md max-h-72 md:max-h-96">
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
                  min={1}
                  max={20}
                  className="w-full mt-1 sm:mt-0 px-3 py-2 text-gray-700 border border-slate-300 rounded-lg outline-none focus:border-teal-400 shadow-sm disabled:opacity-50"
                  placeholder="e.g., 1"
                  value={headerRowNumber}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "" || /^\d+$/.test(value)) {
                      const number = Number(value);
                      if (value === "" || (number >= 0 && number <= 20)) {
                        setHeaderRowNumber(value);
                      }
                    }
                  }}
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

              {/* --- Container for the mapping UI, grows to fill available space --- */}
              <div className="overflow-auto grow">
                {/* ================================== */}
                {/* DESKTOP TABLE VIEW (Hidden on mobile) */}
                {/* ================================== */}
                <table className="hidden md:table min-w-full text-gray-800 divide-y divide-slate-200">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 w-60 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Attendee Field
                      </th>
                      <th className="px-6 py-3 w-60 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
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
                        <td className="px-6 py-1 whitespace-nowrap">
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </td>
                        <td className="px-6 py-1">
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
                                  index > formFields.length - 5 ? "top" : "auto"
                                }
                                styles={{
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 99999,
                                  }),
                                }}
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
                          className="px-6 py-1 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs"
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

                {/* ================================= */}
                {/* MOBILE CARD VIEW (Hidden on desktop) */}
                {/* ================================= */}
                <div className="md:hidden space-y-4">
                  {formFields.map((field, index) => (
                    <div
                      key={field.name}
                      className="bg-white border border-slate-200 rounded-lg p-4"
                    >
                      {/* Field Label */}
                      <label className="block text-sm font-medium text-gray-800">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>

                      {/* Controller and Select (Same exact logic) */}
                      <div className="mt-1">
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
                                  ? `Select mapping...`
                                  : "Optional"
                              }
                              isDisabled={
                                overallLoading || parsedHeaders.length === 0
                              }
                              menuPlacement="auto"
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 99999,
                                }),
                              }}
                              menuPortalTarget={document.body}
                            />
                          )}
                        />
                        {errors[field.name] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[field.name]?.message}
                          </p>
                        )}
                      </div>

                      {/* Example Value */}
                      {selectedMapping[field.name] && (
                        <div
                          className="mt-2 text-xs text-gray-500"
                          title={formatDisplayedValue(
                            selectedMapping[field.name],
                            parsedData,
                            field.exampleFormatter
                          )}
                        >
                          <span className="font-medium text-gray-600">
                            Example:
                          </span>{" "}
                          <span className="italic truncate">
                            {formatDisplayedValue(
                              selectedMapping[field.name],
                              parsedData,
                              field.exampleFormatter
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* --- Submit Button --- */}
              <div className="shrink-0 mt-4">
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
