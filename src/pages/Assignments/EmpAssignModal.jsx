import useMediaQuery from "../../hooks/useMediaQuery"; // Assuming you have a media query hook

// --- You can place the helper components here or import them ---
const StatRow = ({ label, value, valueClassName = "" }) => (
  <div className="flex items-center justify-between">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-sm font-medium text-gray-800 ${valueClassName}`}>
      {value}
    </p>
  </div>
);

const EmployeeStatCard = ({ entry }) => {
  const pendingCount = entry.count - entry.completed;
  const completionRate = (entry.completed / entry.count) * 100 || 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 border-b border-gray-100 pb-3">
        <p className="font-semibold text-gray-900">{entry.userName}</p>
      </div>
      <div className="space-y-3">
        <StatRow label="Total Assigned" value={entry.count} />
        <StatRow label="Completed" value={entry.completed} valueClassName="text-green-600" />
        <StatRow label="Pending" value={pendingCount} valueClassName="text-amber-600" />
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-sm font-medium text-gray-800">{completionRate.toFixed(1)}%</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${completionRate}%` }}/>
          </div>
        </div>
      </div>
    </div>
  );
};


const EmpAssignModal = ({ selectedData, setSelectedData }) => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  // --- BUG FIX: Validate data before rendering ---
  const isValidData = Array.isArray(selectedData?.data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-indigo-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Assignment Details</h2>
          <button
            onClick={() => setSelectedData(null)}
            className="text-indigo-100 transition-colors hover:text-white"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* --- Make the content area scrollable for long lists --- */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {!isValidData ? (
            // --- BUG FIX: Render an error message instead of crashing ---
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-200 bg-red-50 text-center">
              <p className="font-semibold text-red-700">Invalid Data</p>
              <p className="text-sm text-red-600">Could not display assignment details.</p>
            </div>
          ) : isSmallScreen ? (
            // --- RESPONSIVE: Card View for Small Screens ---
            <div className="space-y-4">
              {selectedData.data.map((entry) => (
                <EmployeeStatCard
                  key={entry.userName} // Use a unique ID like userName or userId if possible
                  entry={entry}
                />
              ))}
            </div>
          ) : (
            // --- Original Table View for Larger Screens ---
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Completed</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Pending</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {selectedData.data.map((entry) => (
                    <tr key={entry.userName} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900">{entry.userName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-600">{entry.count}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-green-600">{entry.completed}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-amber-600">{entry.count - entry.completed}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm">{((entry.completed / entry.count) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmpAssignModal;