import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  createCustomOption,
  deleteCustomOption,
  getCustomOptions,
} from "../../../features/actions/globalData";

// MUI Components
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// Local Components & Hooks
import useRoles from "../../../hooks/useRoles";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import useMediaQuery from "../../../hooks/useMediaQuery";
import DeleteIcon from "../../../components/SVGs/red-bin.svg";
import { globalButton } from "../../../utils/style";


// A new component for displaying an option on small screens
const OptionCard = ({ option, index, onDelete }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-sm font-mono text-gray-600">
            #{index + 1}
          </span>
          <p className="font-semibold text-gray-800">{option.label}</p>
        </div>
        <button
          onClick={() => onDelete(option)}
          className="rounded-full p-2 transition-colors hover:bg-red-50"
          title="Delete Option"
        >
          <img src={DeleteIcon} alt="Delete" className="h-6 w-6" />
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Required:</span>
          <span className="font-medium text-gray-900">
            {option.isWorked ? "No" : "Yes"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Invalid Phone:</span>
          <span className="font-medium text-gray-900">
            {option.isInvalid ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  );
};


const CustomOptions = () => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();

  const { customOptions, isSuccess, isLoading } = useSelector(
    (state) => state.globalData
  );
  const { userData } = useSelector((state) => state.auth);
  const role = userData?.role || "";
  const pageTitle = roles.SUPER_ADMIN === role ? "Default" : "Custom";

  const customOptionsData = (
    Array.isArray(customOptions) ? customOptions : []
  ).filter((option) => roles.SUPER_ADMIN === role || !option?.isDefault);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOptionId, setDeleteOptionId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Use the media query hook you already have
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const handleModalToggle = () => setShowModal(!showModal);
  const handleDeleteModalToggle = () => setShowDeleteModal(!showDeleteModal);

  const handleDeleteClick = (option) => {
    setDeleteOptionId(option);
    setShowDeleteModal(true);
  };

  const onSubmit = (data) => {
    // Simplified boolean conversion
    const payload = {
      ...data,
      isWorked: data.isWorked === 'true',
      isInvalid: data.isInvalid === 'true'
    };

    dispatch(createCustomOption(payload));
    logUserActivity({
      action: "create",
      type: `${pageTitle} Option`,
      detailItem: data?.label,
    });
  };

  const confirmDelete = () => {
    if (deleteOptionId) {
      dispatch(deleteCustomOption(deleteOptionId?._id));
      logUserActivity({
        action: "delete",
        type: `${pageTitle} Option`,
        detailItem: deleteOptionId?.label,
      });
      setDeleteOptionId(null);
    }
    setShowDeleteModal(false);
  };

  useEffect(() => {
    dispatch(getCustomOptions());
  }, []);

  useEffect(() => {
    if (isSuccess) {
      setShowModal(false);
      reset();
      dispatch(getCustomOptions());
    }
  }, [isSuccess, dispatch, reset]);

  return (
    <div className="container mx-auto mt-10 p-4">
      {/* --- RESPONSIVE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6">
        <h1 className="text-2xl font-bold">{pageTitle} Options</h1>
        <ComponentGuard conditions={[userData?.isActive]}>
          <button className={globalButton} onClick={handleModalToggle}>
            Add {pageTitle} Option
          </button>
        </ComponentGuard>
      </div>

      {/* --- RESPONSIVE DATA DISPLAY --- */}
      {isSmallScreen ? (
        // --- CARD VIEW for Small Screens ---
        <div className="space-y-4">
          {customOptionsData.map((option, index) => (
            <OptionCard
              key={option._id} // Use a stable ID for the key
              option={option}
              index={index}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        // --- TABLE VIEW for Larger Screens ---
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 bg-white">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Label</th>
                <th className="p-4 text-left">Required</th>
                <th className="p-4 text-left">Invalid Phone</th>
                <th className="p-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {customOptionsData?.map((option, index) => (
                <tr key={option._id} className="border-b">
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{option.label}</td>
                  <td className="p-4">{option.isWorked ? "No" : "Yes"}</td>
                  <td className="p-4">{option.isInvalid ? "Yes" : "No"}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteClick(option)}
                      className="rounded-full p-2 hover:bg-neutral-200"
                    >
                      <img src={DeleteIcon} alt="Delete" className="h-6 w-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- RESPONSIVE MODAL for Adding --- */}
      <Modal open={showModal} onClose={handleModalToggle} className="flex items-center justify-center">
        {/* Added w-full, max-w-md, and mx-4 for responsiveness */}
        <div className="w-full max-w-md mx-4 rounded bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Add {pageTitle} Option</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4 space-y-4">
              <TextField
                label="Label" variant="outlined" fullWidth
                {...register("label", { required: "Label is required" })}
                error={!!errors.label} helperText={errors.label?.message}
              />
              <div>
                <label className="mb-1 block text-sm font-medium">Required</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="radio" value={false} defaultChecked {...register("isWorked")} />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" value={true} {...register("isWorked")} />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Invalid Phone</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="radio" value={true} {...register("isInvalid")} />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" value={false} defaultChecked {...register("isInvalid")} />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outlined" onClick={handleModalToggle}>Cancel</Button>
              <button className={globalButton} type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Option"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* --- RESPONSIVE MODAL for Deleting --- */}
      <Modal open={showDeleteModal} onClose={handleDeleteModalToggle} className="flex items-center justify-center">
         {/* Added w-full, max-w-md, and mx-4 for responsiveness */}
        <div className="w-full max-w-md mx-4 rounded bg-white p-6 shadow-lg">
          <Typography className="mb-4 text-lg font-medium">
            Are you sure you want to delete this option?
          </Typography>
          <Typography sx={{ my: 2 }} className="text-sm text-gray-600">
            If you delete this option, you will no longer be able to use it. This action is irreversible.
          </Typography>
          <div className="flex justify-end space-x-4">
            <Button variant="outlined" onClick={handleDeleteModalToggle}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomOptions;