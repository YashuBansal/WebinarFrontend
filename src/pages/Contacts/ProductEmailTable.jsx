import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEnrollmentsByEmail } from "../../features/actions/product";
import {
  formatDateAsNumber,
  formatDateAsNumberWithTime,
  capitalizeWords,
} from "../../utils/extra";
import useMediaQuery from "../../hooks/useMediaQuery"; // Assuming you have this hook

const StatRow = ({ label, value, valueClassName = "text-gray-800" }) => (
  <div className="flex justify-between border-t border-gray-100 py-2">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className={`text-sm font-medium text-right ${valueClassName}`}>{value}</dd>
  </div>
);

// A clean, reusable function to format the 'Assigned By' string
const formatAssignedBy = (item) => {
  if (!item.assignedBy) return "N/A";
  
  const role = item.userRole 
    ? capitalizeWords(item.userRole.split("_").join(" ")) 
    : "N/A";
    
  return `${capitalizeWords(item.assignedBy)} (${role})`;
};


const ProductEmailTable = ({ email }) => {
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery("(max-width: 1024px)"); // Use a wider breakpoint for this many columns

  const { enrollmentsByEmail = [], isLoading } = useSelector(
    (state) => state.product
  );

  useEffect(() => {
    if (email) {
      dispatch(getEnrollmentsByEmail({ email }));
    }
  }, [dispatch, email]);

  const hasNoData = !isLoading && enrollmentsByEmail.length === 0;

  return (
    <div className="mt-6">
      {isLoading ? (
        <div className="p-10 text-center text-gray-500">Loading enrollments...</div>
      ) : hasNoData ? (
        <div className="p-10 text-center text-gray-500">No enrollments found.</div>
      ) : isSmallScreen ? (
        // --- CARD VIEW for Small Screens ---
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {enrollmentsByEmail.map((item, idx) => (
                <EnrollmentCard key={item._id} item={item} index={idx} />
            ))}
        </div>
      ) : (
        // --- TABLE VIEW for Larger Screens ---
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full table-auto text-sm text-center whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="py-3 px-2">S No.</th>
                <th className="py-3 px-4 text-left">Webinar</th>
                <th className="py-3 px-2">Webinar Date</th>
                <th className="py-3 px-4 text-left">Product Name</th>
                <th className="py-3 px-2">Level</th>
                <th className="py-3 px-2">Price</th>
                <th className="py-3 px-2">Enrollment Date</th>
                <th className="py-3 px-2">Assign Type</th>
                <th className="py-3 px-4 text-left">Assigned By</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 divide-y">
              {enrollmentsByEmail.map((item, idx) => (
                <tr key={item._id}>
                  <td className="px-2 py-4">{idx + 1}</td>
                  <td className="px-4 py-4 text-left">{capitalizeWords(item.webinarName) || "N/A"}</td>
                  <td className="px-2 py-4">{item.webinarDate ? formatDateAsNumber(item.webinarDate) : "N/A"}</td>
                  <td className="px-4 py-4 text-left">{capitalizeWords(item.productName) || "N/A"}</td>
                  <td className="px-2 py-4 capitalize">{capitalizeWords(item.productLevel) || "N/A"}</td>
                  <td className="px-2 py-4">₹{item.productPrice || 0}</td>
                  <td className="px-2 py-4">{item.enrollmentDate ? formatDateAsNumberWithTime(item.enrollmentDate) : "N/A"}</td>
                  <td className="px-2 py-4 capitalize">{capitalizeWords(item.assignType) || "N/A"}</td>
                  <td className="px-4 py-4 capitalize text-left">
                    {/* Using the clean helper function */}
                    {formatAssignedBy(item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductEmailTable;

// --- Corrected and Improved EnrollmentCard ---
const EnrollmentCard = ({ item, index }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b pb-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900">
            <span className="font-mono text-gray-400 mr-2">#{index + 1}</span>
            {capitalizeWords(item.productName)}
          </p>
          <p className="text-sm text-gray-500">
            Date: {formatDateAsNumberWithTime(item.enrollmentDate)}
          </p>
        </div>
        <div className="flex-shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
          ₹{item.productPrice || 0}
        </div>
      </div>

      <dl className="space-y-1">
        <StatRow label="Product Level" value={capitalizeWords(item.productLevel) || "N/A"} />
        <StatRow label="Webinar Name" value={item.webinarName} />
        <StatRow label="Webinar Date" value={item.webinarDate ? formatDateAsNumber(item.webinarDate) : "N/A"} />
        <StatRow label="Assign Type" value={capitalizeWords(item.assignType) || "N/A"} />
        <StatRow 
          label="Assigned By" 
          // Using the clean helper function
          value={formatAssignedBy(item)} 
        />
      </dl>
    </div>
  );
};