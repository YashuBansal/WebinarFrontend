import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoteItem from "../../components/NoteItem";
import ViewFullDetailsModal from "./Modal/ViewFullDetailModal";
import { getNotes } from "../../features/actions/assign";
import { useNavigate, useParams } from "react-router-dom";
import useRoles from "../../hooks/useRoles";
import { Button } from "@mui/material";

const NotesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email") || "";
  const { noteData } = useSelector((state) => state.assign);
  const [noteModalData, setNoteModalData] = useState(null);
  const bottomRef = useRef(null); // <-- ref for scrolling

  useEffect(() => {
    if (email) dispatch(getNotes({ email }));
  }, []);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [noteData]);

  return (
    <div className="px-6 md:px-10 pt-14 space-y-6">
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="flex gap-4 justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Notes</h2>

          <Button onClick={() => navigate(-1)} variant="contained">
            Back
          </Button>
        </div>
        <div className="grid lg:grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto">
          {Array.isArray(noteData) &&
            [...noteData].reverse().map((item, index) => (
              <NoteItem
                key={index}
                index={index + 1}
                item={item}
                setNoteModalData={setNoteModalData}
                roles={roles}
              />
            ))}
          <div ref={bottomRef} />
        </div>
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
