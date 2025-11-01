import React from "react";

const LoadingSpinner = ({ size = "large" }) => {
  const sizeClasses = {
    small: "h-6 w-6 border-b-2",
    medium: "h-8 w-8 border-b-2",
    large: "h-12 w-12 border-b-2",
  };

  return (
    <div className="flex items-center justify-center py-20">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-indigo-600`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;

