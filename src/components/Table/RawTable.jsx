import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  formatDateAsNumber,
  formatDateAsNumberWithTime,
} from "../../utils/extra";
import { useSelector } from "react-redux";
import useRoles from "../../hooks/useRoles";
import { getTagsData } from "../../features/slices/globalData";
import { Link } from "react-router-dom";
import useMediaQuery from "../../hooks/useMediaQuery";
import { maskPiiDisplay } from "../../utils/maskPii";

const CellRenderer = memo(
  ({ column, row, isTablesMasked, roles, employeesMap, tagSet }) => {
    const value = row?.[column.key];

    if (
      value === undefined &&
      !["role"].includes(column.type) &&
      !column.default
    ) {
      return <span className=" text-red-400 italic">N/A</span>;
    }

    switch (column.type) {
      case "status":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        );
      case "tag": {
        const filteredTags = Array.isArray(value)
          ? value.filter((tag) => typeof tag === "string" && tag.trim() !== "")
          : [];
        if (filteredTags.length === 0)
          return <span className="italic text-gray-400">No Tags</span>;
        const invalidTags = filteredTags.filter((tag) => !tagSet.has(tag));
        const validTags = filteredTags.filter((tag) => tagSet.has(tag));
        const sortedTags = [...invalidTags, ...validTags];
        return (
          <div
            title={sortedTags.join(", ")}
            className="flex  gap-1 md:flex-nowrap flex-wrap"
          >
            {sortedTags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded-full text-xs ${
                  tagSet.has(tag)
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {tag}
              </span>
            ))}
            {sortedTags.length > 2 && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                +{sortedTags.length - 2}
              </span>
            )}
          </div>
        );
      }
      case "chip": {
        const filteredChips = Array.isArray(value)
          ? value.filter((chip) => chip)
          : [];
        if (filteredChips.length === 0)
          return <span className="italic text-red-400">N/A</span>;
        return (
          <div
            title={filteredChips.join(", ")}
            className="flex gap-1 md:flex-nowrap flex-wrap"
          >
            {filteredChips.slice(0, 2).map((chip, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
              >
                {chip}
              </span>
            ))}
            {filteredChips.length > 2 && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                +{filteredChips.length - 2}
              </span>
            )}
          </div>
        );
      }
      case "superAdminApproval":
      case "adminApproval": {
        const isApproved = value;
        const isRejected = row[column.key2 || "deactivated"];
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isApproved
                ? "bg-green-100 text-green-800"
                : isRejected
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
          </span>
        );
      }
      case "Date": {
        const date =
          column.key === "webinarDate"
            ? formatDateAsNumber(value)
            : formatDateAsNumberWithTime(value);
        return date || <span className="italic text-gray-400">Not Set</span>;
      }
      case "details":
        return <span className="whitespace-normal text-gray-600">{value}</span>;
      case "role":
        return (
          <span>
            {value
              ? `${value} (${roles.getRoleNameById(row["role"]) || ""})`
              : column.default || (
                  <span className="italic text-red-400">N/A</span>
                )}
          </span>
        );
      case "Employee":
        return employeesMap.has(value?.trim()) ? (
          <span>{employeesMap.get(value.trim())}</span>
        ) : (
          <span className="italic text-red-400">N/A</span>
        );
      default:
        if (value === undefined || value === null || value === "") {
          return (
            column.default ?? <span className="italic text-red-400">N/A</span>
          );
        }
        if (
          isTablesMasked &&
          ["userName", "email", "phone", "firstName", "lastName"].includes(
            column.key
          )
        ) {
          return maskPiiDisplay(value, true);
        }
        return String(value);
    }
  }
);

