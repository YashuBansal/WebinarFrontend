import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, PencilLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import useRoles from "../../hooks/useRoles";
import { useTheme } from "../../contexts/ThemeContext";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";
import { getNoticeBoard } from "../../features/actions/noticeBoard";
import { resetSuccessAndUpdate } from "../../features/slices/noticeBoard";
import "./tiptap.css"; // TipTap custom styles

const cardClass =
  "rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 sm:p-6";

const NoticeBoardPage = () => {
  const roles = useRoles();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const { noticeData } = useSelector((state) => state.noticeBoard);
  const { employeeModeData } = useSelector((state) => state.employee);
  const [tabValue, setTabValue] = useState("reminder");

  const editorContent =
    noticeData?.content || "<p>No notices available yet.</p>";
  const fetchData = useCallback(() => {
    if (roles.getRoleNameById(userData?.role) === "ADMIN") {
      dispatch(getNoticeBoard(tabValue));
    } else if (roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES") {
      dispatch(getNoticeBoard("sales"));
    } else if (roles.getRoleNameById(userData?.role) === "EMPLOYEE REMINDER") {
      dispatch(getNoticeBoard("reminder"));
    }
  }, [dispatch, tabValue, userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, dispatch]);

  useLayoutEffect(() => {
    dispatch(resetSuccessAndUpdate());
  }, [dispatch]);

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <HubSubpageShell
      showBack={false}
      maxWidthClass="max-w-5xl"
      contentClassName="space-y-6 transition-all duration-300"
    >
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: isDark ? "#f8fafc" : "#071028" }}
          >
            Notice board
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Team announcements and important updates for your workspace.
          </p>
        </div>
        <ComponentGuard
          allowedRoles={[roles.ADMIN]}
          conditions={[userData?.isActive, employeeModeData ? false : true]}
        >
          <button
            type="button"
            onClick={() => navigate("/notice-board/update?type=" + tabValue)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: !isDark ? "#22B573" : "#22B573",
              color: "#ffffff",
              border: "none",
              boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
            }}
          >
            <PencilLine className="h-4 w-4" />
            Update notice
          </button>
        </ComponentGuard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className="mb-2 flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/90 p-4 dark:border-blue-500/25 dark:bg-blue-950/30 sm:items-center sm:gap-4"
      >
        <BellRing className="mt-0.5 shrink-0 text-blue-500 sm:mt-0" size={20} />
        <div className="space-y-1 text-xs font-semibold leading-relaxed text-blue-800 dark:text-blue-200/90">
          <p>
            Keep this board updated so your sales and reminder teams always see
            the latest instructions.
          </p>
        </div>
      </motion.div>

      <ComponentGuard allowedRoles={[roles.ADMIN]}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cardClass}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Notice Type
            </span>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={(event) => handleTabChange(event, "reminder")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tabValue === "reminder"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Reminder
              </button>
              <button
                type="button"
                onClick={(event) => handleTabChange(event, "sales")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tabValue === "sales"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Sales
              </button>
            </div>
          </div>
        </motion.div>
      </ComponentGuard>

      <motion.section
        key={tabValue}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cardClass}
      >
        <div className="mb-5 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Latest notice
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/80">
          <div className="preview-content bg-white/70 p-5 text-slate-700 dark:bg-slate-900/30 dark:text-slate-200 sm:p-6">
            <div
              className="preview-content prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: editorContent }}
            />
          </div>
        </div>
      </motion.section>
    </HubSubpageShell>
  );
};

export default NoticeBoardPage;
