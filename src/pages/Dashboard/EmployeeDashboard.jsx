import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { getEmployeeDashboardData } from "../../features/actions/globalData";
import { DateFormat, errorToast, formatDateAsNumber } from "../../utils/extra";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  alpha,
  Select,
  Stack,
  Typography,
  useTheme,
  Paper,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
} from "@mui/material";
import "./DatePickerStyles.css";
import { getEmployeeWebinars } from "../../features/actions/webinarContact";
import { clearEmplyeeDashboardData } from "../../features/slices/globalData";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { setTableMasked } from "../../features/slices/tableSlice";
import { globalButton } from "../../utils/style";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";

const EmployeeDashboard = () => {
  const employeeId = useParams()?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logUserActivity = useAddUserActivity();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { isLoading, employeeDashboardData } = useSelector(
    (state) => state.globalData
  );

  const { userData } = useSelector((state) => state.auth);
  const dateFormat = userData?.dateFormat || DateFormat.DD_MM_YYYY;

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const { webinarData } = useSelector((state) => state.webinarContact);
  const [currentWebinar, setCurrentWebinar] = useState("select");
  const { isTablesMasked } = useSelector((state) => state.table);

  const fetchData = useCallback(() => {
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];
    // If getAdminDashboardData is truly independent and needed, keep it. Otherwise, remove.
    dispatch(
      getEmployeeDashboardData({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        webinarId: currentWebinar,
        employeeId,
      })
    );
  }, [dispatch, startDate, endDate, currentWebinar, employeeId]);

  useEffect(() => {
    fetchData();
    dispatch(getEmployeeWebinars({ employeeId }));
    return () => {
      dispatch(clearEmplyeeDashboardData());
    };
  }, []);

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

  const handleMaskedTablesChange = (event) => {
    dispatch(setTableMasked(event.target.checked));
  };

  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalWorked, setTotalWorked] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [statusCounts, setStatusCounts] = useState([]);

  useEffect(() => {
    if (employeeDashboardData) {
      const { assignmentsCount = {} } = employeeDashboardData;

      setTotalAssignments(assignmentsCount?.totalAssignments || 0);
      setTotalWorked(assignmentsCount?.statusExists || 0);
      setTotalPending(assignmentsCount?.statusNotExists || 0);
      setStatusCounts(
        Array.isArray(assignmentsCount?.groupedStatuse)
          ? assignmentsCount?.groupedStatuse
          : []
      );
      // if (notes.length > 0) {
      //   const myNotes = notes.find((note) => note.user === userData?._id);

      //   if (myNotes) {
      //     if (Array.isArray(myNotes.statusCounts)) {
      //       setStatusCounts(myNotes.statusCounts);
      //     } else {
      //       setStatusCounts([]);
      //     }
      //     if (Array.isArray(myNotes.attendeeDurations)) {
      //       const { attendeeDurations } = myNotes;
      //       const totalWorked = attendeeDurations.length;
      //       setTotalWorked(totalWorked);
      //       setTotalPending(count - totalWorked);
      //     } else {
      //       setTotalWorked(0);
      //       setTotalPending(0);
      //     }
      //   } else {
      //     setStatusCounts([]);
      //     setTotalWorked(0);
      //     setTotalPending(0);
      //   }
      // } else {
      //   setStatusCounts([]);
      //
      // }
    }
  }, [employeeDashboardData]);

  const handleCardClick = (obj) => {
    const { tabValue = "", activity = "", status } = obj;
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
      `/assignments?page=1&webinarId=${currentWebinar}&tabValue=${tabValue}&activity=${activity}`
    );
  };

  const renderMetricDivItem = (label, value, key, handleClick) => (
    <div
      key={key}
      onClick={() => handleClick?.()}
      className={`flex flex-row justify-between items-center border border-blue-300 bg-[#f2f9fc] rounded p-2 min-w-[120px] flex-grow text-gray-700
      ${
        handleClick
          ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:bg-gray-50"
          : ""
      }
    `}
    >
      <span className="text-sm capitalize break-words">{label}</span>
      <span className="text-lg font-medium">{value ?? 0}</span>
    </div>
  );

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
    <div className="md:px-10 px-4 py-14">
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
                {webinar.webinarName}
                {" - "}
                {formatDateAsNumber(webinar.webinarDate)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-6 sm:gap-10">
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
            disabled={isLoading}
            onClick={fetchData}
            className={globalButton}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Find"
            )}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-12 gap-4 pt-3">
        <div className="col-span-12">
          <div className="p-4 w-full rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-semibold mb-4">
              Your activity on assignments
            </h2>

            <Grid xs={12}>
              {" "}
              {/* Use email or _id as key */}
              <Card
                sx={{ p: { xs: 2, sm: 3 }, borderRadius: "12px" }}
                elevation={2}
              >
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
                    `total-`,
                    () => {
                      handleCardClick({ tabValue: "active", activity: "All" });
                    }
                  )}
                  {renderMetricItem(
                    "Total Worked",
                    totalWorked,
                    {
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      borderColor: theme.palette.success.light,
                    },
                    `worked-`,
                    () => {
                      handleCardClick({
                        tabValue: "active",
                        activity: "Worked",
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
                    `pending-`,
                    () => {
                      handleCardClick({
                        tabValue: "active",
                        activity: "Pending",
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
                      <div className="flex flex-col gap-2">
                        {statusCounts.map((statusItem) =>
                          renderMetricDivItem(
                            statusItem.status,
                            statusItem.count,
                            {
                              backgroundColor: theme.palette.background.paper,
                            },
                            `-status-${statusItem.status}`,
                            () => {
                              handleCardClick({
                                tabValue: "active",
                                activity: "All",
                                status: statusItem.status,
                              });
                            }
                          )
                        )}
                      </div>
                    ) : (
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
                            `-status-${statusItem.status}`,
                            () => {
                              handleCardClick({
                                tabValue: "active",
                                activity: "All",
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
          </div>
        </div>
      </div>

      {/* Masked Tables Option */}
      <div className="flex items-center justify-center gap-3 font-bold text-xl rounded-lg bg-white h-20 w-full cursor-pointer text-green-700 shadow-lg">
        <FormControlLabel
          control={
            <Checkbox
              checked={isTablesMasked}
              onChange={handleMaskedTablesChange}
              color="primary"
            />
          }
          label={<Typography>Masked Tables</Typography>}
        />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
