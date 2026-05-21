import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { useSelector } from "react-redux";
import { useTheme } from "../../contexts/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ContactUsageChart = () => {
  const { isDark } = useTheme();
  const { dashBoardCardsData = [] } = useSelector((state) => state.globalData);

  const contactChartData = {
    labels: ["Used", "Remaining"],
    datasets: [
      {
        label: "Contacts",
        data: [
          dashBoardCardsData?.totalContactsUsed || 0,
          dashBoardCardsData?.totalContactsLimit -
            dashBoardCardsData?.totalContactsUsed || 0,
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.2)",
          "rgba(16, 185, 129, 0.2)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: isDark ? "#94a3b8" : "#64748b",
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
        }
      },
      y: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        beginAtZero: true,
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
        }
      },
    },
    layout: {
      padding: {
        bottom: 10,
      },
    },
  };

  return (
    <Card className="shadow-sm w-full h-[60vh] border-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 dark:text-slate-100">
          Contacts Usage Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <Bar data={contactChartData} options={options} />
      </CardContent>
    </Card>
  );
};

export default ContactUsageChart;
