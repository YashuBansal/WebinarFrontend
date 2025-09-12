import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import EditIcon from "@mui/icons-material/Edit";
import Delete from "../../components/ConfirmDeleteModal";
import productLevelService from "../../services/productLevelService";
import { successToast } from "../../utils/extra";
import FormInput from "../../components/FormInput";
import { globalButton } from "../../utils/style";
const LeadTypesForm = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useSelector((state) => state.auth);

  const [productLevelData, setProductLevelData] = useState([]);

  useEffect(() => {
    productLevelService.getProductLevels().then((res) => {
      if (res.success) {
        setProductLevelData(res.data);
      }
    });
  }, []);

  const { handleSubmit, control, reset, watch, register, errors } = useForm({
    defaultValues: {
      label: "",
      color: "#000000",
    },
  });
  const [deleteModal, setdeleteModal] = useState(false);

  const openModal = (data = null) => {
    setEditData(data);
    reset(data || { label: "", level: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    reset();
  };

  const onSubmit = (data) => {
    console.log(data);
    if (editData) {
      productLevelService.updateProductLevel(editData._id, data).then((res) => {
        if (res.success) {
          successToast(res.message);
          closeModal();
          setProductLevelData((prev) =>
            prev.map((item) => (item._id === editData._id ? res.data : item))
          );
        }
      });
    } else {
      productLevelService.createProductLevel(data).then((res) => {
        if (res.success) {
          successToast(res.message);
          closeModal();
          setProductLevelData([...productLevelData, res.data]);
        }
      });
    }
  };

  const handleDelete = () => {};

  useEffect(() => {}, []);

  return (
    <>
      <div className="pt-14 flex flex-col items-center space-y-8">
        {/* Header with Add Button */}
        <div className="w-full px-4 lg:px-8 flex justify-between items-center flex-col md:flex-row gap-4">
          <h2 className="text-2xl font-bold text-gray-700">
            Manage Product Levels
          </h2>

          {userData?.isActive && (
            <button
           className={globalButton}
              onClick={() => openModal()}
            >
              Add Product Level
            </button>
          )}
        </div>

        {/* Lead Types Table */}
        <div className="w-full px-4 lg:px-8">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Label</TableCell>
                <TableCell>Level</TableCell>
                {userData?.isActive && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {productLevelData.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>
                    {userData?.isActive && (
                      <>
                        <IconButton
                          onClick={() => openModal(item)}
                          color="primary"
                          aria-label="edit"
                        >
                          <EditIcon />
                        </IconButton>
                        {/* <IconButton
                          onClick={() => {
                            setisId(item._id);
                            setdeleteModal(true);
                          }}
                          color="secondary"
                          aria-label="delete"
                        >
                          <DeleteIcon />
                        </IconButton> */}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Modal for Add/Update */}
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          aria-labelledby="add-update-leadtype-modal"
        >
          <Box className="p-6 bg-white rounded-lg shadow-md space-y-6 w-full max-w-md mx-auto mt-20">
            <h3 className="text-xl font-bold text-gray-700">
              {editData ? "Update Product Level" : "Add Product Level"}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <TextField
                fullWidth
                name="level"
                label="Level"
                variant="outlined"
                {...register("level", {
                  required: "Level is required",
                  min: 0,
                  valueAsNumber: true
                })}
                error={!!errors?.level}
                helperText={errors?.level?.message}
              />

              <TextField
                fullWidth
                name="label"
                label="Label"
                variant="outlined"
                {...register("label", {
                  required: "Label is required",
                })}
                error={!!errors?.label}
                helperText={errors?.label?.message}
              />
              {/* Submit Button */}
              <button
                type="submit"
                className={`${globalButton} min-w-full`} 
              >
                {editData ? "Update Product Level" : "Add Product Level"}
              </button>
            </form>
          </Box>
        </Modal>
      </div>
      {deleteModal && (
        <Delete
          setModal={setdeleteModal}
          triggerDelete={handleDelete}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default LeadTypesForm;
