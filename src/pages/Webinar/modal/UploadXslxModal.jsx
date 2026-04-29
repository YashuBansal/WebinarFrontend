import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { useParams } from "react-router-dom";
import { addAttendees } from "../../../features/actions/attendees";
import AppLoader from "../../../components/AppLoader";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { X, UploadCloud, FileText, FileJson, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../lib/utils";
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
    name: "profession",
    label: "Profession",
    keywords: ["profession", "job", "title", "occupation"],
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const rsStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      borderColor: isDark ? "#334155" : "#e2e8f0",
      borderRadius: "12px",
      minHeight: "42px",
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? "#f8fafc" : "#0f172a",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      border: "1px solid " + (isDark ? "#334155" : "#e2e8f0"),
      borderRadius: "12px",
      overflow: "hidden",
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? (isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9") : "transparent",
      color: isDark ? "#f8fafc" : "#0f172a",
    }),
  };

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
            profession:
              currentMapping.profession && item[currentMapping.profession]
                ? String(item[currentMapping.profession]).trim()
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
      profession: item.profession,
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

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";
  const labelStyleInner = {
    fontFamily: "Inter, sans-serif",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: isDark ? "#94a3b8" : "#64748b",
    marginBottom: "4px",
    display: "block",
  };

  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };
  const applyBtn = {
    backgroundColor: "#22B573",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
  };

  return (
    <Dialog open={true} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-[1000px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-xl">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: titleColor }}>
                  Import Attendees (XLSX)
                </h3>
                <p className="text-xs text-slate-500">
                  {tabValue === "preWebinar" ? "Pre-Webinar Registration" : "Post-Webinar Attendance"}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" disabled={overallLoading}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Stage 1: Upload File */}
            {stage === MODAL_STAGES.UPLOAD_FILE && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-3xl transition-all" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F9FAFB" }}>
                {isParsingFile ? (
                  <div className="flex flex-col items-center gap-4">
                    <AppLoader size="lg" />
                    <p className="text-sm font-medium text-slate-500">Parsing your Excel file...</p>
                  </div>
                ) : (
                  <>
                    <label htmlFor="xlsx-upload" className={cn("flex flex-col items-center gap-4 cursor-pointer group", overallLoading && "opacity-50 cursor-not-allowed")}>
                      <div className="p-4 rounded-2xl bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Click to Upload XLSX</p>
                        <p className="text-sm text-slate-500">Select .xlsx or .xls file from your computer</p>
                      </div>
                    </label>
                    <input id="xlsx-upload" accept=".xlsx, .xls" type="file" className="hidden" onChange={handleFileUpload} disabled={overallLoading} />
                  </>
                )}
              </div>
            )}

            {/* Stage 2: Preview & Header Row */}
            {stage === MODAL_STAGES.PREVIEW_DATA && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                  <CheckCircle2 className="w-4 h-4" />
                  File uploaded successfully!
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span style={labelStyleInner}>Step 1: Confirm Header Row</span>
                      <p className="text-xs text-slate-500">Click on the row that contains your table column headers.</p>
                    </div>
                    {headerRowNumber && (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-500/20">
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400">Selected Row:</span>
                        <span className="text-sm font-bold text-green-800 dark:text-green-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm">
                          {headerRowNumber}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: shellBorder }}>
                    <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b" style={{ borderColor: shellBorder }}>Row</th>
                            {previewTableHeadersJSX}
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: shellBorder }}>
                          {previewDisplayData.map((row, rowIndex) => {
                            const isSelected = parseInt(headerRowNumber, 10) === rowIndex + 1;
                            return (
                              <tr
                                key={rowIndex}
                                onClick={() => setHeaderRowNumber(String(rowIndex + 1))}
                                className={cn("cursor-pointer transition-colors", isSelected ? "bg-green-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}
                              >
                                <td className="px-4 py-3">
                                  <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold", isSelected ? "bg-green-500 border-green-500 text-white" : "border-slate-300 text-slate-400")}>
                                    {rowIndex + 1}
                                  </div>
                                </td>
                                {row.map((cell, idx) => (
                                  <td key={idx} className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>


              </div>
            )}

            {/* Stage 3: Field Mapping */}
            {stage === MODAL_STAGES.MAP_FIELDS && (
              <form id="map-fields-form-xlsx" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <span style={labelStyleInner}>Step 2: Map Excel Columns</span>
                  <p className="text-xs text-slate-500 mb-6">Assign system fields to the corresponding columns from your file.</p>

                  <div className="border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: shellBorder }}>
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">System Field</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Excel Column</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Sample Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: shellBorder }}>
                        {formFields.map((field, index) => (
                          <tr key={field.name} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{field.label}</span>
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </td>
                            <td className="px-6 py-4">
                              <Controller
                                control={control}
                                name={field.name}
                                rules={{ required: field.required ? "Required" : false }}
                                render={({ field: rField }) => (
                                  <Select
                                    {...rField}
                                    options={generateSelectOptions(parsedHeaders)}
                                    styles={rsStyles}
                                    isClearable={!field.required}
                                    placeholder="Choose column..."
                                    menuPortalTarget={document.body}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {formatDisplayedValue(selectedMapping[field.name], parsedData, field.exampleFormatter) || "[Empty]"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


              </form>
            )}
          </div>

          {/* Global Footer (Back/Close) */}
          <div className="p-4 border-t flex items-center justify-between" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="text-xs text-slate-500">
              {stage === MODAL_STAGES.UPLOAD_FILE ? "Awaiting file upload..." : 
               stage === MODAL_STAGES.PREVIEW_DATA ? `${rawSheetData.length} total rows in file` : 
               `Mapping ${formFields.length} available fields`}
            </div>
            <div className="flex items-center gap-2">
              {stage !== MODAL_STAGES.UPLOAD_FILE && (
                <Button variant="outline" onClick={() => setStage(stage === MODAL_STAGES.MAP_FIELDS ? MODAL_STAGES.PREVIEW_DATA : MODAL_STAGES.UPLOAD_FILE)} className="rounded-xl h-10 px-6">
                  Back
                </Button>
              )}
              {stage === MODAL_STAGES.PREVIEW_DATA && (
                <Button
                  onClick={handlePreviewAndProceedToMap}
                  disabled={!headerRowNumber || overallLoading}
                  style={applyBtn}
                  className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105"
                >
                  Next: Map Fields <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {stage === MODAL_STAGES.MAP_FIELDS && (
                <Button
                  type="submit"
                  form="map-fields-form-xlsx"
                  disabled={overallLoading || !isValid}
                  style={applyBtn}
                  className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105"
                >
                  {overallLoading ? <AppLoader size="sm" variant="inverse" /> : "Complete Import"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadXslxModal;
