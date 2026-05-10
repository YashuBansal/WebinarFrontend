import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { useSelector } from "react-redux";
import { useTheme } from "../../contexts/ThemeContext";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const UserGrowthByDate = () => {
  const { isDark } = useTheme();
  const { usersGraphData = [] } = useSelector((state) => state.globalData);

  const labels = usersGraphData.map((item) => item?.dateObj?.split("T")[0]);
  const dataCounts = usersGraphData.map((item) => item?.total);

  const data = {
    labels,
    datasets: [
      {
        label: "User Sign-ups",
        data: dataCounts,
        fill: true,
        backgroundColor: isDark ? "rgba(54, 162, 235, 0.1)" : "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        pointBorderColor: "#fff",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
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
        title: {
          display: true,
          text: "Dates",
          color: isDark ? "#94a3b8" : "#64748b",
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
        }
      },
      y: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        title: {
          display: true,
          text: "Sign-ups",
          color: isDark ? "#94a3b8" : "#64748b",
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
          User Growth Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <Line data={data} options={options} />
      </CardContent>
    </Card>
  );
};

export default UserGrowthByDate;
