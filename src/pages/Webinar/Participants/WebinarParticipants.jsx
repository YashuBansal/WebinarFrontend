import { useEffect, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Select from "react-select";
import {
  getAttendees,
  getWebinarParticipants,
} from "../../../features/actions/attendees";
import { clearWebinarParticipants } from "../../../features/slices/attendees";
import WebinarTrendChart from "./WebinarTrendChart";
import WebinarParticipantsTable from "./WebinarParticipantsTable"; // Import the new component
import * as XLSX from "xlsx";
import { getTagsData, setTagsData } from "../../../features/slices/globalData";
import { errorToast, formatIsoStringAsLocalAmPm } from "../../../utils/extra";
import FilteredParticipantsTable from "./FilteredParticipantsTable";
import tagsService from "../../../services/tagsService";
import { useBulkApplyTagsToEmails } from "../../../hooks/useTags";

const WebinarParticipants = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { webinarParticipants, isLoading, error } = useSelector(
    (state) => state.attendee
  );
  const tagsData = useSelector(getTagsData);

  const [minMaxRange, setMinMaxRange] = useState({
    min: null,
    max: null,
  });
  const [selectedTag, setSelectedTag] = useState("");

  const {
    attendeeData,
    isLoading: attendeeLoading,
    webinarName,
  } = useSelector((state) => state.attendee);

  const { mutateAsync: applyTagsToEmails, isLoading: isApplyingTags } =
    useBulkApplyTagsToEmails(() => {
      // Refetch participants after tagging
      fetchData();
    });

  const mergedAttendeeData = useMemo(() => {
    const attendeeMap = new Map();

    if (Array.isArray(attendeeData)) {
      attendeeData.forEach((attendee) => {
        attendeeMap.set(attendee.email, {
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          phone: attendee.phone,
        });
      });
    }

    if (Array.isArray(webinarParticipants)) {
      const mergeData = webinarParticipants.map((wp) => {
        const tempWP = { ...wp };
        if (attendeeMap.has(wp.email)) {
          const attendee = attendeeMap.get(wp.email);
          tempWP["firstName"] = attendee.firstName;
          tempWP["lastName"] = attendee.lastName;
          tempWP["phone"] = attendee.phone;
        }
        return tempWP;
      });

      return mergeData;
    }
    return [];
  }, [attendeeData, webinarParticipants]);

  const fetchData = useCallback(() => {
    dispatch(getWebinarParticipants(id));
  }, [id, dispatch]);

  useEffect(() => {
    fetchData();

    return () => {
      dispatch(clearWebinarParticipants());
    };
  }, [dispatch, fetchData]);

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        dispatch(setTagsData(res.data));
      }
    });

    dispatch(
      getAttendees({
        id,
        isAttended: true,
        page: 1,
        limit: 10000,
        filters: {},
        sort: {},
      })
    );

  }, []);

  const chartData = useMemo(() => {
    if (!mergedAttendeeData || mergedAttendeeData.length === 0) {
      return [];
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    mergedAttendeeData.forEach((p) => {
      if (p.inTime) {
        const inTime = new Date(p.inTime).getTime();
        const outTime = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        if (isNaN(inTime) || inTime > outTime) return;

        if (inTime < minTime) {
          minTime = inTime;
        }
        if (outTime > maxTime) {
          maxTime = outTime;
        }
      }
    });

    if (minTime === Infinity || maxTime === -Infinity) {
      return [];
    }

    const startTime = new Date(minTime);
    startTime.setSeconds(0, 0);

    const endTime = new Date(maxTime);
    endTime.setSeconds(0, 0);

    const oneMinuteInMs = 60 * 1000;
    const seriesPoints = [];

    const participantSessions = mergedAttendeeData
      .map((p) => ({
        inMs: new Date(p.inTime).getTime(),
        outMs: p.outTime ? new Date(p.outTime).getTime() : Date.now(),
      }))
      .filter((s) => !isNaN(s.inMs) && !isNaN(s.outMs) && s.inMs <= s.outMs);

    for (
      let currentTime = startTime.getTime();
      currentTime <= endTime.getTime();
      currentTime += oneMinuteInMs
    ) {
      let attendeesInThisInterval = 0;
      const nextMinuteTime = currentTime + oneMinuteInMs;

      for (const session of participantSessions) {
        if (session.inMs < nextMinuteTime && currentTime < session.outMs) {
          attendeesInThisInterval++;
        }
      }

      seriesPoints.push({
        x: currentTime,
        y: attendeesInThisInterval,
      });
    }

    return seriesPoints;
  }, [mergedAttendeeData]);

  const chartSeries = useMemo(() => {
    console.log("Chart Data for Series:", chartData);
    return [
      {
        name: "Webinar Attendees",
        data: chartData,
      },
    ];
  }, [chartData]);

  const handleDateRangeChange = useCallback((xAxis) => {
    setMinMaxRange(xAxis);
  }, []);

  const exportParticipantsToExcel = (participants, timestamp) => {
    if (!participants || participants.length === 0) {
      console.warn("No participants to export.");
      return;
    }

    const data = participants.map((p, index) => ({
      "#": index + 1,
      "First Name": p.firstName || "N/A",
      "Last Name": p.lastName || "N/A",
      Email: p.email || "N/A",
      Phone: p.phone || "N/A",
      "Join Time": formatIsoStringAsLocalAmPm(p.inTime),
      "Leave Time": formatIsoStringAsLocalAmPm(p.outTime),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Active Participants");

    const filename = `active_participants_${new Date(
      timestamp
    ).toISOString()}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const getParticipantsActiveAt = useCallback(
    (timestamp) => {
      if (!mergedAttendeeData || mergedAttendeeData.length === 0) {
        console.log("No participants data available.");
        return;
      }

      const activeParticipants = mergedAttendeeData.filter((p) => {
        const inMs = new Date(p.inTime).getTime();
        const outMs = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        return inMs <= timestamp && outMs >= timestamp;
      });

      console.log(
        `Active participants at ${new Date(timestamp).toISOString()}:`,
        activeParticipants
      );

      return activeParticipants;
    },
    [mergedAttendeeData]
  );

  const handleDownload = useCallback(
    (dataPoint) => {
      const timestamp = dataPoint.x;
      console.log("Data point clicked:", dataPoint);

      const active = getParticipantsActiveAt(timestamp);
      exportParticipantsToExcel(active, timestamp);
    },
    [getParticipantsActiveAt]
  );

  const handleApplyTag = async () => {
    if (!selectedTag) {
      errorToast("Please select a tag first.");
      return;
    }

    if (!filteredParticipants || filteredParticipants.length === 0) {
      errorToast("There are no participants to tag.");
      return;
    }

    // Get unique, non-empty emails from all participants of this webinar
    const allParticipantEmails = [
      ...new Set(filteredParticipants.map((p) => p.email).filter(Boolean)),
    ];

    if (allParticipantEmails.length === 0) {
      errorToast("No participant emails found to tag.");
      return;
    }

    await applyTagsToEmails({
      emails: allParticipantEmails,
      webinarId: id,
      tag: selectedTag,
    });
  };

  const tagOptions = useMemo(
    () =>
      tagsData?.map((tag) => ({
        value: tag.name,
        label: tag.name,
      })),
    [tagsData]
  );

  const filteredParticipants = useMemo(() => {
    // Guard clause: Don't run if the date range or participants aren't set yet.
    if (
      !minMaxRange.min ||
      !minMaxRange.max ||
      !mergedAttendeeData ||
      mergedAttendeeData.length === 0
    ) {
      return [];
    }

    // --- STEP 1: Group all session records by email ---
    const participantsByEmail = mergedAttendeeData.reduce((acc, p) => {
      // Ensure email exists and is not empty
      if (p.email) {
        // If the email is not yet a key in our accumulator, initialize it with an empty array
        if (!acc[p.email]) {
          acc[p.email] = [];
        }
        // Push the current participant record to the array for that email
        acc[p.email].push(p);
      }
      return acc;
    }, {});

    // --- STEP 2: Process each user's sessions to merge close ones ---
    const allMergedSessions = [];
    const oneMinuteInMs = 60 * 1000;

    // Iterate over each email in our grouped object
    for (const email in participantsByEmail) {
      const userSessions = participantsByEmail[email];

      // Sort the sessions by their inTime to process them chronologically
      userSessions.sort(
        (a, b) => new Date(a.inTime).getTime() - new Date(b.inTime).getTime()
      );

      if (userSessions.length === 0) continue;

      // Start with the first session as our initial merged session
      let currentMerged = { ...userSessions[0] };

      // Loop through the rest of the sessions for this user
      for (let i = 1; i < userSessions.length; i++) {
        const nextSession = userSessions[i];

        const currentOutMs = new Date(currentMerged.outTime).getTime();
        const nextInMs = new Date(nextSession.inTime).getTime();
        const nextOutMs = new Date(nextSession.outTime).getTime();

        // Check if the gap between the current merged session's end and the next session's start is less than a minute
        if (nextInMs - currentOutMs < oneMinuteInMs) {
          // If so, merge them by extending the outTime of the current session
          // We take the later of the two out times to handle any odd overlapping data
          if (nextOutMs > currentOutMs) {
            currentMerged.outTime = nextSession.outTime;
          }
        } else {
          // If the gap is too large, the previous merged session is complete. Push it to our results.
          allMergedSessions.push(currentMerged);
          // Start a new merged session with the current session in the loop.
          currentMerged = { ...nextSession };
        }
      }
      // After the loop, push the last processed (or only) merged session
      allMergedSessions.push(currentMerged);
    }

    // --- STEP 3: Filter the merged sessions by the visible date range and "clamp" the times ---
    const finalFilteredAndClamped = allMergedSessions
      .filter((p) => {
        const inMs = new Date(p.inTime).getTime();
        // Handle cases where user is still active (outTime is null)
        const outMs = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        // A session overlaps with the range if it starts before the range ends AND ends after the range starts.
        // This is the most robust way to check for any overlap.
        return inMs < minMaxRange.max && outMs > minMaxRange.min  && p.inTime !== p.outTime;
      })
      .map((p) => {
        const inMs = new Date(p.inTime).getTime();
        const outMs = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        // Determine the effective start and end times *within* the selected range
        const effectiveStartTime = Math.max(inMs, minMaxRange.min);
        const effectiveEndTime = Math.min(outMs, minMaxRange.max);

        // Create the new participant object for the table
        const finalParticipant = {
          ...p,
          // The display times are clamped to the visible range
          inTime: new Date(effectiveStartTime).toISOString(),
          outTime: new Date(effectiveEndTime).toISOString(),
        };

        // --- START: NEW CODE TO CALCULATE TIME DIFFERENCE ---

        // Calculate the duration in milliseconds based on the effective times
        const durationMs = effectiveEndTime - effectiveStartTime;

        // Convert milliseconds to minutes and round to two decimal places
        const durationMinutes = durationMs > 0 ? durationMs / (1000 * 60) : 0;
        finalParticipant.timeDifference = Math.ceil(durationMinutes);

        // --- END: NEW CODE ---

        return finalParticipant;
      });

    // Optional: Sort the final list by email for consistent display
    return finalFilteredAndClamped.sort((a, b) =>
      a.email.localeCompare(b.email)
    );
  }, [minMaxRange, mergedAttendeeData]);

  const exportFilteredParticipantsToExcel = () => {
    if (!filteredParticipants || filteredParticipants.length === 0) {
      errorToast("No participants to export.");
      return;
    }

    const data = filteredParticipants.map((p, index) => ({
      "#": index + 1,
      "First Name": p.firstName || "N/A",
      "Last Name": p.lastName || "N/A",
      Email: p.email || "N/A",
      Phone: p.phone || "N/A",
      "Join Time": formatIsoStringAsLocalAmPm(p.inTime),
      "Leave Time": formatIsoStringAsLocalAmPm(p.outTime),
      "Duration (mins)": p.timeDifference,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Participants");
    XLSX.writeFile(workbook, "filtered_participants.xlsx");
  };

  return (
    <div className="mt-20 px-5">
      <WebinarTrendChart
        onChangeOfVisibleDateRange={handleDateRangeChange}
        chartSeries={chartSeries}
        isLoading={isLoading}
        error={error}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          {/* --- UPDATED SECTION FOR FILTERED PARTICIPANTS --- */}
          <div className="p-4 bg-white rounded-lg shadow">
            {/* --- UPDATED HEADING --- */}
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Filtered Participants
            </h3>

            {/* --- NEW: DISPLAY FOR SELECTED DATE RANGE --- */}
            <div className="my-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-center">
              {minMaxRange.min && minMaxRange.max ? (
                <p className="text-sm text-indigo-800">
                  <span className="font-semibold">Showing data from:</span>{" "}
                  {formatIsoStringAsLocalAmPm(
                    new Date(minMaxRange.min).toISOString()
                  )}
                  <span className="font-semibold mx-2">to</span>
                  {formatIsoStringAsLocalAmPm(
                    new Date(minMaxRange.max).toISOString()
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Zoom or pan on the chart above to filter participants by a
                  specific time range.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
              <div className="w-full sm:w-64">
                <Select
                  options={tagOptions}
                  value={tagOptions?.find(
                    (option) => option.value === selectedTag
                  )}
                  onChange={(option) => setSelectedTag(option.value)}
                  placeholder="Select a tag..."
                  className="block w-full"
                  menuPlacement="top"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: "1px solid #D1D5DB",
                      borderRadius: "0.375rem",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#6366F1",
                      },
                    }),
                  }}
                />
              </div>
              <button
                onClick={handleApplyTag}
                disabled={
                  isLoading || !selectedTag || filteredParticipants.length === 0
                }
                className="w-full text-nowrap sm:w-auto px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Applying..."
                  : `Apply Tag to ${filteredParticipants.length} user(s)`}
              </button>
              <button
                onClick={exportFilteredParticipantsToExcel}
                disabled={
                  !filteredParticipants || filteredParticipants.length === 0
                }
                className="w-full text-nowrap sm:w-auto px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Export Filtered
              </button>
            </div>

            <FilteredParticipantsTable participants={filteredParticipants} />
          </div>
        </div>
        <div className="col-span-1">
          <WebinarParticipantsTable
            chartData={chartData}
            minMaxRange={minMaxRange}
            loading={isLoading}
            error={error}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default WebinarParticipants;
