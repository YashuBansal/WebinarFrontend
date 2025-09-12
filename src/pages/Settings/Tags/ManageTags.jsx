import React, { useCallback, useEffect, useState } from "react";
import tagsService from "../../../services/tagsService";
import AddEditTagsModal from "./AddEditTagsModal";
import { formatDateAsNumberWithTime } from "../../../utils/extra";
import { setTagsData } from "../../../features/slices/globalData";
import { useDispatch } from "react-redux";

const ManageTags = () => {
  const dispatch = useDispatch();

  const [tags, setTags] = useState([]);
  const [modal, setModal] = useState(false);
  const [invalidTags, setInvalidTags] = useState([]); // This will be an array of strings

  const fetchTags = useCallback(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        setTags(res.data);
        dispatch(setTagsData(res.data));
      }
    });

    tagsService.getInvalidTags().then((res) => {
      if (res.success) {
        setInvalidTags(res.data);
      }
    });
  }, [dispatch]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return (
    <div className=" w-full pt-14 px-2 py-6 md:p-6">
      <div className="px-2 py-6 md:p-6 bg-gray-50  rounded-lg">
        <div className="flex gap-4 mb-8 justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-700">Manage Tags</h2>
          <div>
            <button
              className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-all"
              onClick={() => setModal(true)}
            >
              Add Tag
            </button>
          </div>
        </div>

        {invalidTags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-600 mb-4">
              Invalid Tags
            </h3>
            <div className="flex flex-wrap gap-3 border p-4 rounded-md">
              {invalidTags.map((tag) => (
                <span className="px-4 py-1 bg-red-300 text-gray-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-xl font-semibold text-gray-600 mb-4">
          Official Tag List
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  S.No
                </th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag, index) => (
                <tr
                  key={tag._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {tag.name}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDateAsNumberWithTime(tag.createdAt)}
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    No official tags have been created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <AddEditTagsModal setModal={setModal} fetchTags={fetchTags} />}
    </div>
  );
};

export default ManageTags;
