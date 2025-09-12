import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@mui/material";
import { useSelector } from "react-redux";
import UploadCsvModal from "./UploadCsvModal";
import UploadXslxModal from "./UploadXslxModal";

const UpdateCsvXslxModal = ({ setModal, tabValue }) => {
  const [showModal, setShowModal] = useState(false);
  const [showXslxModal, setShowXslxModal] = useState(false);
  const handleModal = () => setShowModal(true);
  const handleXslxModal = () => setShowXslxModal(true);

  const { isImporting } = useSelector((state) => state.attendee);

  useEffect(() => {
    if (isImporting) {
      setModal(false);
    }
  }, [isImporting, setModal]);

  return (
    // Backdrop: Added padding for small screens so the modal doesn't touch the edges.
    <div
      className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-300/20 p-4 backdrop-blur-sm"
      aria-labelledby="header-3a content-3a"
      aria-modal="true"
      tabIndex="-1"
      role="dialog"
    >
      {/* Modal Container: Controls the width and padding responsively. */}
      <div
        className="flex w-full max-w-md flex-col items-center rounded-lg bg-white p-6 shadow-xl"
        id="modal"
        role="document"
      >
        {/* Button Container: Stacks buttons vertically on mobile and horizontally on larger screens. */}
        <div className="my-6 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <Button
            variant="contained"
            onClick={handleXslxModal}
            // Buttons take full width on mobile for better touch targets.
            className="w-full sm:w-auto"
          >
            Upload XSLX File
          </Button>
          <Button
            variant="contained"
            onClick={handleModal}
            className="w-full sm:w-auto"
          >
            Upload CSV File
          </Button>
        </div>

        {/* Close button gets a bit of margin top for spacing */}
        <Button
          variant="outlined"
          onClick={() => setModal(false)}
          className="mt-2 w-full hover:text-red-600 sm:w-auto"
          aria-label="close dialog"
        >
          Close
        </Button>
      </div>

      {showModal &&
        createPortal(
          <UploadCsvModal tabValue={tabValue} setModal={setShowModal} />,
          document.body
        )}
      {showXslxModal &&
        createPortal(
          <UploadXslxModal tabValue={tabValue} setModal={setShowXslxModal} />,
          document.body
        )}
    </div>
  );
};

export default UpdateCsvXslxModal;