import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoteItem from "../../components/NoteItem";
import ViewFullDetailsModal from "./Modal/ViewFullDetailModal";
import { getNotes } from "../../features/actions/assign";
import { useNavigate } from "react-router-dom";
import useRoles from "../../hooks/useRoles";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  StickyNote,
  Search,
  Filter,
  History,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";

// ─── Stat Badge ────────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, accent, icon: Icon }) => (
  <div
    className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl border min-w-[110px]"
    style={{
      background: accent + "18",
      borderColor: accent + "33",
    }}
  >
    <div className="flex items-center gap-1.5 mb-0.5">
      {Icon && <Icon className="w-3.5 h-3.5" style={{ color: accent }} />}
      <span
        className="text-[10px] font-black uppercase tracking-widest"
        style={{ color: accent }}
      >
        {label}
      </span>
    </div>
    <span className="text-2xl font-black" style={{ color: accent }}>
      {value}
    </span>
  </div>
);

// ─── Header ─────────────────────────────────────────────────────────────────────
const NotesHeader = ({ count, isDark }) => {
  const navigate = useNavigate();
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 border-b"
      style={{ borderColor: isDark ? "#1e293b" : "#f1f5f9" }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95"
          style={{
            background: isDark ? "#1e293b" : "#f8fafc",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            color: isDark ? "#94a3b8" : "#64748b",
          }}
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "rgba(255,107,53,0.12)" }}
          >
            <StickyNote className="w-5 h-5" style={{ color: "#FF6B35" }} />
          </div>
          <div>
            <h1
              className="text-lg font-black"
              style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
            >
              Interaction Notes
            </h1>
            <p
              className="text-[11px] font-medium"
              style={{ color: isDark ? "#64748b" : "#94a3b8" }}
            >
              Detailed logs of user interactions and follow-ups
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <StatBadge
          label="Total Notes"
          value={count}
          accent="#FF6B35"
          icon={MessageSquare}
        />
      </div>
    </div>
  );
};

const NotesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email") || "";
  const { noteData } = useSelector((state) => state.assign);
  const [noteModalData, setNoteModalData] = useState(null);

  useEffect(() => {
    if (email) {
      dispatch(getNotes({ email }));
    }
    // Scroll to top when page opens
    const el = document.querySelector(".custom-scrollbar.absolute");
    if (el) {
      el.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [email, dispatch]);

  const filteredNotes = useMemo(() => {
    if (!Array.isArray(noteData)) return [];
    return [...noteData]; 
  }, [noteData]);

  return (
    <div
      className="min-h-0"
      style={{ background: isDark ? "#0f172a" : "#f8fafc" }}
    >
      <div className="px-4 sm:px-6 lg:px-10 py-4 max-w-screen-2xl mx-auto space-y-6">
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border overflow-hidden"
          style={{
            background: isDark
              ? "rgba(15,23,42,0.8)"
              : "rgba(255,255,255,0.85)",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
            backdropFilter: "blur(20px)",
            boxShadow: isDark
              ? "0 0 0 1px rgba(255,255,255,0.03)"
              : "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          <NotesHeader count={noteData?.length || 0} isDark={isDark} />

          <div className="p-4 sm:p-6 h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {filteredNotes.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: "rgba(255,107,53,0.08)" }}
                  >
                    <StickyNote
                      className="w-12 h-12"
                      style={{ color: "#FF6B3530" }}
                    />
                  </div>
                  <p
                    className="text-base font-bold italic"
                    style={{ color: isDark ? "#334155" : "#cbd5e1" }}
                  >
                    No interaction notes found
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  {filteredNotes.map((item, index) => (
                    <NoteItem
                      key={item._id || index}
                      index={index + 1}
                      item={item}
                      setNoteModalData={setNoteModalData}
                      roles={roles}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {noteModalData && (
        <ViewFullDetailsModal
          modalData={noteModalData}
          setModalData={setNoteModalData}
        />
      )}
    </div>
  );
};

export default NotesPage;
