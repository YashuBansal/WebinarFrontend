import IconButton from "@mui/material/IconButton";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { EditIcon } from "../../components/SVGs";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { useEffect, useMemo, useRef } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";

// A helper function to format the full name cleanly
const formatFullName = (item) => {
  const firstName = item?.firstName;
  const rawLastName = item?.lastName;
  // Clean up the smiley face artifact if it exists
  const lastName = rawLastName?.includes(":-)") ? "" : rawLastName;

  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return "-";
};

const HistoryHeader = ({ counts, onOpenNewPage }) => (
  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-neutral-100 rounded-t-lg">
    <span className="font-semibold text-xl text-neutral-800">Attendee History</span>
    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
      <div className="flex items-center gap-x-6 gap-y-2 text-sm">
        <span>
          Registered: <span className="text-indigo-500 text-lg font-bold">{counts.registeredWebinarCount}</span>
        </span>
        <span>
          Attended: <span className="text-indigo-500 text-lg font-bold">{counts.attendedWebinarCount}</span>
        </span>
      </div>
      <IconButton onClick={onOpenNewPage} aria-label="Open history in new page">
        <OpenInNew />
      </IconButton>
    </div>
  </div>
);

const AttendeeHistoryTable = ({
  attendeeHistoryData,
  navigate,
  email,
  employeeModeData,
  userData,
  setEditModalData,
  formatDateAsNumber,
  selectedAttendee,
}) => {
  const shouldShowNoRecord =
    !Array.isArray(attendeeHistoryData) || attendeeHistoryData.length <= 0;

  const scrollRef = useRef(null);

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const counts = useMemo(() => {
    const countsData = {
      registeredWebinarCount: 0,
      attendedWebinarCount: 0,
    };

    if (
      Array.isArray(selectedAttendee) &&
      selectedAttendee.length > 0 &&
      Array.isArray(selectedAttendee[0]?.data)
    ) {
      const data = selectedAttendee[0]?.data;
      data.forEach((item) => {
        if (!item.isAttended) {
          countsData.registeredWebinarCount += 1;
        } else if (item.isAttended && item.timeInSession > 0) {
          countsData.attendedWebinarCount += 1;
        }
      });
    }
    return countsData;
  }, [selectedAttendee]);


  // Scroll to bottom when noteData updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [attendeeHistoryData]);

  return (
    <div className="mt-12 shadow-lg rounded-lg overflow-x-auto ">
      {shouldShowNoRecord ? (
        <div className="text-lg p-2 flex justify-center w-full">
          No record found
        </div>
      ) : (
        <div className="p-2 bg-neutral-100 rounded-lg shadow-md">
           <HistoryHeader
            counts={counts}
            onOpenNewPage={() => navigate(`/particularContact/attendee-History?email=${email}`)}
          />
          {isSmallScreen ? (
            // --- CARD VIEW for Small Screens ---
            <div  ref={scrollRef} className="w-full max-h-[70dvh] overflow-y-auto space-y-4 p-4 bg-gray-50" >
                {attendeeHistoryData.map((item, idx) => (
                    <HistoryCard 
                        key={item._id || idx}
                        item={item}
                        index={idx}
                        onEdit={setEditModalData}
                        formatDate={formatDateAsNumber}
                        showEditButton={!employeeModeData && userData?.isActive}
                    />
                ))}
            </div>
          ):(
          <div ref={scrollRef} className="w-full max-h-96 overflow-y-auto">
            <table className="w-full table-auto text-sm text-center whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="py-3 px-1">S No.</th>
                  <th className="py-3 px-1">Webinar</th>
                  <th className="py-3 px-1">Reminder</th>
                  <th className="py-3 px-1">Sales</th>
                  <th className="py-3 px-1">Type</th>
                  <th className="py-3 px-1">Phone</th>
                  <th className="py-3 px-1 min-w-[150px]">Full Name</th>
                  <th className="py-3 px-1 min-w-[150px]">Gender</th>
                  <th className="py-3 min-w-[200px]">Webinar Minutes</th>
                  <th className="py-3 px-1">Location</th>
                  <th className="py-3 px-1 min-w-[150px]">Webinar Date</th>
                  <ComponentGuard
                    conditions={[!employeeModeData, userData?.isActive]}
                  >
                    <th className="py-3 px-1 stickyFieldRight">Action</th>
                  </ComponentGuard>
                </tr>
              </thead>
              <tbody className="text-gray-600 divide-y">
                {attendeeHistoryData?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-4">{idx + 1}</td>
                    <td className="px-2 py-4">
                      {Array.isArray(item?.webinar) && item.webinar.length > 0
                        ? item.webinar[0].webinarName
                        : "-"}
                    </td>
                    <td className="px-2 py-4">
                      {item?.reminderAssignedTo || "N/A"}
                    </td>
                    <td className="px-2 py-4">
                      {item?.assignedToUserName || "N/A"}
                    </td>
                    <td className="px-2 py-4">
                      {item?.isAttended ? "Sales" : "Reminder"}
                    </td>
                    <td className="px-2 py-4">{item?.phone || "N/A"}</td>
                    <td className="px-2 py-4">
                      {(() => {
                        const firstName = item?.firstName;
                        const rawLastName = item?.lastName;
                        const lastName = rawLastName?.match(/:-\)/)
                          ? ""
                          : rawLastName;
                        if (firstName)
                          return `${firstName} ${lastName || ""}`.trim();
                        else if (lastName) return lastName;
                        return "-";
                      })()}
                    </td>
                    <td className="px-2 py-4">{item?.gender || "N/A"}</td>
                    <td className="py-4 text-center">{item?.timeInSession}</td>
                    <td className="py-4 text-center capitalize">
                      {item?.location || "N/A"}
                    </td>
                    <td className="px-3 py-4">
                      {Array.isArray(item?.webinar) && item.webinar.length > 0
                        ? formatDateAsNumber(item.webinar[0].webinarDate)
                        : "-"}
                    </td>
                    <ComponentGuard
                      conditions={[!employeeModeData, userData?.isActive]}
                    >
                      <td className="px-3 stickyFieldRight">
                        <button
                          className="p-2 rounded-full hover:bg-neutral-200"
                          onClick={() => setEditModalData(item)}
                        >
                          <img
                            src={EditIcon}
                            alt="Edit"
                            className="h-6 w-6 min-h-6 min-w-6"
                          />
                        </button>
                      </td>
                    </ComponentGuard>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}
        </div>
      )}
    </div>
  );
};

export default AttendeeHistoryTable;


export const StatRow = ({ label, value, valueClassName = "text-gray-800" }) => (
  <div className="flex justify-between border-t border-gray-100 py-2">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className={`text-sm font-medium text-right ${valueClassName}`}>{value}</dd>
  </div>
);

const HistoryCard = ({ item, index, onEdit, formatDate, showEditButton }) => {
  const webinarName = Array.isArray(item?.webinar) && item.webinar.length > 0
    ? item.webinar[0].webinarName
    : "-";
  const webinarDate = Array.isArray(item?.webinar) && item.webinar.length > 0
    ? formatDate(item.webinar[0].webinarDate)
    : "-";

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 border-b pb-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-center">
            <span className="font-mono text-gray-400 mr-2">#{index + 1}</span>
            {webinarName}
          </p>

          <p className="text-sm text-gray-500">
            <span className="font-mono text-gray-400 mr-2">Date: </span>
            {webinarDate}</p>
        </div>
        {showEditButton && (
          <button
            onClick={() => onEdit(item)}
            className="rounded-full p-2 transition-colors hover:bg-neutral-100 flex-shrink-0"
            aria-label="Edit History"
          >
            <img src={EditIcon} alt="Edit" className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Card Body - Details */}
      <dl className="space-y-1">
        <StatRow label="Full Name" value={formatFullName(item)} />
        <StatRow label="Phone" value={item?.phone || "N/A"} />
        <StatRow label="Sales Rep" value={item?.assignedToUserName || "N/A"} />
        <StatRow label="Reminder Rep" value={item?.reminderAssignedTo || "N/A"} />
        <StatRow label="Type" value={item?.isAttended ? "Sales" : "Reminder"} />
        <StatRow label="Gender" value={item?.gender || "N/A"}/>
        <StatRow label="Webinar Mins" value={item?.timeInSession || "0"} />
        <StatRow label="Location" value={item?.location || "N/A"} valueClassName="capitalize" />
      </dl>
      
    </div>
  );
};