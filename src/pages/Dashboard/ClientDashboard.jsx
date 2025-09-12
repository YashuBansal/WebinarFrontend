import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Grid,
  Box,
  Divider,
  Stack,
  Chip,
  Paper,
  CircularProgress,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import {
  getAdminDashboardData,
  getAdminNotesForDashboard,
} from "../../features/actions/globalData";
import {
  DateFormat,
  errorToast,
  formatDateAsNumber,
  formatDateAsNumberWithTime,
  SocketEvents,
} from "../../utils/extra";
import { socket } from "../../socket";

import "./DatePickerStyles.css"; // Make sure this file exists or remove the import
import { getAllWebinars } from "../../features/actions/webinarContact";
import { clearClientDashboardData } from "../../features/slices/globalData";
import { getUserActivityOfEmployees } from "../../features/actions/userActivity";
import { selectEmployeeActivities } from "../../features/slices/userActivity";
import { useNavigate } from "react-router-dom";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { globalButton } from "../../utils/style";

const ClientDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Keep loading state from globalData, but primary data comes from local state
  const employeeActivities = useSelector(selectEmployeeActivities);
  const { loading, clientDashboardData } = useSelector(
    (state) => state.globalData
  );
  const { userData } = useSelector((state) => state.auth);
  const { webinarData } = useSelector((state) => state.webinarContact);
  const dateFormat = userData?.dateFormat || DateFormat.DD_MM_YYYY;

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  // State to hold the processed dashboard data
  const [dashboardData, setDashboardData] = useState([]);
  const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [currentWebinar, setCurrentWebinar] = useState("select");
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Handler function to toggle the state for a specific item

  // Fetch raw data from the API
  const fetchData = useCallback(() => {
    setIsDataLoading(true); // Start loading indicator
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];
    // If getAdminDashboardData is truly independent and needed, keep it. Otherwise, remove.
    dispatch(
      getAdminDashboardData({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        webinarId: currentWebinar,
      })
    );
    const newStartDate = new Date(startDate);
    newStartDate.setHours(0, 0, 0, 0); // Reset time to start of the day
    const newEndDate = new Date(endDate);
    newEndDate.setHours(23, 59, 59, 999); // Reset time to end of the day

    dispatch(
      getAdminNotesForDashboard({
        startDate: newStartDate,
        endDate: newEndDate, // Ensure end date is formatted correctly
        webinarId: currentWebinar,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        if (Array.isArray(res.payload?.data)) {
          const notesData = res.payload?.data;
          const statusMap = new Map();
          notesData.forEach((notes) => {
            if (Array.isArray(notes.status)) {
              const noteStatus = notes.status;
              noteStatus.forEach((status) => {
                if (statusMap.has(status)) {
                  statusMap.set(status, statusMap.get(status) + 1);
                } else {
                  statusMap.set(status, 1);
                }
              });
            }
          });
          const statusCounts = Array.from(statusMap, ([status, count]) => ({
            status,
            count,
          }));

          setAdminDashboardData({
            totalWorked: notesData?.length,
            statusCounts,
          });
        }
      }
    });
  }, [dispatch, startDate, endDate, currentWebinar]);

  useEffect(() => {
    let interval; // Declare interval variable outside of the function
    const fetchDataByInterval = () => {
      interval = setInterval(() => {
        dispatch(getUserActivityOfEmployees());
      }, 10 * 1000);
    };

    dispatch(getUserActivityOfEmployees());
    fetchDataByInterval();
    return () => {
      if (interval) {
        clearInterval(interval); // Clear the interval when the component unmounts
      }
    }; // Cleanup interval on unmount
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
    dispatch(getAllWebinars({ page: 1, limit: 100 }));

    return () => {
      dispatch(clearClientDashboardData());
    };
  }, []); // Keep empty dependency array for initial fetch

  // Process the raw data when clientDashboardData changes from Redux
  useEffect(() => {
    setIsDataLoading(true); // Assume loading until processing is done
    const { assignmentsCount } = clientDashboardData || {};
    console.log("------------------- .s", assignmentsCount);
    // Only proceed if both necessary pieces of data are available
    if (!assignmentsCount || !employeeActivities) {
      console.log("Waiting for notes or assignmentsCount data...");
      setDashboardData([]); // Clear existing data if dependencies are missing
      // Keep loading true if initial data hasn't arrived, set false if it arrived but was empty/invalid
      setIsDataLoading(loading); // Reflect global loading state if dependencies missing
      return;
    }

    try {
      const tempData = employeeActivities.map((emp) => {
        const assignment = assignmentsCount.find(
          (assign) => assign.user === emp._id
        );

        const {
          groupedStatuses: statusCounts = [],
          statusExists: pseudoWorked = 0,
          statusNotExists: totalPending = 0,
          totalAssignments = 0,
          validCallCount: totalWorked = 0,
        } = assignment || {};

        return {
          _id: emp._id,
          userRole: emp?.userRole,
          email: emp?.userEmail,
          userName: emp?.userName,
          lastActivity: emp?.createdAt,
          isOnline: emp?.isOnline,
          action: emp?.action,
          totalAssignments,
          totalWorked,
          pseudoWorked,
          totalPending, // Use the calculated pending value
          // Ensure statusCounts is an array, default to empty array if not found or not an array
          statusCounts,
        };
      });
      // console.log("Processed Client Dashboard Data:", tempData);
      setDashboardData(tempData);
    } catch (error) {
      console.error("Error processing dashboard data:", error);
      setDashboardData([]); // Clear data on error
      errorToast("Failed to process dashboard data.");
    } finally {
      // Stop loading indicator once processing is done or failed
      // Use the global loading state ONLY if dashboardData is still empty maybe?
      // Or just rely on processing time? Let's set it to false after processing.
      setIsDataLoading(false);
    }
  }, [clientDashboardData, loading, employeeActivities]); // Depend on clientDashboardData and the global loading state

  // Socket event listener
  useEffect(() => {
    const handleUpdate = () => {
      console.log(
        "Socket event received: ATTENDEE_STATUS_UPDATE. Refetching data..."
      );
      fetchData(); // Refetch raw data
    };
    if (socket) socket.on(SocketEvents.ATTENDEE_STATUS_UPDATE, handleUpdate);
    return () => {
      if (socket) socket.off(SocketEvents.ATTENDEE_STATUS_UPDATE, handleUpdate);
    };
  }, [fetchData]); // Depend on fetchData callback

  const handleStartDateChange = (date) => {
    if (endDate && date > endDate) {
      errorToast("Start date cannot be later than end date.");
      return;
    }
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    if (startDate && date < startDate) {
      errorToast("End date cannot be earlier than start date.");
      return;
    }
    setEndDate(date);
  };

  const handleCardClick = (obj) => {
    const { data, tabValue = "assignments", validCall = "", status } = obj;
    const startDateForFilter = new Date(startDate);
    startDateForFilter.setHours(0, 0, 0, 0); // Reset time to start of the day
    const endDateForFilter = new Date(endDate);
    endDateForFilter.setHours(23, 59, 59, 999); // Reset time to end of the day
    const startDateForSomething = startDateForFilter || new Date();
    const endDateForSomething = endDateForFilter || new Date();

    dispatch(
      setWebinarAttendeesFilters({
        filters: {
          createdAt: {
            $gte: startDateForSomething.toISOString(),
            $lte: endDateForSomething.toISOString(),
          },
          status: status ? [status] : undefined,
        },
      })
    );
    navigate(
      `/employee/view/${data._id}?page=1&tabValue=${tabValue}&role=${
        data.userRole
      }&webinarId=${
        currentWebinar === "select" || currentWebinar === "all"
          ? "all"
          : currentWebinar
      }&userName=${data.userName}${
        validCall === "" ? "" : `&valid-call=${validCall}`
      }`
    );
  };

  const renderMetricDivItem = (label, value, key, handleClick) => (
    <div
      className="flex flex-row text-grey-200 justify-between bg-[#f2f9fc] border border-blue-300 rounded p-2 "
      key={key}
      onClick={() => handleClick?.()}
    >
      <span>{label}</span>
      <span>{value ?? 0}</span>
    </div>
  );

  // --- Rendering Helper for Individual Metric Items ---
  const renderMetricItem = (label, value, sxProps = {}, key, handleClick) => (
    <Paper
      key={key}
      className={`${
        handleClick
          ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:bg-gray-50"
          : ""
      }`}
      elevation={0}
      onClick={() => {
        if (handleClick) {
          handleClick();
        }
      }}
      sx={{
        p: 1.5,
        textAlign: "center",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        minWidth: "120px",
        flexGrow: 1,
        ...sxProps,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 0.5, textTransform: "capitalize", wordBreak: "break-word" }}
      >
        {label}
      </Typography>
      <Typography variant="h6" component="p" fontWeight="medium">
        {value ?? 0}
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ px: { xs: 2, md: 5 }, py: 10 }}>
      <div className="flex md:justify-between justify-center items-center mb-4 gap-5 flex-wrap">
        <FormControl className="md:w-60 w-96">
          <InputLabel id="webinar-label">Webinar</InputLabel>
          <Select
            labelId="webinar-label"
            label="Webinar"
            value={currentWebinar}
            onChange={(e) => {
              const selectedWebinarId = e.target.value;
              setCurrentWebinar(selectedWebinarId);

              if (selectedWebinarId === "all") {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                setStartDate(oneYearAgo);
                setEndDate(new Date());
              } else if (selectedWebinarId === "select") {
                const today = new Date();
                setStartDate(today);
                setEndDate(today);
              } else {
                const selectedWebinarData = webinarData.find(
                  (webinar) => webinar._id === selectedWebinarId
                );
                if (selectedWebinarData) {
                  const webinarCreationDate = new Date(
                    selectedWebinarData.createdAt
                  );
                  setStartDate(webinarCreationDate);
                } else {
                  setStartDate(new Date());
                }
                setEndDate(new Date());
              }
            }}
          >
            <MenuItem disabled value="select">
              Select
            </MenuItem>
            <MenuItem value="all">All</MenuItem>

            {webinarData.map((webinar, index) => (
              <MenuItem key={index} value={webinar._id}>
                {webinar?.webinarName} -{" "}
                {formatDateAsNumber(webinar?.webinarDate)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* <div className="flex justify-between gap-10 items-center "> */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 sm:gap-10">
          <div className="flex gap-5">
            <div className="flex gap-2 items-center">
              <Typography variant="body2">From:</Typography>
              <DatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                dateFormat={dateFormat}
                maxDate={endDate || new Date()} // Max date is end date or today
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                className="custom-datepicker-input" // Ensure this class targets the input correctly
              />
            </div>
            <div className="flex gap-2 items-center">
              <Typography variant="body2">To:</Typography>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                dateFormat={dateFormat}
                maxDate={new Date()} // Max date is today
                minDate={startDate} // Min date is start date
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                className="custom-datepicker-input" // Ensure this class targets the input correctly
              />
            </div>
          </div>
          <button
            className={globalButton}
            onClick={fetchData}
            disabled={isDataLoading} // Disable based on local loading state
          >
            {isDataLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Find"
            )}
          </button>
        </div>
      </div>

      {/* --- Dashboard Content --- */}
      {/* Loading Indicator */}
      {isDataLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ minHeight: "300px" }}
        >
          <CircularProgress />
        </Box>
      )}

      {adminDashboardData && (
        <Grid xs={12} mb={5}>
          {" "}
          {/* Use email or _id as key */}
          <Card
            sx={{ p: { xs: 2, sm: 3 }, borderRadius: "12px" }}
            elevation={2}
          >
            {/* Client Header */}
            <div className="flex justify-between flex-wrap items-center">
              <div className="flex justify-center items-center gap-2">
                <Typography
                  variant="h6"
                  component="div"
                  gutterBottom
                  fontWeight="medium"
                >
                  {/* Use email, fallback to User + ID */}
                  My Activity
                </Typography>
              </div>
              <button
                onClick={() => {
                  navigate(`admin-logs`);
                }}
                className=" h-8 border text-md bg-indigo-500 text-white px-4 rounded-md "
              >
                Logs
              </button>
            </div>

            {/* WEBINAR SECTION REMOVED */}

            <Divider sx={{ my: 2.5 }} />

            {/* --- Totals Section --- */}
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
              Overall Summary
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              useFlexGap
              flexWrap="wrap"
              sx={{ mb: 3 }}
            >
              {/* Render specific totals using data from 'item' */}

              {renderMetricItem(
                "Total Worked",
                adminDashboardData.totalWorked,
                {
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  borderColor: theme.palette.success.light,
                },
                `worked` // Add unique key
              )}
            </Stack>

            {/* --- Status Group Metrics Section --- */}
            {adminDashboardData.statusCounts.length > 0 && ( // Check statusCounts array
              <>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  sx={{ mb: 2 }}
                >
                  Status Breakdown
                </Typography>
                {isSmallScreen ? (
                  <div className="flex flex-col gap-2">
                    {adminDashboardData.statusCounts.map((statusItem) =>
                      renderMetricDivItem(
                        statusItem.status,
                        statusItem.count,
                        {
                          backgroundColor: theme.palette.background.paper,
                        },
                        `status-${statusItem.status}`
                      )
                    )}
                  </div>
                ) : (
                  // Medium and up layout
                  <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                    {adminDashboardData.statusCounts.map((statusItem) =>
                      renderMetricItem(
                        statusItem.status,
                        statusItem.count,
                        {
                          backgroundColor: theme.palette.background.paper,
                        },
                        `status-${statusItem.status}`
                      )
                    )}
                  </Stack>
                )}
              </>
            )}

            {/* Fallback message if no totals AND no statuses for this specific item */}
            {adminDashboardData.totalWorked === 0 &&
              adminDashboardData.statusCounts.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2, textAlign: "center" }}
                >
                  No activity data available in this period.
                </Typography>
              )}
          </Card>
        </Grid>
      )}

      {/* No Data Message (Show only when not loading and data is empty) */}
      {!isDataLoading && (!dashboardData || dashboardData.length === 0) && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            textAlign: "center",
            backgroundColor: theme.palette.grey[100],
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No Dashboard Data Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No activity recorded for the selected period or user filter.
          </Typography>
        </Paper>
      )}

      {/* Data Grid (Show only when not loading and data exists) */}
      {!isDataLoading && dashboardData.length > 0 && (
        <Grid container spacing={3}>
          {/* MAP dashboardData STATE HERE */}
          {dashboardData.map((item) => {
            // 'item' has the new structure
            // Directly use values from the item, providing defaults
            const totalAssignments = item?.totalAssignments ?? 0;
            const totalWorked = item?.pseudoWorked ?? 0; // Use totalWorked from item
            const totalPseudoWorked = item?.totalWorked ?? 0; // Use totalWorked from item
            const totalPending = item?.totalPending ?? 0; // Already calculated
            const statusCounts = item?.statusCounts ?? []; // Use the statusCounts array
            const chipLabel = !item?.isOnline
              ? "Offline"
              : item?.action === "inactive"
              ? "Idle"
              : "Online";

            const chipColor = !item?.isOnline
              ? "error"
              : item?.action === "inactive"
              ? "warning"
              : "success";

            const chipBackgroundColor = !item?.isOnline
              ? theme.palette.error.main
              : item?.action === "inactive"
              ? theme.palette.warning.main
              : theme.palette.success.main;

            return (
              <Grid item xs={12} key={item?.email || item._id}>
                {" "}
                {/* Use email or _id as key */}
                <Card
                  sx={{ p: { xs: 2, sm: 3 }, borderRadius: "12px" }}
                  elevation={2}
                >
                  {/* Client Header */}
                  <div className="flex justify-between flex-wrap items-center">
                    <div className="flex justify-center items-center gap-2">
                      <Typography
                        variant="h6"
                        component="div"
                        gutterBottom
                        fontWeight="medium"
                      >
                        {/* Use email, fallback to User + ID */}
                        {item?.email || `User ID: ${item._id}`}
                      </Typography>
                      <Chip
                        label={chipLabel}
                        color={chipColor}
                        size="small"
                        variant="outlined"
                        sx={{
                          backgroundColor: chipBackgroundColor,
                          color: "white",
                        }}
                      />
                    </div>

                    <div className="flex gap-2 items-center justify-center">
                      <button
                        onClick={() => {
                          navigate(
                            `employee/view/${item?._id}?page=1&tabValue=activityLogs&role=${item?.userRole}&webinarId=all&userName=${item?.userName}`
                          );
                        }}
                        className=" h-8 border text-md bg-indigo-500 text-white px-4 rounded-md "
                      >
                        Logs
                      </button>

                      <Typography
                        gutterBottom
                        fontWeight="medium"
                        className="text-neutral-600 pt-2"
                      >
                        Last Activity:{" "}
                        {formatDateAsNumberWithTime(item?.lastActivity)}
                      </Typography>
                    </div>
                  </div>

                  {/* WEBINAR SECTION REMOVED */}

                  <Divider sx={{ my: 2.5 }} />

                  {/* --- Totals Section --- */}
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    sx={{ mb: 2 }}
                  >
                    Overall Summary
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mb: 3 }}
                  >
                    {/* Render specific totals using data from 'item' */}
                    {renderMetricItem(
                      "Total Assignments",
                      totalAssignments,
                      {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.light,
                      },
                      `total-${item._id}`,
                      () => {
                        handleCardClick({
                          data: item,
                          tabValue: "assignments",
                        });
                      }
                    )}
                    {renderMetricItem(
                      "Total Worked",
                      totalWorked,
                      {
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        borderColor: theme.palette.success.light,
                      },
                      `worked-${item._id}`,
                      () => {
                        handleCardClick({
                          data: item,
                          tabValue: "history",
                        });
                      }
                    )}
                    {renderMetricItem(
                      "Total Valid Calls",
                      totalPseudoWorked,
                      {
                        backgroundColor: alpha(
                          theme.palette.secondary.main,
                          0.1
                        ),
                        borderColor: theme.palette.secondary.light,
                      },
                      `psuedo-worked-${item._id}`,
                      () => {
                        handleCardClick({
                          data: item,
                          tabValue: "history",
                          validCall: "invalid",
                        });
                      }
                    )}
                    {renderMetricItem(
                      "Total Pending",
                      totalPending,
                      {
                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        borderColor: theme.palette.warning.light,
                      },
                      `pending-${item._id}`,
                      () => {
                        handleCardClick({
                          data: item,
                          tabValue: "assignments",
                        });
                      }
                    )}
                  </Stack>

                  {/* --- Status Group Metrics Section --- */}
                  {statusCounts.length > 0 && ( // Check statusCounts array
                    <>
                      <Typography
                        variant="subtitle1"
                        fontWeight="medium"
                        sx={{ mb: 2 }}
                      >
                        Status Breakdown
                      </Typography>
                      {isSmallScreen ? (
                        <div className="flex flex-col  gap-2">
                          {statusCounts.map((statusItem) =>
                            renderMetricDivItem(
                              statusItem.status,
                              statusItem.count,
                              `${item._id}-status-${statusItem.status}`,
                              () => {
                                handleCardClick({
                                  data: item,
                                  tabValue: "history",
                                  status: statusItem.status,
                                });
                              }
                            )
                          )}
                        </div>
                      ) : (
                        // Medium and up layout
                        <Stack
                          direction="row"
                          spacing={2}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          {statusCounts.map((statusItem) =>
                            renderMetricItem(
                              statusItem.status,
                              statusItem.count,
                              {
                                backgroundColor: theme.palette.background.paper,
                              },
                              `${item._id}-status-${statusItem.status}`,
                              () => {
                                handleCardClick({
                                  data: item,
                                  tabValue: "history",
                                  status: statusItem.status,
                                });
                              }
                            )
                          )}
                        </Stack>
                      )}
                    </>
                  )}

                  {/* Fallback message if no totals AND no statuses for this specific item */}
                  {totalAssignments === 0 && statusCounts.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, textAlign: "center" }}
                    >
                      No activity data available for this user in this period.
                    </Typography>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ClientDashboard;
