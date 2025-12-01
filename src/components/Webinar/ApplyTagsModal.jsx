import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { useSelector, useDispatch } from "react-redux";
import { getTagsData, setTagsData } from "../../features/slices/globalData";
import tagsService from "../../services/tagsService";
import { errorToast } from "../../utils/extra";

const ApplyTagsModal = ({
  onClose,
  onSubmit,
  isLoading: isApplyingTags,
}) => {
  const dispatch = useDispatch();
  const tagsData = useSelector(getTagsData);
  const [selectedTag, setSelectedTag] = useState("");

  useEffect(() => {
    // Fetch tags if not already loaded
    if (!tagsData || tagsData.length === 0) {
      tagsService.getTags().then((res) => {
        if (res.success) {
          dispatch(setTagsData(res.data));
        }
      });
    }
  }, [dispatch, tagsData]);

  const tagOptions = useMemo(
    () =>
      tagsData?.map((tag) => ({
        value: tag.name,
        label: tag.name,
      })) || [],
    [tagsData]
  );

  const handleSubmit = () => {
    if (!selectedTag) {
      errorToast("Please select a tag first.");
      return;
    }

    onSubmit(selectedTag);
  };

  const handleCancel = () => {
    setSelectedTag("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Apply Tag to Filtered Attendees</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Tag</label>
          <Select
            options={tagOptions}
            value={tagOptions?.find(
              (option) => option.value === selectedTag
            )}
            onChange={(option) => setSelectedTag(option?.value || "")}
            placeholder="Select a tag..."
            className="block w-full"
            menuPlacement="auto"
            styles={{
              control: (provided) => ({
                ...provided,
                border: "1px solid #D1D5DB",
                borderRadius: "0.375rem",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#6366F1",
                },
              }),
            }}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            disabled={isApplyingTags}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            disabled={isApplyingTags || !selectedTag}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            {isApplyingTags ? "Applying..." : "Apply Tag"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyTagsModal;

