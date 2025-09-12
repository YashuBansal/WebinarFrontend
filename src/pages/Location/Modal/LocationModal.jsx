import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import * as XLSX from "xlsx";
import { addLocations } from "../../../features/actions/location";

const LocationModal = ({ setShowLocationModal, isLoading, isSuccess }) => {
  const [locationData, setLocationData] = useState([]);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length >= 1) {
        // Take the row at index (filterRow - 1) as the header
        const headers = jsonData[0];

        const locationIndex = headers.findIndex(
          (header) => header.toLowerCase() === "locations"
        );
        // Extract data starting from the row after the header

        // const formattedData = jsonData.slice(1).map((row) => {
        //   const obj = {};
        //   headers.forEach((header, index) => {
        //     obj[header] = row[index];
        //   });
        //   return obj;
        // });
        const formattedData = jsonData
          .slice(1)
          .map((row) => (locationIndex !== -1 ? row[locationIndex] : ""))
          .filter((location) => location);

        console.log(formattedData);

        setLocationData(formattedData);
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    console.log(locationData);
  }, [locationData]);

  return (
    <div className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-300/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Import Locations</h2>
          <button
            onClick={() => setShowLocationModal(false)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>

        {/* Upload section */}
        {locationData.length === 0 && (
          <div className="mb-6 border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
            <label
              htmlFor="file"
              className="cursor-pointer block text-indigo-600 font-medium"
            >
              Click to upload or drag and drop a `.xlsx` file
            </label>
            <input
              id="file"
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
        {error && (
          <div className="text-red-500 bg-red-100 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Data display */}
        {locationData.length > 0 && (
          <div className="overflow-auto max-h-[400px] border rounded-lg">
            <table className="min-w-full table-auto border-collapse text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border px-4 py-2 text-left font-semibold">
                    Locations
                  </th>
                </tr>
              </thead>
              <tbody>
                {locationData.map((location, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {locationData.length > 0 && (
          <div className="flex justify-end mt-4 gap-4">
            <button
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
              onClick={() => {
               
                console.log("Reset clicked");
                setLocationData([]);  
              }}
            >
              {isLoading ? "Refreshing..." : "Reset"}
            </button>
            <button
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
              onClick={() => {
                // api call implementation
                console.log("Submit button clicked, data:", locationData);
                dispatch(addLocations({
                  locations: locationData
                }))
              }}
            >
              {isLoading ? "Loading..." : "Import"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationModal;
