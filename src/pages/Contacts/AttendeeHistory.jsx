import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import EditModal from "./Modal/EditModal";
import { getAttendee, updateAttendee } from "../../features/actions/attendees";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { EditIcon } from "../../components/SVGs";
import { formatDateAsNumber } from "../../utils/extra";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

import useMediaQuery from "../../hooks/useMediaQuery";
import { StatRow } from "./AttendeeHistoryTable";

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

const HistoryHeader = ({ counts }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-100 rounded-t-lg">
      <div className="flex justify-between w-full ">
        <span className="font-semibold text-xl text-neutral-800 ">
          Attendee History
        </span>
        <button
          onClick={() => navigate(-1)}
          className="md:hidden block rounded-sm bg-blue-600 px-4 py-1 text-white"
        >
          Back
        </button>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
        <div className="flex items-center gap-x-6 gap-y-2 text-sm">
          <span>
            Registered:{" "}
            <span className="text-indigo-500 text-lg font-bold">
              {counts.registeredWebinarCount}
            </span>
          </span>
          <span>
            Attended:{" "}
            <span className="text-indigo-500 text-lg font-bold">
              {counts.attendedWebinarCount}
            </span>
          </span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="hidden md:block rounded-sm bg-blue-600 px-4 py-1 text-white"
        >
          Back
        </button>
      </div>
    </div>
  );
};

