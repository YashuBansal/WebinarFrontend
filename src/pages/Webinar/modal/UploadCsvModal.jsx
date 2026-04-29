import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import Papa from "papaparse";
import { useParams } from "react-router-dom";
import { addAttendees } from "../../../features/actions/attendees";
import AppLoader from "../../../components/AppLoader";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { X, UploadCloud, FileText, FileJson, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../lib/utils";
import { formatPhoneNumber, getBestHeaderMatch, successToast } from "../../../utils/extra";

// Define stages for the modal workflow
const MODAL_STAGES = {
  UPLOAD_FILE: "uploadFile",
  PREVIEW_DATA: "previewData", // New stage for previewing and selecting header
  MAP_FIELDS: "mapFields",
};

/**
 * Parses a flexible date input, which can be:
 * 1. A standard date string (e.g., "Mar 30, 2024 20:12:38", "2024-03-30T20:12:38.000Z").
 * 2. An Excel serial number (e.g., 45379.8421).
 * @param {string | number | null | undefined} input The value to parse.
 * @returns {Date | null} A valid JavaScript Date object or null if parsing fails.
 */
const excelSerialDateToJSDate = (input) => {
  // 1. Handle empty or nullish inputs first.
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

  // 3. Handle as an Excel serial number (for numbers or string-formatted numbers).
  let serialNum;
  if (typeof input === "string") {
    // This will handle strings like "45379.84"
    serialNum = parseFloat(input);
  } else if (typeof input === "number") {
    serialNum = input;
  } else {
    // Should not be reached due to checks above, but good for safety.
    return null;
  }

  // If after parsing, it's not a number, the input is invalid.
  if (isNaN(serialNum)) {
    return null;
  }

  // A heuristic: Excel dates are large numbers. If the number is small,
  // it was likely not an intended date. e.g., an ID like '123'.
  // Day 1 in Excel is Jan 1, 1900. Day 0 is invalid.
  if (serialNum < 1) {
    return null;
  }

  // Excel's epoch starts on "day 0" which is Dec 30, 1899, to account for its 1900 leap year bug.
  const excelEpoch = new Date("1899-12-30T00:00:00.000Z");
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  // Calculate milliseconds from the Excel epoch.
  const dateInMilliseconds =
    excelEpoch.getTime() + serialNum * millisecondsPerDay;
  const jsDate = new Date(dateInMilliseconds);

  // Final validation before returning.
  return isNaN(jsDate.getTime()) ? null : jsDate;
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

const UploadCsvModal = ({ tabValue, setModal }) => {
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
      dynamicTyping: false, // Treat all values as strings initially, like the original
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
          const parseErrorsCount = results.errors?.length ?? 0;
          console.log("[UploadCsv] CSV parsed", {
            fileName: file.name,
            totalRowsFromFile: jsonData.length,
            parseErrorsCount,
          });
          if (parseErrorsCount > 0) {
            console.warn("[UploadCsv] Parse errors (first 5):", results.errors.slice(0, 5));
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

    console.log("[UploadCsv] Header applied", {
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

    console.log("[UploadCsv] Processing summary", {
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

    console.log("[UploadCsv] Sending to backend", {
      mainAttendeesCount: mergedResult.length,
      unMergedDataCount: unMergedData.length,
      webinarId,
      tab: tabValue,
    });

    logUserActivity({
      action: "import",
      type: "CSV Data",
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
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: titleColor }}>
                  Import Attendees (CSV)
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
                    <p className="text-sm font-medium text-slate-500">Parsing your CSV file...</p>
                  </div>
                ) : (
                  <>
                    <label htmlFor="csv-upload" className={cn("flex flex-col items-center gap-4 cursor-pointer group", overallLoading && "opacity-50 cursor-not-allowed")}>
                      <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Click to Upload CSV</p>
                        <p className="text-sm text-slate-500">or drag and drop your file here</p>
                      </div>
                    </label>
                    <input id="csv-upload" accept=".csv" type="file" className="hidden" onChange={handleFileUpload} disabled={overallLoading} />
                  </>
                )}
              </div>
            )}

            {/* Stage 2: Preview & Header Row */}
            {stage === MODAL_STAGES.PREVIEW_DATA && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span style={labelStyleInner}>Step 1: Confirm Header Row</span>
                      <p className="text-xs text-slate-500">Select the row that contains your table headers (e.g., Email, Name).</p>
                    </div>
                    {headerRowNumber && (
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Selected Row:</span>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm">
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
                                className={cn("cursor-pointer transition-colors", isSelected ? "bg-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}
                              >
                                <td className="px-4 py-3">
                                  <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold", isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 text-slate-400")}>
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
              <form id="map-fields-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <span style={labelStyleInner}>Step 2: Map File Columns to Attendee Fields</span>
                  <p className="text-xs text-slate-500 mb-6">Match the columns from your CSV to the fields in our system.</p>

                  <div className="border rounded-2xl overflow-hidden" style={{ borderColor: shellBorder }}>
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">System Field</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">CSV Column</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview Data</th>
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
                                    placeholder="Map Column..."
                                    menuPortalTarget={document.body}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {formatDisplayedValue(selectedMapping[field.name], parsedData, field.exampleFormatter) || "[N/A]"}
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
              {stage === MODAL_STAGES.UPLOAD_FILE ? "Choose a file to begin" :
                stage === MODAL_STAGES.PREVIEW_DATA ? `Row ${headerRowNumber} selected` :
                  `${parsedData.length} records ready to import`}
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
                  Confirm & Map Fields <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {stage === MODAL_STAGES.MAP_FIELDS && (
                <Button
                  type="submit"
                  form="map-fields-form"
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

export default UploadCsvModal;
