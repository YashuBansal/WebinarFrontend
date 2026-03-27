import { useEffect, useState, Suspense, lazy, useMemo } from "react";
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
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { Add, OpenInNew } from "@mui/icons-material";
import { clearLeadType } from "../../features/slices/attendees";
import { useNavigate } from "react-router-dom";
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

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import NotesSection from "./NotesSection";
import AttendeeHistoryTable from "./AttendeeHistoryTable";
import TagsSection from "./TagsSection";

// Lazy load modals
const ViewFullDetailsModal = lazy(() => import("./Modal/ViewFullDetailModal"));
const ViewTimerModal = lazy(() => import("./Modal/ViewTimerModal"));
const EditModal = lazy(() => import("./Modal/EditModal"));
const AddEnrollmentModal = lazy(() => import("./Modal/AddEnrollmentModal"));
const WhatsappModal = lazy(() => import("./Modal/WhatsappModal"));

const ViewParticularContact = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
    console.log("webinarmap --- > ", webinarMap);

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

    setAttendeeHistoryData(filteredData.reverse());
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
    <div className="px-4 pt-14 space-y-6">
      <div className="md:p-6 p-3 bg-gray-50 rounded-lg shadow-sm">
        {/* Header Row (flex-col below lg, flex-row at lg) */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">
            Attendee Contact Details
          </h2>
          {/* Alarm Alert - flows with header */}
          {attendeeAlarm && userData?.isActive && (
            <Alert
              // Removed positional classes right-6 top-3 as they rely on positioned parent not present here
              className="w-full md:max-w-[500px] transition duration-300"
              severity="info"
              icon={false}
              action={
                <Button
                  color="error"
                  size="small"
                  onClick={() => {
                    openCancelAlarmDialog();
                  }}
                >
                  Cancel Alarm
                </Button>
              }
            >
              <Stack>
                <Box>
                  <strong>Date:</strong>
                  {new Date(attendeeAlarm.date).toLocaleString("en-IN")}
                </Box>
                <Box className="line-clamp-1 hover:line-clamp-none overflow-hidden transition duration-300">
                  <strong>Note:</strong> {attendeeAlarm.note}
                </Box>
              </Stack>
            </Alert>
          )}
        </div>

        {/* Main Content Grid (2 columns at lg) */}
        <div className="grid lg:grid-cols-2 mb-6 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 flex flex-col h-full">
            {" "}
            {/* Added flex-col h-full and increased space-y */}
            {/* Email */}
            <div className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm">
              {" "}
              {/* Added border-gray, shadow-sm, adjusted px */}
              <p>
                Email :{" "}
                <span className="ms-2 bg-slate-100 rounded-md px-3 py-1 text-gray-700 font-medium break-all">
                  {" "}
                  {/* Adjusted styling */}
                  {(selectedAttendee && selectedAttendee[0]?._id) || "N/A"}{" "}
                  {/* Handle empty email */}
                </span>
              </p>
            </div>
            {/* Name */}
            <div className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm">
              {" "}
              {/* Added border-gray, shadow-sm, adjusted px */}
              <p>
                Name :{" "}
                {Array.isArray(uniqueNames) && uniqueNames.length > 0 ? (
                  uniqueNames.map((item, index) => (
                    <span
                      key={index}
                      className="ms-2 bg-slate-100 rounded-md px-3 py-1 text-gray-700 font-medium inline-block mb-1" // Adjusted styling, added inline-block/mb-1 for wrap
                    >
                      {`${item || ""}`.trim() || "N/A"}{" "}
                      {/* Added N/A for empty names */}
                    </span>
                  ))
                ) : (
                  <span className="ms-2 text-gray-500">N/A</span> // Handle no names
                )}
              </p>
            </div>
            {/* Phone */}
            <div className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm flex flex-wrap items-center gap-2">
              {" "}
              {/* Added border-gray, shadow-sm, px, flex-wrap, gap */}
              <span className="font-medium text-gray-700">Phone :</span>{" "}
              {/* Added font-medium */}
              <div className="flex gap-3 flex-wrap flex-grow">
                {" "}
                {/* Added flex-grow */}
                {Array.isArray(uniquePhonesCount) &&
                uniquePhonesCount.length > 0 ? (
                  uniquePhonesCount.map((item, index) => (
                    <Badge
                      key={index}
                      badgeContent={item.count}
                      color="primary"
                      sx={{ "& .MuiBadge-badge": { right: 0, top: -3 } }}
                    >
                      {" "}
                      {/* Adjust badge position slightly */}
                      <Chip
                        label={item.label || "N/A"} // Added N/A for empty labels
                        color={item.isInvalid ? "error" : "default"} // Use "default" color if not error
                        variant="outlined"
                        size="small" // Smaller chip size
                        className="bg-slate-100" // Add a light background
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500">N/A</span> // Handle no phones
                )}
              </div>
            </div>
            {/* Notes List */}
            <NotesSection
              email={email}
              noteData={noteData}
              roles={roles}
              setNoteModalData={setNoteModalData}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4 flex flex-col h-full">
            {" "}
            {/* Added flex-col h-full and increased space-y */}
            {/* Buttons and Select */}
            <ComponentGuard
              conditions={[employeeModeData ? false : true, userData?.isActive]}
            >
              {/* Container for buttons/select with border and shadow */}
              <div className="border border-gray-300 rounded-lg shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                {" "}
                {/* Added border/shadow/padding, made responsive */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                  {" "}
                  {/* Centered buttons on small screens */}
                  {setAlarm && (
                    <Button
                      variant="contained"
                      className="h-10 whitespace-nowrap w-full sm:w-auto"
                      onClick={handleTimerModal}
                    >
                      Set Alarm
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    className="h-10 whitespace-nowrap w-full sm:w-auto"
                    onClick={() => setShowLogsModal(true)}
                  >
                    Logs
                  </Button>
                  <WhatsAppIcon
                    className="text-green-600 cursor-pointer "
                    onClick={() => {
                      setWhatsappModalOpen(true);
                    }}
                  />
                </div>
                <div className="w-full sm:w-48">
                  {" "}
                  {/* Fixed width for select container on larger screens */}
                  <FormControl fullWidth>
                    <Select
                      labelId="lead-type-select-label"
                      value={selectedOption || ""}
                      onChange={handleChange}
                      className="shadow-sm h-10 font-semibold bg-white"
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <span style={{ color: "#888" }}>
                              Select Lead Type
                            </span> // Placeholder style
                          );
                        }
                        const selectedOption = leadTypeOptions.find(
                          (option) => option.value === selected
                        );
                        return (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                            className="text-gray-800" // Ensure selected text color is visible
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor:
                                  selectedOption?.color || "#000",
                              }}
                            />
                            <span>{selectedOption?.label}</span>
                          </div>
                        );
                      }}
                    >
                      {leadTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <ListItemIcon>
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: option.color,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText primary={option.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
            </ComponentGuard>
            {/* Add Note Section */}
            <div className="border border-gray-300 rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
              {" "}
              {/* Added border-gray, shadow-sm, flex-col, overflow-hidden */}
              <div className="border-b border-gray-300 px-4 py-2 bg-gray-100">
                {" "}
                {/* Adjusted padding/border, added bg-gray */}
                <span className="font-semibold text-gray-700">Add Note</span>
              </div>
              {/* Add Note Form Container with Padding */}
              <div className="px-4 flex-grow overflow-y-auto scrollbar-thin">
                {" "}
                {/* Added padding, flex-grow, overflow/scrollbar */}
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

        <div className="grid grid-cols-1 gap-4 ">
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

          <div className="mt-12 shadow-lg rounded-lg overflow-x-auto">
            {!attendeeEnrollments && attendeeEnrollments.length <= 0 ? (
              <div className="text-lg p-2 flex justify-center w-full">
                No record found
              </div>
            ) : (
              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className=" mb-2 items-center px-3 text-neutral-800  flex justify-between">
                  <span className="font-semibold text-xl  ">
                    Enrollments History
                  </span>

                  <ComponentGuard
                    conditions={[
                      employeeModeData ? false : true,
                      userData?.isActive,
                    ]}
                  >
                    <Add
                      className="cursor-pointer hover:bg-gray-200 transition duration-300"
                      onClick={() => setShowEnrollmentModal(true)}
                      fontSize="medium"
                    >
                      <OpenInNew />
                    </Add>
                  </ComponentGuard>
                </div>

                <ProductEmailTable email={email} />
              </div>
            )}
          </div>


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
            <div className="border border-gray-300 rounded-lg shadow-sm bg-white">
              <div className="border-b border-gray-300 px-4 py-3 bg-gray-100">
                <h3 className="font-semibold text-gray-700 text-lg">Professions</h3>
              </div>
              <div className="p-4">
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {professionsList.map((profession) => (
                    <Chip
                      key={profession}
                      label={profession}
                      variant="outlined"
                      size="small"
                      className="bg-slate-100 capitalize text-gray-700 border-gray-300"
                      sx={{
                        "& .MuiChip-label": {
                          fontWeight: 500,
                        },
                      }}
                    />
                  ))}
                </Stack>
              </div>
            </div>
          )}
        </div>
      </div>
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
      <Dialog
        open={openCancelDialog}
        onClose={closeCancelAlarmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Cancel Alarm?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to cancel this alarm?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelAlarmDialog}>Disagree</Button>
          <Button
            onClick={() => {
              cancelMyAlarm(attendeeAlarm);
              closeCancelAlarmDialog();
            }}
            autoFocus
          >
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ViewParticularContact;
