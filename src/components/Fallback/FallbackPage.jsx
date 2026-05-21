import React from "react";
import AppLoader from "../AppLoader";

const FallbackPage = () => {
  return (
    <div className="w-full sm:ps-48 border h-screen flex justify-center items-center">
      <div className="flex flex-col items-center">
        <AppLoader size="lg" />
        <h2 className="mt-4 text-lg font-semibold text-gray-700">
          Loading, please wait...
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          We are preparing everything for you.
        </p>
      </div>
    </div>
  );
};

export default FallbackPage;
