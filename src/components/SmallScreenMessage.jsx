import React from 'react';

const SmallScreenMessage = () => {
  return (
    <div className="md:hidden fixed inset-0 flex flex-col items-center justify-center bg-slate-100 p-4 z-[9999] text-center">
      <div className="space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto h-16 w-16 text-slate-500"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <h1 className="text-2xl font-semibold text-slate-800">
          Please Use a Larger Screen
        </h1>
        <p className="text-slate-600">
          This application is designed for an optimal experience on desktop or
          tablet devices in landscape mode.
        </p>
      </div>
    </div>
  );
};

export default SmallScreenMessage;