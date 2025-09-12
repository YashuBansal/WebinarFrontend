import { useState } from "react";
import Chart from "react-apexcharts";

// A simple loading spinner component
const ChartSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
    }}
  >
    <div>Loading Chart...</div>
  </div>
);

// A simple "No Data" message component
const NoDataMessage = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
    }}
  >
    <div>No attendee data available for this period.</div>
  </div>
);

const WebinarTrendChart = ({
  chartSeries,
  isLoading, // Receive the loading prop
  onChangeOfVisibleDateRange,
}) => {
  // All your chartOptions can remain the same. No changes needed there.
  const [chartOptions] = useState({
    chart: {
      id: "attendees-per-minute-chart",
      type: "area",
      height: 350,
      fontFamily: "inherit",
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
    colors: ["#3366FF"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100],
        colorStops: [
          {
            offset: 0,
            color: "#3366FF",
            opacity: 0.2,
          },
          {
            offset: 100,
            color: "#3366FF",
            opacity: 0.05,
          },
        ],
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        formatter: function (value, timestamp) {
          const options = {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          };
          // --- MODIFICATION: Convert am/pm to uppercase ---
          const timeString = new Date(timestamp).toLocaleString(
            "en-IN",
            options
          );
          return timeString.replace("am", "AM").replace("pm", "PM");
        },
      },
      title: {
        text: "Time",
      },
      axisTicks: {
        show: true,
        borderType: "solid",
        color: "#78909C",
        height: 6,
        offsetX: 0,
        offsetY: 0,
      },
    },
    yaxis: {
      title: {
        text: "Number of Attendees",
      },
      min: 0,
      labels: {
        formatter: function (val) {
          return Math.max(0, Math.round(val));
        },
      },
    },
    tooltip: {
      enabled: true,
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
          // --- MODIFICATION: Convert am/pm to uppercase ---
          const dateTimeString = new Date(value).toLocaleString(
            "en-IN",
            options
          );
          return dateTimeString.replace("am", "AM").replace("pm", "PM");
        },
      },
      y: {
        formatter: function (val) {
          return `Attendees: ${Math.round(val)}`;
        },
        title: {
          formatter: () => "",
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
      borderColor: "#e7e7e7",
      strokeDashArray: 0,
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
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    markers: {
      size: 0,
      hover: {
        sizeOffset: 4,
      },
    },
    title: {
      text: "Number of Attendees Present Each Minute",
      align: "left",
      margin: 20,
      offsetX: 0,
      offsetY: 0,
      floating: false,
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        fontFamily: "inherit",
        color: "#263238",
      },
    },
  });

  // *** NEW: Logic to handle loading and empty states ***
  if (isLoading) {
    return (
      <div className="relative" style={{ height: "400px", width: "100%" }}>
        <ChartSpinner />
      </div>
    );
  }

  // Check if there is actual data to display AFTER loading is complete.
  // We check `chartSeries[0]?.data?.length`.
  const hasData = chartSeries && chartSeries[0]?.data?.length > 0;

  return (
    <div className="relative" style={{ height: "400px", width: "100%" }}>
      {hasData ? (
        <Chart
          options={chartOptions}
          series={chartSeries} // This is now in the correct format [{ name: '...', data: [...] }]
          type="area"
          height={350}
        />
      ) : (
        <NoDataMessage />
      )}
    </div>
  );
};

export default WebinarTrendChart;