const RawTable = ({
  tableData,
  actions = [],
  isSelectVisible,
  page,
  limit,
  isLoading,
  selectedRows,
  setSelectedRows,
  rowClick = () => {},
  isRowClickable = false,
  isLeadType = false,
  sortByOrder = "asc",
  employees,
}) => {
  const { isTablesMasked } = useSelector((state) => state.table);
  const tableRef = useRef();
  const [employeesMap, setEmployeesMap] = useState(new Map());
  const roles = useRoles();
  const tagsData = useSelector(getTagsData);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const tagSet = useMemo(
    () =>
      new Set(Array.isArray(tagsData) ? tagsData.map((tag) => tag.name) : []),
    [tagsData]
  );

  useEffect(() => {
    if (Array.isArray(employees)) {
      const tempMap = new Map(
        employees.map((emp) => [emp?._id, emp?.userName])
      );
      setEmployeesMap(tempMap);
    }
  }, [employees]);

  const handleCheckboxChange = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const isRowSelected = (id) => selectedRows.includes(id);

  const cellRendererProps = { isTablesMasked, roles, employeesMap, tagSet };

  // --- RENDER CARD VIEW FOR SMALL SCREENS ---
  if (isSmallScreen) {
    const Card = ({ row, index }) => {
      const firstColumn = tableData.columns[0];
      const otherColumns = tableData.columns.slice(1);

      return (
        <div
          className={`rounded-xl border bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 ${
            isRowSelected(row._id)
              ? "ring-2 ring-blue-500 border-transparent"
              : "border-gray-200/80"
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {isSelectVisible && (
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={isRowSelected(row._id)}
                  onChange={() => handleCheckboxChange(row._id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                #
                {sortByOrder === "asc"
                  ? (page - 1) * limit + index + 1
                  : tableData?.totalRecords - ((page - 1) * limit + index)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {actions.map(
                (action, idx) =>
                  (action.hideCondition ? action.hideCondition(row) : true) &&
                  (action.type === "client-link" ? (
                    <Link
                      key={idx}
                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                      to={`/view-client/${row._id}`}
                      title={action.tooltip}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {action.icon(row)}
                    </Link>
                  ) : action.type === "attendee-link" ? (
                    <Link
                      key={idx}
                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                      to={`/particularContact?email=${row?.email}&attendeeId=${row?.attendeeId}`}
                      title={action.tooltip}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {action.icon(row)}
                    </Link>
                  ) : (
                    <button
                      key={idx}
                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row);
                      }}
                      title={action.tooltip}
                      disabled={action.disabled}
                    >
                      {action.icon(row)}
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Card Body */}
          <div
            className={`p-4 ${isRowClickable ? "cursor-pointer" : ""}`}
            onClick={() => isRowClickable && rowClick(row)}
          >
            {/* Primary Info */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                {firstColumn.header}
              </p>
              <div className="text-md font-semibold text-gray-900">
                <CellRenderer
                  column={firstColumn}
                  row={row}
                  {...cellRendererProps}
                />
              </div>
            </div>

            {/* Other Info */}
            <div className="space-y-3">
              {otherColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex justify-between items-center p-2 rounded-lg bg-gray-50/80 border border-gray-200/60"
                >
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {col.header}
                  </p>
                  <div className="text-sm text-gray-800 text-right">
                    <CellRenderer
                      column={col}
                      row={row}
                      {...cellRendererProps}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="p-2 space-y-4 bg-gray-100">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
            >
              <div className="text-center mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
              </div>
            </div>
          ))
        ) : !tableData?.rows || tableData.rows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <p className="text-gray-500 font-medium">No data available</p>
            <p className="text-gray-400 text-sm mt-1">
              There are no records to display at the moment.
            </p>
          </div>
        ) : (
          <>
            {isSelectVisible && tableData?.rows?.length > 0 && (
              <div className=" px-3 flex items-center gap-5 border bg-white border-gray-300 rounded-md">
                <input
                  type="checkbox"
                  id="select-all"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={selectedRows.length === tableData?.rows?.length}
                  onChange={(e) =>
                    setSelectedRows(
                      e.target.checked
                        ? tableData?.rows?.map((row) => row._id)
                        : []
                    )
                  }
                />

                <label
                  htmlFor="select-all"
                  className=" py-3  w-full text-gray-500 text-md font-semibold cursor-pointer"
                >
                  {" "}
                  {selectedRows.length === tableData?.rows?.length
                    ? "Unselect"
                    : "Select"}{" "}
                  All
                </label>
              </div>
            )}

            {tableData.rows.map((row, index) => (
              <Card key={row._id} row={row} index={index} />
            ))}
          </>
        )}
      </div>
    );
  }

  // --- RENDER TABLE VIEW FOR LARGER SCREENS ---
  return (
    <div
      ref={tableRef}
      className="shadow-md rounded-lg overflow-auto max-h-[80vh]"
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            {isLeadType && <th className="w-1 p-0 m-0"></th>}
            <th className="py-6 px-4 font-normal text-sm whitespace-nowrap text-start">
              S.No
            </th>
            {isSelectVisible && tableData?.rows?.length > 0 && (
              <th className="py-3 px-4 justify-start items-center flex h-16">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={selectedRows.length === tableData?.rows?.length}
                  onChange={(e) =>
                    setSelectedRows(
                      e.target.checked
                        ? tableData?.rows?.map((row) => row._id)
                        : []
                    )
                  }
                />
              </th>
            )}
            {tableData?.columns?.map((column, index) => (
              <th
                key={index}
                className="text-start px-4 text-sm font-normal py-6 whitespace-nowrap"
              >
                {column.header}
              </th>
            ))}
            {Array.isArray(actions) && actions.length > 0 && (
              <th className="px-4 py-3 text-gray-700 font-normal text-sm sticky right-0 bg-gray-100 z-10">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: limit <= 10 ? limit : 10 }).map((_, index) => (
              <tr className="border" key={index}>
                <td className="px-4 py-4">
                  <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
                </td>
                {isSelectVisible && (
                  <td>
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                  </td>
                )}
                {tableData?.columns?.map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-2">
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
                  </td>
                )}
              </tr>
            ))
          ) : tableData?.rows?.length > 0 ? (
            tableData?.rows?.map((row, index) => (
              <tr
                key={row?._id}
                className={`${
                  isRowSelected(row?._id) ? "bg-blue-50" : "bg-white"
                } hover:bg-gray-50 border-b whitespace-nowrap`}
              >
                {isLeadType && (
                  <td
                    className={`text-gray-600 ${
                      isRowClickable ? "cursor-pointer" : ""
                    }`}
                    onClick={() => rowClick(row)}
                  >
                    <div
                      className="w-2 h-14 rounded-sm"
                      style={{
                        backgroundColor: row?.leadType?.color || "transparent",
                      }}
                    ></div>
                  </td>
                )}
                <td
                  className={`px-4 py-2 h-14 text-gray-600 ${
                    isRowClickable ? "cursor-pointer" : ""
                  }`}
                  onClick={() => rowClick(row)}
                >
                  {sortByOrder === "asc"
                    ? (page - 1) * limit + index + 1
                    : tableData?.totalRecords - ((page - 1) * limit + index)}
                </td>
                {isSelectVisible && (
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 "
                      checked={isRowSelected(row?._id)}
                      onChange={() => handleCheckboxChange(row?._id)}
                    />
                  </td>
                )}
                {tableData?.columns?.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-2 text-gray-600 truncate ${
                      column.capitalize ? "capitalize" : ""
                    } ${isRowClickable ? "cursor-pointer" : ""}`}
                    onClick={() => rowClick(row)}
                  >
                    <CellRenderer
                      column={column}
                      row={row}
                      {...cellRendererProps}
                    />
                  </td>
                ))}
                {Array.isArray(actions) && actions.length > 0 && (
                  <td className="px-4 py-2 sticky right-0 bg-white border-l">
                    <div className="flex gap-2">
                      {actions.map(
                        (action, idx) =>
                          (action.hideCondition
                            ? action.hideCondition(row)
                            : true) &&
                          (action.type === "client-link" ? (
                            <Link
                              key={idx}
                              className="p-2 hover:bg-gray-100 rounded-full group"
                              to={`/view-client/${row?._id}`}
                              title={action.tooltip}
                            >
                              {action.icon(row)}
                            </Link>
                          ) : action.type === "attendee-link" ? (
                            <Link
                              key={idx}
                              className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                              to={`/particularContact?email=${row?.email}&attendeeId=${row?.attendeeId}`}
                              title={action.tooltip}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {action.icon(row)}
                            </Link>
                          ) : (
                            <button
                              key={idx}
                              disabled={action?.disabled ? true : false}
                              className="p-2 hover:bg-gray-100 rounded-full group"
                              onClick={() => action.onClick(row)}
                              title={action.tooltip}
                            >
                              {action.icon(row)}
                            </button>
                          ))
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={
                  tableData?.columns?.length +
                  2 +
                  (isSelectVisible ? 1 : 0) +
                  (isLeadType ? 1 : 0)
                }
                className="px-4 py-8 text-center text-gray-500 italic"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

function areEqual(prevProps, nextProps) {
  return (
    prevProps.tableData === nextProps.tableData &&
    prevProps.actions === nextProps.actions &&
    prevProps.isSelectVisible === nextProps.isSelectVisible &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.selectedRows === nextProps.selectedRows &&
    prevProps.locations === nextProps.locations
  );
}

export default memo(RawTable, areEqual);
