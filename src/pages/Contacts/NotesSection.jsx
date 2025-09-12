import { useEffect, useRef } from "react";
import OpenInNew from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router-dom";
import NoteItem from "../../components/NoteItem";

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
    <div className="border border-gray-300 rounded-lg shadow-sm w-full h-[45vh] flex flex-col overflow-hidden">
      <div className="border-b border-gray-300 px-4 py-2 flex justify-between items-center bg-gray-100">
        <span className="font-semibold text-gray-700">Notes</span>
        <IconButton
          onClick={() => navigate(`/particularContact/notes?email=${email}`)}
          size="small"
          title="View all notes"
        >
          <OpenInNew className="text-gray-600 w-5 h-5" />
        </IconButton>
      </div>

      {/* Scrollable note container with ref */}
      <div
        ref={scrollRef}
        className="overflow-y-auto space-y-2 px-4 py-3 scrollbar-thin flex-grow"
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
          <p className="text-gray-500 text-center mt-8">No notes yet.</p>
        )}
      </div>
    </div>
  );
};

export default NotesSection;
