import { useEffect, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Tag,
  Download,
  Calendar,
  Users,
  Clock,
  Activity,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  getAttendees,
  getWebinarParticipants,
} from "../../../features/actions/attendees";
import { clearWebinarParticipants } from "../../../features/slices/attendees";
import WebinarTrendChart from "./WebinarTrendChart";
import WebinarParticipantsTable from "./WebinarParticipantsTable";
import * as XLSX from "xlsx";
import { getTagsData, setTagsData } from "../../../features/slices/globalData";
import { errorToast, formatIsoStringAsLocalAmPm } from "../../../utils/extra";
import FilteredParticipantsTable from "./FilteredParticipantsTable";
import tagsService from "../../../services/tagsService";
import { useBulkApplyTagsToEmails } from "../../../hooks/useTags";

const WebinarParticipants = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
        return [];
      }

      const activeParticipants = mergedAttendeeData.filter((p) => {
        const inMs = new Date(p.inTime).getTime();
        const outMs = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        return inMs <= timestamp && outMs >= timestamp;
      });

      return activeParticipants;
    },
    [mergedAttendeeData]
  );

  const handleDownload = useCallback(
    (dataPoint) => {
      const timestamp = dataPoint.x;
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
    if (
      !minMaxRange.min ||
      !minMaxRange.max ||
      !mergedAttendeeData ||
      mergedAttendeeData.length === 0
    ) {
      return [];
    }

    const participantsByEmail = mergedAttendeeData.reduce((acc, p) => {
      if (p.email) {
        if (!acc[p.email]) {
          acc[p.email] = [];
        }
        acc[p.email].push(p);
      }
      return acc;
    }, {});

    const allMergedSessions = [];
    const oneMinuteInMs = 60 * 1000;

    for (const email in participantsByEmail) {
      const userSessions = participantsByEmail[email];

      userSessions.sort(
        (a, b) => new Date(a.inTime).getTime() - new Date(b.inTime).getTime()
      );

      if (userSessions.length === 0) continue;

      let currentMerged = { ...userSessions[0] };

      for (let i = 1; i < userSessions.length; i++) {
        const nextSession = userSessions[i];

        const currentOutMs = new Date(currentMerged.outTime).getTime();
        const nextInMs = new Date(nextSession.inTime).getTime();
        const nextOutMs = new Date(nextSession.outTime).getTime();

        if (nextInMs - currentOutMs < oneMinuteInMs) {
          if (nextOutMs > currentOutMs) {
            currentMerged.outTime = nextSession.outTime;
          }
        } else {
          allMergedSessions.push(currentMerged);
          currentMerged = { ...nextSession };
        }
      }
      allMergedSessions.push(currentMerged);
    }

    const finalFilteredAndClamped = allMergedSessions
      .filter((p) => {
        const inMs = new Date(p.inTime).getTime();
        const outMs = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        return inMs < minMaxRange.max && outMs > minMaxRange.min && p.inTime !== p.outTime;
      })
      .map((p) => {
        const inMs = new Date(p.inTime).getTime();
        const outMs = p.outTime ? new Date(p.outTime).getTime() : Date.now();

        const effectiveStartTime = Math.max(inMs, minMaxRange.min);
        const effectiveEndTime = Math.min(outMs, minMaxRange.max);

        const finalParticipant = {
          ...p,
          inTime: new Date(effectiveStartTime).toISOString(),
          outTime: new Date(effectiveEndTime).toISOString(),
        };

        const durationMs = effectiveEndTime - effectiveStartTime;
        const durationMinutes = durationMs > 0 ? durationMs / (1000 * 60) : 0;
        finalParticipant.timeDifference = Math.ceil(durationMinutes);

        return finalParticipant;
      });

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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[1600px] mx-auto space-y-6"
      >
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-xl border-slate-200/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
            >
              <ArrowLeft className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webinar Panel</span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
                Participant Engagement Analytics
              </h1>
            </div>
          </div>

          {/* Glowing Webinar Title Indicator */}
          {webinarName && (
            <div className="self-start sm:self-center flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-[18px] backdrop-blur shadow-sm">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 truncate max-w-[280px]">
                {webinarName}
              </span>
            </div>
          )}
        </div>

        {/* Visual Engagement Trend Chart */}
        <div className="w-full">
          <WebinarTrendChart
            onChangeOfVisibleDateRange={handleDateRangeChange}
            chartSeries={chartSeries}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Master Details Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Action Block and Detailed List (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6">

              {/* Dynamic Range Alerts */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={minMaxRange.min ? "active" : "empty"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${minMaxRange.min && minMaxRange.max
                    ? "bg-indigo-50/50 border-indigo-100/60 dark:bg-indigo-950/20 dark:border-indigo-850/40 text-indigo-700 dark:text-indigo-300"
                    : "bg-amber-50/50 border-amber-100/60 dark:bg-amber-950/20 dark:border-amber-850/40 text-amber-700 dark:text-amber-300"
                    }`}
                >
                  {minMaxRange.min && minMaxRange.max ? (
                    <>
                      <Clock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="text-xs font-semibold leading-relaxed">
                        <span>Showing filtered data from:</span>{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {formatIsoStringAsLocalAmPm(new Date(minMaxRange.min).toISOString())}
                        </span>
                        <span className="mx-1.5 font-medium">to</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {formatIsoStringAsLocalAmPm(new Date(minMaxRange.max).toISOString())}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Zoom, pan, or select a specific timeline interval on the chart above to extract participants active during that period.
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Action Bar (Tags Selection & Exports) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                <div className="flex-1 min-w-[200px]">
                  <Select
                    options={tagOptions}
                    value={tagOptions?.find((option) => option.value === selectedTag)}
                    onChange={(option) => setSelectedTag(option ? option.value : "")}
                    placeholder="Search or Select Tag..."
                    isClearable
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        height: "42px",
                        borderRadius: "12px",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        boxShadow: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": {
                          borderColor: "#6366F1",
                        },
                      }),
                      menu: (provided) => ({
                        ...provided,
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                        fontSize: "13px",
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected
                          ? "#6366F1"
                          : state.isFocused
                            ? "rgba(99, 102, 241, 0.08)"
                            : "transparent",
                        color: state.isSelected ? "#ffffff" : "#475569",
                        fontWeight: 500,
                      })
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleApplyTag}
                    disabled={isApplyingTags || !selectedTag || filteredParticipants.length === 0}
                    className="flex-1 sm:flex-none h-[42px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md shadow-indigo-500/10 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    <span>Apply Tag to {filteredParticipants.length} user(s)</span>
                  </Button>

                  <Button
                    onClick={exportFilteredParticipantsToExcel}
                    disabled={!filteredParticipants || filteredParticipants.length === 0}
                    variant="outline"
                    className="flex-1 sm:flex-none h-[42px] px-5 rounded-xl border-emerald-200 hover:border-emerald-300 dark:border-emerald-900 bg-emerald-50/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs tracking-wide active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>

              {/* Participants list container */}
              <FilteredParticipantsTable participants={filteredParticipants} />

            </div>
          </div>

          {/* Right Column Sidebar (1/3 width) */}
          <div className="lg:col-span-1 h-full">
            <WebinarParticipantsTable
              chartData={chartData}
              minMaxRange={minMaxRange}
              loading={isLoading}
              error={error}
              onDownload={handleDownload}
            />
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default WebinarParticipants;
