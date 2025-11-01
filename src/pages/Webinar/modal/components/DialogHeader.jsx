import React from "react";

const DialogHeader = ({ title, description, onClose }) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
        {description && (
          <p className="text-slate-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Close dialog"
        type="button"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default DialogHeader;

