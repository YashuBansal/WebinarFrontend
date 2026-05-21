import { useEffect, useState, Suspense, lazy, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddNoteForm from "./AddNoteForm";
import { getLeadType, getNotes } from "../../features/actions/assign";
import {
  getAttendee,
  getAttendeeLeadTypeByEmail,
  updateAttendee,
  updateAttendeeLeadType,
} from "../../features/actions/attendees";
import {
  FormControl,
  MenuItem,
  Select,
  ListItemText,
} from "@mui/material";
import {
  Mail,
  User,
  Phone,
  Clock,
  ExternalLink,
  Plus,
  Edit2,
  Bell,
  MessageCircle,
  MoreVertical,
  ChevronDown,
  Trash2,
  Save,
  Logs,
  Timer,
  AlertCircle,
  Hash,
  ArrowLeft,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clearLeadType } from "../../features/slices/attendees";
import { useNavigate, useLocation } from "react-router-dom";
import { cancelAlarm, getAttendeeAlarm } from "../../features/actions/alarm";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import ProductEmailTable from "./ProductEmailTable";
import { DateFormat, formatDateAsNumber } from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import useRoles from "../../hooks/useRoles";
import ModalFallback from "../../components/Fallback/ModalFallback";
import useUserSubscription from "../../hooks/useUserSubscription";
import LogsModal from "./Modal/LogsModal";
import { createPortal } from "react-dom";
import { clearAttendeeAlarm } from "../../features/slices/alarm";
import { clearNoteData } from "../../features/slices/assign";

import NotesSection from "./NotesSection";
import AttendeeHistoryTable from "./AttendeeHistoryTable";
import TagsSection from "./TagsSection";

const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// Lazy load modals
const ViewFullDetailsModal = lazy(() => import("./Modal/ViewFullDetailModal"));
const ViewTimerModal = lazy(() => import("./Modal/ViewTimerModal"));
const EditModal = lazy(() => import("./Modal/EditModal"));
const AddEnrollmentModal = lazy(() => import("./Modal/AddEnrollmentModal"));
const WhatsappModal = lazy(() => import("./Modal/WhatsappModal"));

const ViewParticularContact = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const roles = useRoles();

  const logUserActivity = useAddUserActivity();

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email");
  const paramAttendeeId = searchParams.get("attendeeId");

  const attendeeId = useMemo(() => {
    return paramAttendeeId ? paramAttendeeId : null;
  }, [paramAttendeeId]);

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [uniquePhones, setUniquePhones] = useState([]);
  const [uniquePhonesCount, setUniquePhonesCount] = useState([]);
  const [uniqueNames, setUniqueNames] = useState([]);
  const [noteModalData, setNoteModalData] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [attendeeHistoryData, setAttendeeHistoryData] = useState([]);

  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const setAlarm = subscription?.plan?.setAlarm;
  const dateFormat = userData?.dateFormat || DateFormat.MM_DD_YYYY;
  const { selectedAttendee, attendeeLeadType, attendeeEnrollments } =
    useSelector((state) => state.attendee);

  const professionsList = useMemo(() => {
    if (!Array.isArray(selectedAttendee) || selectedAttendee.length === 0)
      return [];
    const data = selectedAttendee[0]?.data;
    if (!Array.isArray(data)) return [];
    const set = new Set();
    data.forEach((item) => {
      const p =
        typeof item?.profession === "string"
          ? item.profession.trim().toLowerCase()
          : "";
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [selectedAttendee]);

  const { noteData, isFormSuccess, leadTypeData } = useSelector(
    (state) => state.assign
  );
  const { employeeModeData } = useSelector((state) => state.employee);
  const { attendeeAlarm } = useSelector((state) => state.alarm);

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [WhatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const openCancelAlarmDialog = () => {
    setOpenCancelDialog(true);
  };

  const closeCancelAlarmDialog = () => {
    setOpenCancelDialog(false);
  };

  const { globalLocationsData } = useSelector((state) => state.location);

  const [locationsMap, setLocationsMap] = useState(new Map());

  useEffect(() => {
    if (Array.isArray(globalLocationsData)) {
      const tempMap = new Map();
      globalLocationsData.forEach((location) => {
        if (location?.name) {
          tempMap.set(location?.name.trim().toLowerCase(), location?.state);
        }
      });
      setLocationsMap(tempMap);
    }
  }, [globalLocationsData]);

  useEffect(() => {
    if (email) {
      dispatch(getNotes({ email }));
    }

    return () => {
      dispatch(clearLeadType());
      dispatch(clearAttendeeAlarm());
      dispatch(clearNoteData());
    };
  }, []);

  useEffect(() => {
    setSelectedOption(attendeeLeadType?.leadType || "");
  }, [attendeeLeadType]);

  useEffect(() => {
    if (!Array.isArray(selectedAttendee) || selectedAttendee.length === 0)
      return;
    const [attendee] = selectedAttendee;
    if (
      !attendee ||
      !attendee?.data ||
      !Array.isArray(attendee?.data) ||
      !attendee?.data.length
    )
      return;

    const somePhones = attendeeLeadType?.phones || [];
    const someNames = attendeeLeadType?.fullNames || [];


    const uniquePhonesArr = Array.from(
      new Set([...somePhones, ...attendee?.data?.map((item) => item?.phone).filter(Boolean)])
    );
    setUniquePhones(uniquePhonesArr);

    const namesArr = attendee?.data
      .map((item) => {
        if (item?.firstName) {
          const lastName = item?.lastName?.match(/:-\)/) ? "" : item?.lastName;
          return `${item.firstName} ${lastName || ""}`.trim();
        }
        return null;
      })
      .filter(Boolean);
    const uniqueNamesArr = Array.from(new Set([...someNames, ...namesArr]));
    setUniqueNames(uniqueNamesArr);

    const data = [...selectedAttendee[0]?.data];

    const webinarMap = new Map();

    data.forEach((item) => {
      const webinarName = item.webinar?.[0]?._id;

      if (!webinarName) {
        console.warn("Skipping item with no valid webinar name:", item);
        return;
      }

      if (!webinarMap.has(webinarName)) {
        webinarMap.set(webinarName, []);
      }
      webinarMap.get(webinarName).push(item);
    });

    const filteredData = [];

    // 2. Process each group
    for (const itemsForWebinar of webinarMap.values()) {
      if (itemsForWebinar.length === 1) {
        // If only one item for this webinar, keep it as is
        const newObj = {
          ...itemsForWebinar[0],
        };
        if (newObj?.isAttended === false) {
          newObj.reminderAssignedTo = newObj.assignedToUserName;
          newObj.assignedToUserName = "";
        }

        filteredData.push(newObj);
      } else {
        // If multiple items for this webinar name
        const attendedItem = itemsForWebinar.find(
          (item) => item.isAttended === true
        );
        // Find any non-attended item in this group that has an assignedTo
        const unattendedWithAssignee = itemsForWebinar.find(
          (item) => item.isAttended === false && item.assignedTo != null
        ); // Use != null to check for both null and undefined

        if (attendedItem) {
          // If an attended item exists, this is the one we'll keep
          // Create a copy to avoid mutating the original data array in place if that's a concern
          const itemToKeep = { ...attendedItem };

          if (unattendedWithAssignee) {
            // If there's a non-attended item with an assignee in the group,
            // update the reminderAssignedTo of the item we're keeping
            itemToKeep.reminderAssignedTo =
              unattendedWithAssignee.assignedToUserName;
          }
          // If no unattendedWithAssignee, itemToKeep.reminderAssignedTo remains whatever it was on the attendedItem

          filteredData.push(itemToKeep);
        } else {
          // If no attended item exists for this webinar (meaning all are isAttended: false)
          // The original filter logic seemed to keep only the first in this case.
          // We'll replicate that by keeping the first item from the group.
          // No reminderAssignedTo update is needed based on the rule.
          filteredData.push(itemsForWebinar[0]);
        }
      }
    }

    // filteredData now contains the processed list with one item per webinarName
    // based on your specified rules.

    setAttendeeHistoryData(filteredData);
  }, [selectedAttendee, attendeeLeadType]);

  useEffect(() => {
    if (!leadTypeData) return;
    const options = leadTypeData.map((item) => ({
      value: item._id,
      label: item.label,
      color: item.color,
    }));
    setLeadTypeOptions(options);
  }, [leadTypeData]);

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
    const selectedLeadType = leadTypeOptions.find(
      (option) => option.value === event.target.value
    );
    dispatch(
      updateAttendeeLeadType({
        email: email,
        leadType: event.target.value,
        createdBy: userData?.userName,
        leadTypeLabel: selectedLeadType.label,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        logUserActivity({
          action: "update",
          details: `User updated lead type of Attendee with Email: ${email}`,
          activityItem: email,
        });
      }
    });
  };

  useEffect(() => {
    if (isFormSuccess) {
      dispatch(getNotes({ email }));
    }
  }, [isFormSuccess]);

  useEffect(() => {
    if (!email) return;
    dispatch(getAttendee({ email }));
    dispatch(getLeadType());
    dispatch(getAttendeeLeadTypeByEmail(email));
    dispatch(getAttendeeAlarm({ email }));
  }, [email]);

  const handleTimerModal = () => {
    setShowTimerModal(true);
  };

  const onConfirmEdit = (data) => {
    dispatch(updateAttendee(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        logUserActivity({
          action: "update",
          details: `User updated information of Attendee with Email: ${email}`,
          activityItem: email,
        });
        setEditModalData(null);
        dispatch(getAttendee({ email }));
      }
    });
  };

  useEffect(() => {
    const badgeCount = uniquePhones.map((phone) => ({
      label: phone,
      count: noteData.filter((note) => note.phone === phone).length,
    }));
    const invalidPhones = noteData.filter((note) => note.isInvalidPhone);

    setUniquePhonesCount(
      badgeCount.map((item) => ({
        ...item,
        isInvalid: invalidPhones.some((note) => note.phone === item.label),
      }))
    );
  }, [noteData, uniquePhones]);

  const cancelMyAlarm = (alarm) => {
    dispatch(
      cancelAlarm({
        id: alarm._id,
        date: alarm.date,
        createdBy: userData?.userName,
      })
    );
  };

  useEffect(() => {
    if (!attendeeId && attendeeHistoryData?.length > 0) {
      const firstAttendee = attendeeHistoryData[0];
      if (firstAttendee?._id) {
        navigate(`?email=${email}&attendeeId=${firstAttendee._id}`, {
          replace: true,
        });
      }
    }
  }, [attendeeHistoryData, attendeeId, email, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 lg:p-6 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto space-y-4"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm group"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Attendee <span className="text-[#FF6B35]">Contact Details</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                View and manage interaction history
              </p>
            </div>
          </div>

          {/* Alarm Alert */}
          <AnimatePresence>
            {attendeeAlarm && userData?.isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="w-full lg:max-w-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-800/30 rounded-lg">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Scheduled Alarm</span>
                      <button
                        onClick={openCancelAlarmDialog}
                        className="text-[9px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline underline-offset-2"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(attendeeAlarm.date).toLocaleString("en-IN", {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column: Contact Info & Interaction History */}
          <div className="space-y-4">

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name & Email Combined Card */}
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                {/* Full Name Part */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(uniqueNames) && uniqueNames.length > 0 ? (
                      uniqueNames.map((item, index) => (
                        <span key={index} className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold">
                          {`${item || ""}`.trim() || "N/A"}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">No names found</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white break-all">
                    {(selectedAttendee && selectedAttendee[0]?._id) || "N/A"}
                  </p>
                </div>
              </div>

              {/* Phone Numbers Card (Shifted here) */}
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <Phone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Numbers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(uniquePhonesCount) && uniquePhonesCount.length > 0 ? (
                    uniquePhonesCount.map((item, index) => (
                      <div key={index} className="relative group">
                        <div className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all
                          ${item.isInvalid
                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-400 dark:hover:border-orange-500'}
                        `}>
                          <span className="text-xs font-bold">{item.label || "N/A"}</span>
                          {item.count > 0 && (
                            <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 bg-[#FF6B35] text-white text-[9px] font-black rounded-full shadow-lg shadow-[#FF6B35]/20">
                              {item.count}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No phone numbers</span>
                  )}
                </div>
              </div>
            </div>

            {/* Interaction Notes Section */}
            <div className="h-[390px] flex flex-col">
              <NotesSection
                email={email}
                noteData={noteData}
                roles={roles}
                setNoteModalData={setNoteModalData}
              />
            </div>
          </div>

          {/* Right Column: Actions & Form */}
          <div className="space-y-4">

            {/* Quick Actions & Status Card */}
            <ComponentGuard conditions={[employeeModeData ? false : true, userData?.isActive]}>
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {setAlarm && (
                      <button
                        onClick={handleTimerModal}
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 h-10 bg-[#FF6B35] hover:bg-[#e85a24] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#FF6B35]/20"
                      >
                        <Timer className="w-4 h-4" />
                        SET ALARM
                      </button>
                    )}
                    <button
                      onClick={() => setShowLogsModal(true)}
                      className="flex-1 min-w-[100px] flex items-center justify-center gap-2 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all"
                    >
                      <Logs className="w-4 h-4" />
                      LOGS
                    </button>

                    <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                      <button
                        onClick={() => setWhatsappModalOpen(true)}
                        className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded-lg transition-all"
                        title="WhatsApp"
                      >
                        <WhatsAppIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </button>

                      {/* Lead Type Select - Now inline to the right of WhatsApp */}
                      <FormControl sx={{ minWidth: 140, flex: 1 }}>
                        <Select
                          value={selectedOption || ""}
                          onChange={handleChange}
                          className="bg-slate-50 dark:bg-slate-900 rounded-lg font-bold text-xs h-10"
                          displayEmpty
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0', borderRadius: '10px' },
                            '& .MuiSelect-select': { padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }
                          }}
                          renderValue={(selected) => {
                            if (!selected) return <span className="text-[10px] text-slate-400">PRIORITY</span>;
                            const opt = leadTypeOptions.find(o => o.value === selected);
                            return (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt?.color || "#000" }} />
                                <span className="text-slate-800 dark:text-slate-200 font-bold">{opt?.label}</span>
                              </div>
                            );
                          }}
                        >
                          {leadTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value} sx={{ py: 1, gap: 1.5, minHeight: 0 }}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                              <ListItemText primary={option.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '12px' }} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                </div>
              </div>
            </ComponentGuard>

            {/* Add Note Section */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-[#FF6B35] rounded-full" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">New Interaction</h3>
                </div>
              </div>
              <div className="flex-grow">
                <AddNoteForm
                  uniquePhones={uniquePhones}
                  userData={userData}
                  employeeModeData={employeeModeData}
                  email={email}
                  attendeeId={attendeeId}
                  addUserActivityLog={logUserActivity}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sections: History & Enrollments */}
        <div className="grid grid-cols-1 gap-8 pt-6">

          {/* History Table Container */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <AttendeeHistoryTable
              selectedAttendee={selectedAttendee}
              attendeeHistoryData={attendeeHistoryData}
              navigate={navigate}
              email={email}
              employeeModeData={employeeModeData}
              userData={userData}
              setEditModalData={setEditModalData}
              formatDateAsNumber={formatDateAsNumber}
            />
          </div>

          {/* Enrollments History */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                  <Save className="w-4 h-4 text-[#FF6B35] dark:text-[#FF8C61]" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Enrollments History</h3>
              </div>

              <ComponentGuard conditions={[employeeModeData ? false : true, userData?.isActive]}>
                <button
                  onClick={() => setShowEnrollmentModal(true)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                >
                  <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:rotate-90 transition-transform" />
                </button>
              </ComponentGuard>
            </div>

            <div className="p-4">
              {!attendeeEnrollments || attendeeEnrollments.length <= 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <AlertCircle className="w-10 h-10 opacity-20" />
                  <p className="font-medium italic">No enrollment records found for this attendee</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <ProductEmailTable email={email} />
                </div>
              )}
            </div>
          </div>

          {/* Tags & Professions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TagsSection
              tags={attendeeLeadType?.tags}
              email={email}
              onTagUpdate={() => {
                if (email) {
                  dispatch(getAttendeeLeadTypeByEmail(email));
                }
              }}
            />

            {professionsList.length > 0 && (
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                    <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">Professions</h3>
                </div>
                <div className="p-6 flex flex-wrap gap-2">
                  {professionsList.map((profession) => (
                    <span
                      key={profession}
                      className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 rounded-full text-xs font-bold uppercase tracking-wider hover:border-orange-400 transition-colors cursor-default"
                    >
                      {profession}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals & Portals */}
      <Suspense fallback={<ModalFallback />}>
        {noteModalData && (
          <ViewFullDetailsModal
            modalData={noteModalData}
            setModalData={setNoteModalData}
          />
        )}
        {showTimerModal &&
          setAlarm &&
          createPortal(
            <ViewTimerModal
              setModal={setShowTimerModal}
              email={email}
              dateFormat={dateFormat}
              attendeeId={attendeeId}
              logUserActivity={logUserActivity}
              noteData={noteData}
              uniquePhones={uniquePhones}
            />,
            document.body
          )}
        {editModalData &&
          createPortal(
            <EditModal
              setModal={setEditModalData}
              initialData={editModalData}
              onConfirmEdit={onConfirmEdit}
              locationsMap={locationsMap}
              locations={globalLocationsData}
              userData={userData}
            />,
            document.body
          )}
        {showEnrollmentModal &&
          createPortal(
            <AddEnrollmentModal
              setModal={setShowEnrollmentModal}
              attendeeEmail={selectedAttendee && selectedAttendee[0]?._id}
              webinarData={attendeeHistoryData}
              logUserActivity={logUserActivity}
              userData={userData}
            />,
            document.body
          )}
        {showLogsModal &&
          createPortal(
            <LogsModal
              logUserActivity={logUserActivity}
              setModal={setShowLogsModal}
              email={email}
            />,
            document.body
          )}

        {WhatsappModalOpen &&
          createPortal(
            <WhatsappModal
              phones={uniquePhones}
              onClose={() => setWhatsappModalOpen(false)}
            />,
            document.body
          )}
      </Suspense>

      {/* Cancel Alarm Confirmation Modal */}
      <AnimatePresence>
        {openCancelDialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCancelAlarmDialog}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
            >
              <div className="h-1.5 w-full bg-rose-500" />

              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>

                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">Cancel Alarm?</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  This action cannot be undone. Are you sure you want to stop tracking this reminder?
                </p>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={closeCancelAlarmDialog}
                    className="flex-1 h-12 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      cancelMyAlarm(attendeeAlarm);
                      closeCancelAlarmDialog();
                    }}
                    className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-500/20 uppercase tracking-widest"
                  >
                    Stop Alarm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewParticularContact;
