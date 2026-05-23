import { useState } from "react";
import Chart from "react-apexcharts";
import { Loader2, Activity } from "lucide-react";

// A high-fidelity loading spinner component
const ChartSpinner = () => (
  <div className="flex flex-col justify-center items-center h-full gap-3 text-slate-500 dark:text-slate-400">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    <span className="text-sm font-semibold tracking-wide">Analyzing Attendee Trends...</span>
  </div>
);

// A premium "No Data" message component
const NoDataMessage = () => (
  <div className="flex flex-col justify-center items-center h-full gap-3 text-slate-400 p-6 text-center">
    <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300">
      <Activity className="h-6 w-6" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Activity Detected</h4>
      <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">There is no attendee activity recorded for this period.</p>
    </div>
  </div>
);

const WebinarTrendChart = ({
  chartSeries,
  isLoading,
  onChangeOfVisibleDateRange,
}) => {
  const [chartOptions] = useState({
    chart: {
      id: "attendees-per-minute-chart",
      type: "area",
      height: 350,
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
        autoScaleYaxis: true,
      },
      events: {
        zoomed: function (chartContext, { xaxis }) {
          onChangeOfVisibleDateRange(xaxis);
        },
        scrolled: function (chartContext, { xaxis }) {
          onChangeOfVisibleDateRange(xaxis);
        },
      },
    },
    colors: ["#6366f1"], // Premium Indigo
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
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
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
          fontWeight: 500,
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
          color: "#94a3b8",
          fontSize: "12px",
          fontWeight: 600,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: true,
        color: "#e2e8f0",
      },
    },
    yaxis: {
      title: {
        text: "Attendees",
        style: {
          color: "#94a3b8",
          fontSize: "12px",
          fontWeight: 600,
        },
      },
      min: 0,
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
        },
        formatter: function (val) {
          return Math.max(0, Math.round(val));
        },
      },
    },
    tooltip: {
      enabled: true,
      theme: "light",
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
          return `${Math.round(val)} Present`;
        },
        title: {
          formatter: () => "Attendees: ",
        },
      },
      marker: {
        show: true,
      },
      shared: true,
      intersect: false,
    },
    grid: {
      show: true,
      borderColor: "rgba(148, 163, 184, 0.12)",
      strokeDashArray: 4,
      position: "back",
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 0,
        left: 10,
      },
    },
    markers: {
      size: 0,
      hover: {
        sizeOffset: 4,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="relative h-[350px] w-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/30">
        <ChartSpinner />
      </div>
    );
  }

  const hasData = chartSeries && chartSeries[0]?.data?.length > 0;

  return (
    <div className="relative w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl shadow-slate-100/50 dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Attendee Presence Trend
          </h3>
        </div>
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
          Minute-by-Minute Analytics
        </span>
      </div>
      <div className="h-[350px]">
        {hasData ? (
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="area"
            height={320}
          />
        ) : (
          <NoDataMessage />
        )}
      </div>
    </div>
  );
};

export default WebinarTrendChart;
