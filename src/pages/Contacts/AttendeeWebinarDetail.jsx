import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Activity,
  User,
  Phone,
  ShieldCheck,
  Bell,
  MapPin,
  Briefcase,
  Globe,
  Layers,
  Database
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getAttendee,
  getWebinarParticipants
} from "../../features/actions/attendees";
import { clearWebinarParticipants } from "../../features/slices/attendees";
import {
  formatDateAsNumber,
  formatDateAsNumberWithTime
} from "../../utils/extra";

const formatFullName = (attendee) => {
  if (!attendee) return "-";
  const firstName = attendee.firstName;
  const rawLastName = attendee.lastName;
  const lastName = rawLastName?.includes(":-)") ? "" : rawLastName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return "-";
};

const MetricCard = ({ label, value, icon: Icon, accent, isDark }) => (
  <div
    className="flex flex-col p-5 rounded-2xl border transition-all"
    style={{
      background: isDark ? "rgba(30, 41, 59, 0.4)" : "#ffffff",
      borderColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)"
    }}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <div 
        className="p-2 rounded-xl"
        style={{ background: accent + "15", color: accent }}
      >
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <span 
      className="text-2xl font-black tracking-tight"
      style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
    >
      {value}
    </span>
  </div>
);

const AttendeeWebinarDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const email = searchParams.get("email") || "";
  const registrationId = searchParams.get("id") || "";

  const { selectedAttendee, webinarParticipants, isLoading } = useSelector(
    (state) => state.attendee
  );

  // 1. Fetch Attendee details on load
  useEffect(() => {
    if (email) {
      dispatch(getAttendee({ email }));
    }
    return () => {
      dispatch(clearWebinarParticipants());
    };
  }, [dispatch, email]);

  // 2. Identify the Participant's overall record and specific webinar registration
  const attendeeInfo = useMemo(() => {
    if (Array.isArray(selectedAttendee) && selectedAttendee.length > 0) {
      return selectedAttendee[0];
    }
    return null;
  }, [selectedAttendee]);

  const specificWebinarInfo = useMemo(() => {
    if (attendeeInfo?.data) {
      const match = attendeeInfo.data.find(
        (d) => d._id === registrationId
      );
      return match || attendeeInfo.data[0];
    }
    return null;
  }, [attendeeInfo, registrationId]);

  const webinarId = useMemo(() => {
    return (
      specificWebinarInfo?.webinar?.[0]?._id ||
      specificWebinarInfo?.webinar?.[0]?.id ||
      specificWebinarInfo?.webinarId ||
      ""
    );
  }, [specificWebinarInfo]);

  // 3. Fetch Webinar sync logs once we identify the webinarId
  useEffect(() => {
    if (webinarId) {
      dispatch(getWebinarParticipants(webinarId));
    }
  }, [dispatch, webinarId]);

  // 4. Extract specific participant's database session logs
  const attendeeWebinarRecords = useMemo(() => {
    if (Array.isArray(webinarParticipants) && email) {
      return webinarParticipants.filter(
        (p) => p.email?.trim().toLowerCase() === email.trim().toLowerCase()
      );
    }
    return [];
  }, [webinarParticipants, email]);

  const webinarName = useMemo(() => {
    return (
      specificWebinarInfo?.webinar?.[0]?.webinarName ||
      "Webinar Event"
    );
  }, [specificWebinarInfo]);

  const webinarDate = useMemo(() => {
    return specificWebinarInfo?.webinar?.[0]?.webinarDate || null;
  }, [specificWebinarInfo]);

  // Helper to calculate exact session duration in minutes from times
  const getSessionDuration = (inTime, outTime) => {
    if (!inTime) return 0;
    const start = new Date(inTime).getTime();
    const end = outTime ? new Date(outTime).getTime() : Date.now();
    const diffMs = end - start;
    if (diffMs <= 0) return 0;
    return Math.round(diffMs / 60000);
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const chartData = useMemo(() => {
    if (!attendeeWebinarRecords.length) return [];
    
    const sorted = [...attendeeWebinarRecords].sort((a, b) => {
      return new Date(a.inTime).getTime() - new Date(b.inTime).getTime();
    });

    const seriesPoints = [];
    const padMs = 5 * 60 * 1000; // 5 minutes visual padding

    sorted.forEach((session, index) => {
      if (!session.inTime) return;
      
      const inMs = new Date(session.inTime).getTime();
      const outMs = session.outTime ? new Date(session.outTime).getTime() : Date.now();

      if (isNaN(inMs) || inMs > outMs) return;

      const durationMin = session.timeInSession || getSessionDuration(session.inTime, session.outTime) || 0;

      // 1. Padding point at start of first session
      if (index === 0) {
        seriesPoints.push({ x: inMs - padMs, y: 0 });
        seriesPoints.push({ x: inMs - 1000, y: 0 });
      } else {
        // Gap point between sessions
        const prevSession = sorted[index - 1];
        const prevOutMs = prevSession.outTime ? new Date(prevSession.outTime).getTime() : Date.now();
        if (inMs - prevOutMs > 1000) {
          seriesPoints.push({ x: prevOutMs + 1000, y: 0 });
          seriesPoints.push({ x: inMs - 1000, y: 0 });
        }
      }

      // 2. Exact start time of session (Rising Edge to durationMin)
      seriesPoints.push({ x: inMs, y: durationMin });

      // 3. Exact end time of session (Stays durationMin until end, then drops to 0 immediately)
      seriesPoints.push({ x: outMs, y: durationMin });
      seriesPoints.push({ x: outMs + 1000, y: 0 });

      // 4. Padding point at the end of the last session
      if (index === sorted.length - 1) {
        seriesPoints.push({ x: outMs + padMs, y: 0 });
      }
    });

    return seriesPoints;
  }, [attendeeWebinarRecords]);

  const chartSeries = useMemo(() => {
    return [{
      name: "Duration",
      data: chartData
    }];
  }, [chartData]);

  const chartOptions = useMemo(() => {
    return {
      chart: {
        id: "attendee-session-timeline-chart",
        type: "area",
        fontFamily: "Outfit, Inter, system-ui, sans-serif",
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: [],
          },
          autoSelected: "pan",
        },
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: false,
        },
        background: "transparent"
      },
      colors: ["#6366f1"],
      stroke: {
        curve: "straight",
        width: 2.5
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: "#6366f1",
              opacity: 0.3,
            },
            {
              offset: 100,
              color: "#6366f1",
              opacity: 0.0,
            },
          ],
        },
      },
      dataLabels: { enabled: false },
      markers: {
        size: 0,
        hover: { sizeOffset: 4 }
      },
      grid: {
        borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: {
            colors: isDark ? "#64748b" : "#475569",
            fontSize: "10px",
            fontWeight: 600
          },
          formatter: function (value, timestamp) {
            const options = {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            };
            const timeString = new Date(timestamp).toLocaleString(
              "en-IN",
              options
            );
            return timeString.replace("am", "AM").replace("pm", "PM");
          },
        },
        title: {
          text: "Timeline (IST)",
          style: {
            color: isDark ? "#64748b" : "#475569",
            fontSize: "11px",
            fontWeight: 600,
          },
        },
        axisBorder: { show: false },
        axisTicks: {
          show: true,
          color: isDark ? "#334155" : "#e2e8f0",
        }
      },
      yaxis: {
        min: 0,
        labels: {
          style: {
            colors: isDark ? "#64748b" : "#475569",
            fontSize: "10px",
            fontWeight: 600
          },
          formatter: function (val) {
            return `${val} min${val !== 1 ? 's' : ''}`;
          }
        },
        title: {
          text: "Duration (Minutes)",
          style: {
            color: isDark ? "#64748b" : "#475569",
            fontSize: "11px",
            fontWeight: 600,
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: isDark ? "dark" : "light",
        x: {
          formatter: function (value) {
            const options = {
              timeZone: "Asia/Kolkata",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            };
            const dateTimeString = new Date(value).toLocaleString(
              "en-IN",
              options
            );
            return dateTimeString.replace("am", "AM").replace("pm", "PM");
          },
        },
        y: {
          formatter: function (val) {
            return `${val} mins`;
          },
          title: {
            formatter: () => "Duration: ",
          },
        }
      }
    };
  }, [chartData, isDark]);

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-200"
        style={{ background: isDark ? "#0f172a" : "#f8fafc" }}
      >
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Activity className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-sm font-semibold tracking-wide">Loading Participation Details...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{ background: isDark ? "#0f172a" : "#f8fafc" }}
    >
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-650 dark:text-slate-400"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Attendee Insights</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
                Webinar Participation Analytics
              </h1>
            </div>
          </div>

          {/* Webinar Glowing Title */}
          <div className="self-start sm:self-center flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-[18px] backdrop-blur shadow-sm">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 truncate max-w-[280px]">
              {webinarName} {webinarDate ? `(${formatDateAsNumber(webinarDate)})` : ""}
            </span>
          </div>
        </div>

        {/* High-level Engagement Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Engagement Duration"
            value={`${specificWebinarInfo?.timeInSession || 0} mins`}
            icon={Clock}
            accent="#6366f1"
            isDark={isDark}
          />
          <MetricCard
            label="Webinar Status"
            value={specificWebinarInfo?.isAttended ? "Attended (Sales)" : "Registered (Rem)"}
            icon={Activity}
            accent="#FF6B35"
            isDark={isDark}
          />
          <MetricCard
            label="Sales Assignment"
            value={specificWebinarInfo?.assignedToUserName || "N/A"}
            icon={ShieldCheck}
            accent="#22c55e"
            isDark={isDark}
          />
          <MetricCard
            label="Reminder Assignment"
            value={specificWebinarInfo?.reminderAssignedTo || "N/A"}
            icon={Bell}
            accent="#3b82f6"
            isDark={isDark}
          />
        </div>

        {/* Master Details Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (2/3 width) - Session Details & In/Out Timeline */}
          <div className="lg:col-span-2 space-y-6">

            {/* Session Active Duration Chart */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    Active Duration Timeline
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Session-wise active minutes inside webinar</p>
                </div>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Activity className="w-4.5 h-4.5 animate-pulse" />
                </span>
              </div>

              {attendeeWebinarRecords.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-[200px] text-slate-450 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                  <Database className="w-10 h-10 opacity-30 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-650 dark:text-slate-350">No Session Logs</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">Registered only. No live attendance sessions logged to compile a chart.</p>
                </div>
              ) : (
                <div className="h-[240px] w-full">
                  <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="area"
                    height="100%"
                  />
                </div>
              )}
            </div>
            
            {/* Active Timeline Tracking */}
            <div 
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Participation Timing & Session Logs
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Live Attendance Tracks
                </span>
              </div>

              {attendeeWebinarRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-450 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Database className="w-10 h-10 opacity-30 text-slate-400" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-650 dark:text-slate-350">Registered Only</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto">This attendee is registered but has not joined the webinar session yet.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {attendeeWebinarRecords.map((session, index) => (
                    <div 
                      key={session._id || index}
                      className="p-5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                          Session #{index + 1}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-[#FF6B35] text-[10px] font-black uppercase tracking-wider">
                          Duration: {session.timeInSession || getSessionDuration(session.inTime, session.outTime)} mins
                        </span>
                      </div>

                      <div className="flex flex-col space-y-3 pt-1">
                        <div className="flex items-start gap-2.5">
                          <span className="text-emerald-500 font-bold text-sm shrink-0">📥 In Time:</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {session.inTime ? formatDateAsNumberWithTime(session.inTime) : "-"}
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="text-rose-500 font-bold text-sm shrink-0">📤 Out Time:</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {session.outTime ? formatDateAsNumberWithTime(session.outTime) : (
                              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Still Active / N/A
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

          {/* Right Column (1/3 width) - Contact profile and assignments */}
          <div className="space-y-6">
            
            {/* High-fidelity Profile Card */}
            <div 
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    Attendee Profile
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Contact Demographics
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                
                {/* Visual Header */}
                <div className="text-center py-2">
                  <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-xl font-black mx-auto shadow-md shadow-indigo-500/10">
                    {formatFullName(specificWebinarInfo || attendeeInfo)?.[0]}
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3">
                    {formatFullName(specificWebinarInfo || attendeeInfo)}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {email}
                  </p>
                </div>

                {/* Grid Lists */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {specificWebinarInfo?.phone || attendeeInfo?.phone || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Profession</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {specificWebinarInfo?.profession || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Location</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {specificWebinarInfo?.location || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Source</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {specificWebinarInfo?.source || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gender</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {specificWebinarInfo?.gender || "N/A"}
                    </span>
                  </div>

                </div>

                {/* Assignment Info Blocks */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3.5">
                  
                  <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-xl border border-indigo-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sales Agent</span>
                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200 mt-0.5">
                          {specificWebinarInfo?.assignedToUserName || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl border border-blue-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reminder Agent</span>
                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200 mt-0.5">
                          {specificWebinarInfo?.reminderAssignedTo || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AttendeeWebinarDetail;
