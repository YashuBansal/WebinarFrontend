import React, { useState, useMemo } from "react";
import { formatIsoStringAsLocalAmPm } from "../../../utils/extra";
import useMediaQuery from "../../../hooks/useMediaQuery"; // Assuming you have this hook

import {
  Pagination,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";

// --- NEW: A reusable card component for mobile view ---
const ParticipantCard = ({ participant, index }) => {
  const fullName =
    `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
    "N/A";

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* Card Header: Main Info */}
      <div className="flex items-start justify-between gap-4 border-b pb-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900">
            <span className="font-mono text-gray-400 mr-2">#{index}</span>
            {fullName}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {participant.email || "N/A"}
          </p>
        </div>
      </div>

      {/* Card Body: Details in a definition list for clarity */}
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Phone</dt>
          <dd className="font-medium text-gray-800">
            {participant.phone || "N/A"}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Session Time</dt>
          <dd className="font-medium text-gray-800">
            {participant.timeDifference || "N/A"}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">In Time</dt>
          <dd className="font-medium text-gray-800">
            {formatIsoStringAsLocalAmPm(
              new Date(participant.inTime).toISOString()
            )}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Out Time</dt>
          <dd className="font-medium text-gray-800">
            {participant.outTime
              ? formatIsoStringAsLocalAmPm(
                  new Date(participant.outTime).toISOString()
                )
              : "Still in session"}
          </dd>
        </div>
      </dl>
    </div>
  );
};

const FilteredParticipantsTable = ({ participants }) => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  // All your state and memoization logic remains the same
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "email",
    direction: "ascending",
  });

  const sortedParticipants = useMemo(() => {
    let sortableItems = [...participants];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [participants, sortConfig]);

  const pageCount = Math.ceil(sortedParticipants.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentParticipants = sortedParticipants.slice(
    indexOfFirstRow,
    indexOfLastRow
  );

  // All handlers remain the same
  const handlePageChange = (event, value) => setCurrentPage(value);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };
  const handleSortKeyChange = (event) => {
    setSortConfig((prev) => ({ ...prev, key: event.target.value }));
    setCurrentPage(1);
  };
  const handleSortDirectionChange = (event) => {
    setSortConfig((prev) => ({ ...prev, direction: event.target.value }));
    setCurrentPage(1);
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="mt-4 text-center text-gray-500">
        No participants in the selected range.
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* --- Responsive Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-lg font-semibold text-gray-700">
          Participants in Selected Range
        </h3>
        <h3 className="text-lg font-semibold text-gray-700">
          Total: {participants.length}
        </h3>
      </div>

      {/* Sorting Controls */}
      <Box sx={{ flexGrow: 1, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortConfig.key}
                label="Sort By"
                onChange={handleSortKeyChange}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="timeDifference">Session Time</MenuItem>
                <MenuItem value="firstName">First Name</MenuItem>
                <MenuItem value="lastName">Last Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-direction-label">Direction</InputLabel>
              <Select
                labelId="sort-direction-label"
                value={sortConfig.direction}
                label="Direction"
                onChange={handleSortDirectionChange}
              >
                <MenuItem value="ascending">A - Z</MenuItem>
                <MenuItem value="descending">Z - A</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* --- Conditional Rendering for Table vs. Cards --- */}
      {isSmallScreen ? (
        // --- CARD VIEW for Small Screens ---
        <div className="overflow-auto max-h-[60vh] rounded-lg space-y-3">
          {currentParticipants.map((p, index) => (
            <ParticipantCard
              key={p._id}
              participant={p}
              index={indexOfFirstRow + index + 1}
            />
          ))}
        </div>
      ) : (
        // --- TABLE VIEW for Larger Screens ---
        <div className="overflow-auto max-h-[60vh] border border-gray-200 rounded-lg">
          <table className="min-w-full whitespace-nowrap bg-white">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="py-2 px-4 text-start border-b">#</th>
                <th className="py-2 px-4 text-start border-b">First Name</th>
                <th className="py-2 px-4 text-start border-b">Last Name</th>
                <th className="py-2 px-4 text-start border-b">Email</th>
                <th className="py-2 px-4 text-start border-b">Phone</th>
                <th className="py-2 px-4 text-start border-b">Session Time</th>
                <th className="py-2 px-4 text-start border-b">In Time</th>
                <th className="py-2 px-4 text-start border-b">Out Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentParticipants.map((p, index) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4">{indexOfFirstRow + index + 1}</td>
                  <td className="py-2 px-4">{p.firstName || "N/A"}</td>
                  <td className="py-2 px-4">{p.lastName || "N/A"}</td>
                  <td className="py-2 px-4">{p.email || "N/A"}</td>
                  <td className="py-2 px-4">{p.phone || "N/A"}</td>
                  <td className="py-2 px-4">{p.timeDifference || "N/A"}</td>
                  <td className="py-2 px-4">
                    {formatIsoStringAsLocalAmPm(
                      new Date(p.inTime).toISOString()
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {p.outTime
                      ? formatIsoStringAsLocalAmPm(
                          new Date(p.outTime).toISOString()
                        )
                      : "Still in session"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Responsive Pagination Controls --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          gap: 2,
        }}
      >
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="rows-per-page-label">Rows</InputLabel>
          <Select
            labelId="rows-per-page-label"
            value={rowsPerPage}
            label="Rows"
            onChange={handleRowsPerPageChange}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
          color="primary"
          // Add size="small" for a better mobile experience
          size={isSmallScreen ? "small" : "medium"}
        />
      </Box>
    </div>
  );
};

export default FilteredParticipantsTable;