const AttendeeHistory = () => {
  const addUserActivityLog = useAddUserActivity();
  const dispatch = useDispatch();

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email") || "";
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const { selectedAttendee } = useSelector((state) => state.attendee);
  const { userData } = useSelector((state) => state.auth);
  const { employeeModeData } = useSelector((state) => state.employee);

  const { globalLocationsData } = useSelector((state) => state.location);

  const [locationsMap, setLocationsMap] = useState(new Map());
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (Array.isArray(globalLocationsData)) {
      const tempMap = new Map();
      globalLocationsData.forEach((location) => {
        if (location?.name) {
          tempMap.set(location?.name.trim().toLowerCase(), location?.state);
        }
      });
      setLocationsMap(tempMap);
    }
  }, [globalLocationsData]);

  useEffect(() => {
    setIsDataVisible(false);
    console.log("selectedAttendee", selectedAttendee);

    if (
      Array.isArray(selectedAttendee) &&
      selectedAttendee.length > 0 &&
      Array.isArray(selectedAttendee[0]?.data) &&
      selectedAttendee[0]?.data.length > 0
    ) {
      setIsDataVisible(true);
    }
  }, [selectedAttendee]);

  const onConfirmEdit = (data) => {
    dispatch(updateAttendee(data)).then(() => {
      setEditModalData(null);
      addUserActivityLog({
        action: "update",
        details: `User updated information of Attendee with Email: ${email}`,
      });
      setIsDataVisible(false);
      dispatch(getAttendee({ email }));
    });
  };

  useEffect(() => {
    console.log("email", email);
    setIsDataVisible(false);
    dispatch(getAttendee({ email }));
  }, [email]);

  const tableData = useMemo(() => {
    if (
      Array.isArray(selectedAttendee) &&
      selectedAttendee.length > 0 &&
      Array.isArray(selectedAttendee[0]?.data) &&
      selectedAttendee[0].data.length > 0
    ) {
      return [...selectedAttendee[0].data].reverse();
    }
    return [];
  }, [selectedAttendee]);

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
      const data = selectedAttendee[0].data;
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

  return (
    <div className="px-3 md:px-10 pt-14 space-y-6">
      <div className=" px-3 py-6 md:p-6 bg-gray-50 rounded-lg">
        <HistoryHeader counts={counts} />

        <div className="mt-12 shadow-lg rounded-lg overflow-x-auto">
          {!isDataVisible ? (
            <div className="text-lg p-2 flex justify-center w-full">
              No record found
            </div>
          ) : isSmallScreen ? (
            <div  className="w-full space-y-4 p-4 bg-gray-50" >
                {tableData.map((item, idx) => (
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
          ) : (
            <div className="p-2 bg-neutral-100 rounded-lg shadow-md">
              <table className=" table-auto text-sm text-left capitalize whitespace-nowrap w-full">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b justify-between">
                  <tr>
                    <th className="py-3 px-2">S No.</th>
                    <th className="py-3 px-2">Webinar</th>
                    <th className="py-3 px-2 ">Assigned To</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2">Full Name</th>
                    <th className="py-3 px-2">Gender</th>
                    <th className="py-3 px-2 text-center">Webinar Minutes</th>
                    <th className="py-3 px-2">Location</th>
                    <th className="py-3 px-2">Webinar Date</th>
                    <th className="py-3 px-2">Tags</th>
                    <ComponentGuard
                      conditions={[
                        employeeModeData ? false : true,
                        userData?.isActive,
                      ]}
                    >
                      <th className="py-3 px-2">Action</th>
                    </ComponentGuard>
                  </tr>
                </thead>

                <tbody className="text-gray-600 divide-y">
                  {tableData.map((item, idx) => {
                    return (
                      <tr key={idx}>
                        <td className={`px-3 py-4 whitespace-nowrap  `}>
                          {idx + 1}
                        </td>

                        <td className="px-2 py-4 whitespace-nowrap ">
                          {Array.isArray(item?.webinar) &&
                          item.webinar.length > 0
                            ? item?.webinar[0].webinarName
                            : "-"}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap ">
                          {item?.assignedToUserName || "N/A"}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap ">
                          {item?.isAttended ? "Sales" : "Reminder"}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap ">
                          {item?.phone || "N/A"}
                        </td>

                        <td className="px-2 py-4 whitespace-nowrap">
                          {(() => {
                            const firstName = item?.firstName;
                            const rawLastName = item?.lastName;
                            const lastName = rawLastName?.match(/:-\)/)
                              ? ""
                              : rawLastName;

                            if (firstName) {
                              return `${firstName} ${lastName || ""}`.trim();
                            } else if (lastName) {
                              return lastName;
                            } else {
                              return null; // or return "-" or something else if you want a placeholder
                            }
                          })()}
                        </td>

                        <td className="px-2 py-4 whitespace-nowrap ">
                          {item?.gender || "N/A"}
                        </td>

                        <td className=" py-4 text-center whitespace-nowrap">
                          {item?.timeInSession}
                        </td>
                        <td className=" py-4 text-center capitalize whitespace-nowrap">
                          <span>{item?.location || "N/A"}</span>
                        </td>

                        <td className="px-3 py-4 whitespace-nowrap">
                          {Array.isArray(item?.webinar) &&
                          item.webinar.length > 0
                            ? formatDateAsNumber(item?.webinar[0].webinarDate)
                            : "-"}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-nowrap gap-2 ">
                            {Array.isArray(item?.tags)
                              ? item?.tags
                                  .filter(
                                    (tag) =>
                                      typeof tag === "string" &&
                                      tag.trim() !== ""
                                  )
                                  .map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 rounded-full text-xs bg-gray-300 text-gray-800"
                                    >
                                      {tag}
                                    </span>
                                  ))
                              : "-"}
                          </div>
                        </td>
                        <ComponentGuard
                          conditions={[
                            employeeModeData ? false : true,
                            userData?.isActive,
                          ]}
                        >
                          <td className="px-3 h-full">
                            <button
                              className="p-2 rounded-full hover:bg-neutral-200"
                              onClick={() => setEditModalData(item)}
                            >
                              <img
                                src={EditIcon}
                                alt="Edit"
                                className="min-h-6 h-6 w-6 min-w-6"
                              />
                            </button>
                          </td>
                        </ComponentGuard>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {editModalData && (
        <EditModal
          setModal={setEditModalData}
          initialData={editModalData}
          onConfirmEdit={onConfirmEdit}
          locationsMap={locationsMap}
          locations={globalLocationsData}
          userData={userData}
        />
      )}
    </div>
  );
};

export default AttendeeHistory;

const HistoryCard = ({ item, index, onEdit, formatDate, showEditButton }) => {
  const webinarName =
    Array.isArray(item?.webinar) && item.webinar.length > 0
      ? item.webinar[0].webinarName
      : "-";
  const webinarDate =
    Array.isArray(item?.webinar) && item.webinar.length > 0
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
            {webinarDate}
          </p>
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
        <StatRow
          label="Assigned To"
          value={item?.assignedToUserName || "N/A"}
        />
        <StatRow label="Type" value={item?.isAttended ? "Sales" : "Reminder"} />
        <StatRow label="Gender" value={item?.gender || "N/A"} />
        <StatRow label="Webinar Mins" value={item?.timeInSession || "0"} />
        <StatRow
          label="Location"
          value={item?.location || "N/A"}
          valueClassName="capitalize"
        />
      </dl>

      {/* Tags */}
      {Array.isArray(item?.tags) && item.tags.filter((t) => t).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {item.tags
              .filter((t) => t)
              .map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
