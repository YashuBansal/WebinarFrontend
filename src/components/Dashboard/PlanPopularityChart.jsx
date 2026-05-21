import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { useSelector } from "react-redux";
import { useTheme } from "../../contexts/ThemeContext";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const PlanPopularityChart = () => {
  const { isDark } = useTheme();
  const { plansGraphData = [] } = useSelector((state) => state.globalData);

  const data = {
    labels: plansGraphData.map((plan) => plan?.plan?.name || "-"),
    datasets: [
      {
        label: "Subscriptions",
        data: plansGraphData.map((plan) => plan?.total || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
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
      legend: {
        display: true,
        position: "top",
        labels: {
          color: isDark ? "#94a3b8" : "#64748b",
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        title: {
          display: true,
          text: "Plans",
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
          text: "Subscriptions",
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
          Plan Popularity Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <Bar data={data} options={options} />
      </CardContent>
    </Card>
  );
};

export default PlanPopularityChart;
