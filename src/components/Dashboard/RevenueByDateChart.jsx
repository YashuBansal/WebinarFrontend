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

const RevenueByDateChart = () => {
  const { isDark } = useTheme();
  const { revenueGraphData = [] } = useSelector((state) => state.globalData);

  const labels = revenueGraphData.map((item) => item?.dateObj?.split("T")[0]);
  const revenues = revenueGraphData.map((item) => item?.totalRevenue);

  const data = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: revenues,
        fill: true,
        backgroundColor: isDark ? "rgba(255, 99, 132, 0.1)" : "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(255, 99, 132, 1)",
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
            return `${
              context.dataset.label
            }: \u20B9${context.raw.toLocaleString()}`;
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
          autoSkip: true,
          maxTicksLimit: 10,
          color: isDark ? "#94a3b8" : "#64748b",
        },
      },
      y: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        title: {
          display: true,
          text: "Revenue (in \u20B9)",
          color: isDark ? "#94a3b8" : "#64748b",
        },
        beginAtZero: true,
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          callback: function (value) {
            return `\u20B9${value.toLocaleString()}`;
          },
        },
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
        <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Revenue Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <Line data={data} options={options} />
      </CardContent>
    </Card>
  );
};

export default RevenueByDateChart;
