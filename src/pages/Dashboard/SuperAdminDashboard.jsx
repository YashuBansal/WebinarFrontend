import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Grid,
  Box,
  Button,
  Divider,
  Modal,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import {
  getDashboardCardsData,
  getDashboardPlansData,
  getDashboardRevenueData,
  getDashboardUsersData,
} from "../../features/actions/globalData";
import {
  ContactUsageChart,
  MetricCard,
  PlanPopularityChart,
  RevenueByDateChart,
  UserGrowthByDate,
} from "../../components/Dashboard";
import { errorToast } from "../../utils/extra";
import { resetDashboardData } from "../../features/slices/globalData";

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashBoardCardsData } = useSelector((state) => state.globalData);

  // The cardData array definition remains the same.
  const cardData = [
    {
      label: "Accounts Created",
      value:
        (dashBoardCardsData?.adminCount?.totalCount || 0) +
        (dashBoardCardsData?.employeeCount?.totalCount || 0),
      color: "primary",
    },
    {
      label: "Active Accounts",
      value:
        (dashBoardCardsData?.adminCount?.activeCount || 0) +
        (dashBoardCardsData?.employeeCount?.activeCount || 0),
      color: "success",
    },
    {
      label: "In-Active Accounts",
      value:
        (dashBoardCardsData?.adminCount?.inactiveCount || 0) +
        (dashBoardCardsData?.employeeCount?.inactiveCount || 0),
      color: "error",
    },
    {
      label: "Total Admins",
      value: dashBoardCardsData?.adminCount?.totalCount || 0,
      color: "primary",
    },
    {
      label: "Total Active Admins",
      value: dashBoardCardsData?.adminCount?.activeCount || 0,
      color: "primary",
    },
    {
      label: "Total In-Active Admins",
      value: dashBoardCardsData?.adminCount?.inactiveCount || 0,
      color: "primary",
    },
    {
      label: "Total Employees",
      value: dashBoardCardsData?.employeeCount?.totalCount || 0,
      color: "success",
    },
    {
      label: "Total Active Employees",
      value: dashBoardCardsData?.employeeCount?.activeCount || 0,
      color: "primary",
    },
    {
      label: "Total In-Active Employees",
      value: dashBoardCardsData?.employeeCount?.inactiveCount || 0,
      color: "primary",
    },
    {
      label: "Contacts",
      value: `${dashBoardCardsData?.totalContactsUsed || 0} / ${
        dashBoardCardsData?.totalContactsLimit || 0
      }`,
      color: "textPrimary",
    },
    {
      label: "Overall Revenue",
      value: `\u20B9 ${
        dashBoardCardsData?.totalRevenue
          ? dashBoardCardsData?.totalRevenue.toFixed(2)
          : 0
      }`,
      color: "secondary",
    },
  ];

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState([
    "Accounts Created",
    "Active Accounts",
    "In-Active Accounts",
    "Overall Revenue",
    "Total Admins",
    "Total Employees",
    "Contacts",
  ]);

  // All your hooks and handlers remain the same.
  useEffect(() => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    setStartDate(oneWeekAgo);
    setEndDate(today);

    if (oneWeekAgo && today) {
      dispatch(
        getDashboardCardsData({ startDate: oneWeekAgo, endDate: today })
      );
      dispatch(
        getDashboardPlansData({ startDate: oneWeekAgo, endDate: today })
      );
      dispatch(
        getDashboardUsersData({ startDate: oneWeekAgo, endDate: today })
      );
      dispatch(
        getDashboardRevenueData({ startDate: oneWeekAgo, endDate: today })
      );
    }
    return () => {
      dispatch(resetDashboardData());
    };
  }, [dispatch]);

  const handleToggleModal = () => setModalOpen(!modalOpen);

  const handleCardSelection = (label) => {
    setVisibleCards((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

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

  const fetchData = () => {
    if (startDate && endDate) {
      dispatch(getDashboardCardsData({ startDate, endDate }));
      dispatch(getDashboardPlansData({ startDate, endDate }));
      dispatch(getDashboardUsersData({ startDate, endDate }));
      dispatch(getDashboardRevenueData({ startDate, endDate }));
    }
  };

  return (
    // --- Responsive main container with appropriate padding ---
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 py-14">
      {/* --- Responsive header for filter controls --- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        {/* Date Filters Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full">
            <Typography className="whitespace-nowrap">Start Date:</Typography>
            <DatePicker
              className="border p-2 rounded-lg w-full"
              selected={startDate}
              onChange={handleStartDateChange}
              placeholderText="Select start date"
              dateFormat="dd-MM-yyyy"
            />
          </div>
          <div className="flex items-center gap-2 w-full">
            <Typography className="whitespace-nowrap">End Date:</Typography>
            <DatePicker
              className="border p-2 rounded-lg w-full"
              selected={endDate}
              onChange={handleEndDateChange}
              placeholderText="Select end date"
              dateFormat="dd-MM-yyyy"
            />
          </div>
          <Button
            className="w-full sm:w-auto h-fit"
            variant="contained"
            color="primary"
            onClick={fetchData}
          >
            Find
          </Button>
        </div>

        {/* Filter Cards Button */}
        <Button
          className="w-full md:w-auto h-fit"
          variant="outlined"
          color="secondary"
          onClick={handleToggleModal}
        >
          Filter Cards
        </Button>
      </div>

      {/* --- Responsive Metrics Cards Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cardData
          .filter((item) => visibleCards.includes(item.label))
          .map((item, index) => (
            <MetricCard key={index} {...item} />
          ))}
      </div>

      {/* --- Responsive Charts Grid --- */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanPopularityChart />
        <ContactUsageChart />
        <UserGrowthByDate />
        <RevenueByDateChart />
      </div>

      {/* --- Responsive Modal for Card Selection --- */}
      <Modal open={modalOpen} onClose={handleToggleModal} disablePortal>
        {/* Using Tailwind for responsive width and centering */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg p-6">
          <Typography variant="h6" gutterBottom>
            Select Cards to Display
          </Typography>
          <Divider />
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {cardData.map((item, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={visibleCards.includes(item.label)}
                    onChange={() => handleCardSelection(item.label)}
                  />
                }
                label={item.label}
              />
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleToggleModal}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleToggleModal}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
