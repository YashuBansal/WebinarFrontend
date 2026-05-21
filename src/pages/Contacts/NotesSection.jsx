import { useEffect, useRef } from "react";
import { ExternalLink, MessageSquareText, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NoteItem from "../../components/NoteItem";
import { motion } from "framer-motion";

const NotesSection = (props) => {
  const navigate = useNavigate();
  const { email, noteData, setNoteModalData, roles } = props;

  // Ref for the scrollable div
  const scrollRef = useRef(null);

  // Scroll to bottom when noteData updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [noteData]);

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm w-full flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <MessageSquareText className="w-4 h-4 text-grey-500 dark:text-grey-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">History</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Chronological</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/particularContact/notes?email=${email}`)}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors group"
          title="View all"
        >
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#FF6B35]" />
        </button>
      </div>

      {/* Scrollable note container */}
      <div
        ref={scrollRef}
        className="overflow-y-auto space-y-3 px-4 py-4 scrollbar-thin flex-grow custom-scrollbar"
      >
        {Array.isArray(noteData) && noteData.length > 0 ? (
          [...noteData].reverse().map((item, index) => (
            <NoteItem
              key={item._id || index}
              index={index + 1}
              item={item}
              setNoteModalData={setNoteModalData}
              roles={roles}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full py-8 text-slate-400 space-y-2"
          >
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full">
              <History className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-xs font-bold text-slate-400 italic">No notes yet</p>
          </motion.div>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 text-[8px] font-black text-slate-300 text-center uppercase tracking-[0.2em]">
        End of activity
      </div>
    </div>
  );
};

export default NotesSection;
