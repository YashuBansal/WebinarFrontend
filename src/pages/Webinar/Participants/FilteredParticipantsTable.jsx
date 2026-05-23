import React, { useState, useMemo } from "react";
import { formatIsoStringAsLocalAmPm } from "../../../utils/extra";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { 
  Pagination, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid 
} from "@mui/material";
import { Clock, Phone, Mail, User, Info, ArrowUpDown, ChevronDown } from "lucide-react";

// Helper to generate dynamic colored avatars based on name
const getAvatarColors = (name) => {
  const colors = [
    { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
    { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
    { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400" },
    { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-600 dark:text-sky-400" },
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

const ParticipantCard = ({ participant, index }) => {
  const fullName =
    `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
    "N/A";
  
  const initials = fullName !== "N/A" 
    ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const colors = getAvatarColors(fullName);

  return (
    <div className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-200/40 dark:border-slate-800/30 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${colors.bg} ${colors.text}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 font-mono">#{index}</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">
              {fullName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 truncate">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{participant.email || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{participant.phone || "N/A"}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Session</span>
          <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{participant.timeDifference ? `${participant.timeDifference} min` : "N/A"}</span>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3 mt-1 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400">In Time</span>
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              {formatIsoStringAsLocalAmPm(new Date(participant.inTime).toISOString())}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400">Out Time</span>
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              {participant.outTime ? (
                formatIsoStringAsLocalAmPm(new Date(participant.outTime).toISOString())
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilteredParticipantsTable = ({ participants }) => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

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
      <div className="mt-8 py-12 px-6 flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/40 dark:border-slate-800/30 text-slate-400">
        <Info className="h-6 w-6 text-slate-300" />
        <p className="text-sm font-semibold">No participants in the selected range.</p>
        <p className="text-xs text-slate-400 max-w-[280px] text-center">Zoom or pan the chart timeline to refresh results.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col">
      {/* Sorting / Controls Area */}
      <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown className="h-4 w-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sort Participants</span>
        </div>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-by-label" sx={{ fontSize: "12px" }}>Sort Field</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortConfig.key}
                label="Sort Field"
                onChange={handleSortKeyChange}
                sx={{ 
                  borderRadius: "12px", 
                  fontSize: "12px", 
                  fontWeight: 500,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(226, 232, 240, 0.8)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6366f1",
                  }
                }}
              >
                <MenuItem value="email" sx={{ fontSize: "12px" }}>Email Address</MenuItem>
                <MenuItem value="phone" sx={{ fontSize: "12px" }}>Phone Number</MenuItem>
                <MenuItem value="timeDifference" sx={{ fontSize: "12px" }}>Session Duration</MenuItem>
                <MenuItem value="firstName" sx={{ fontSize: "12px" }}>First Name</MenuItem>
                <MenuItem value="lastName" sx={{ fontSize: "12px" }}>Last Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-direction-label" sx={{ fontSize: "12px" }}>Direction</InputLabel>
              <Select
                labelId="sort-direction-label"
                value={sortConfig.direction}
                label="Direction"
                onChange={handleSortDirectionChange}
                sx={{ 
                  borderRadius: "12px", 
                  fontSize: "12px", 
                  fontWeight: 500,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(226, 232, 240, 0.8)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6366f1",
                  }
                }}
              >
                <MenuItem value="ascending" sx={{ fontSize: "12px" }}>Ascending Order (A - Z)</MenuItem>
                <MenuItem value="descending" sx={{ fontSize: "12px" }}>Descending Order (Z - A)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </div>

      {/* Conditional Rendering: Tables vs Cards */}
      {isSmallScreen ? (
        <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {currentParticipants.map((p, index) => (
            <ParticipantCard
              key={p._id}
              participant={p}
              index={indexOfFirstRow + index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[60vh] rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap bg-white/40 dark:bg-transparent">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Session</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">In Time</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Out Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/10 dark:bg-transparent">
              {currentParticipants.map((p, index) => {
                const nameStr = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "N/A";
                const initials = nameStr !== "N/A"
                  ? nameStr.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?";
                const colors = getAvatarColors(nameStr);

                return (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors group">
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-400">
                      {indexOfFirstRow + index + 1}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${colors.bg} ${colors.text}`}>
                          {initials}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {nameStr}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {p.email || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {p.phone || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        {p.timeDifference ? `${p.timeDifference} mins` : "0 mins"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatIsoStringAsLocalAmPm(new Date(p.inTime).toISOString())}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {p.outTime ? (
                        formatIsoStringAsLocalAmPm(new Date(p.outTime).toISOString())
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          py: 3,
          gap: 2,
        }}
      >
        <FormControl sx={{ minWidth: 100 }} size="small">
          <InputLabel id="rows-per-page-label" sx={{ fontSize: "12px" }}>Rows</InputLabel>
          <Select
            labelId="rows-per-page-label"
            value={rowsPerPage}
            label="Rows"
            onChange={handleRowsPerPageChange}
            sx={{
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 600,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(226, 232, 240, 0.8)",
              },
            }}
          >
            <MenuItem value={10} sx={{ fontSize: "12px" }}>10 Rows</MenuItem>
            <MenuItem value={25} sx={{ fontSize: "12px" }}>25 Rows</MenuItem>
            <MenuItem value={50} sx={{ fontSize: "12px" }}>50 Rows</MenuItem>
            <MenuItem value={100} sx={{ fontSize: "12px" }}>100 Rows</MenuItem>
          </Select>
        </FormControl>
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
          color="primary"
          size={isSmallScreen ? "small" : "medium"}
          sx={{
            "& .MuiPaginationItem-root": {
              borderRadius: "10px",
              fontWeight: 600,
              borderColor: "rgba(226, 232, 240, 0.8)",
              "&.Mui-selected": {
                backgroundColor: "#6366f1",
                color: "#ffffff",
                borderColor: "#6366f1",
                "&:hover": {
                  backgroundColor: "#4f46e5",
                }
              }
            }
          }}
        />
      </Box>
    </div>
  );
};

export default FilteredParticipantsTable;
