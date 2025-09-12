import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/slices/modalSlice";
import FormInput from "../FormInput";
import { filterTruthyValues, successToast } from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { globalButton } from "../../utils/style";
import productLevelService from "../../services/productLevelService";
import tagsService from "../../services/tagsService";

const ProductFilterModal = ({ modalName, setFilters, filters }) => {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();

  const { modals } = useSelector((state) => state.modals);
  const open = modals[modalName] ? true : false;
  const { control, handleSubmit, reset } = useForm();
  const [productLevelData, setProductLevelData] = useState([]);
  const [tagData, setTagData] = useState([]);

  useEffect(() => {
    productLevelService.getProductLevels().then((res) => {
      if (res.success) {
        if (Array.isArray(res?.data)) {
          setProductLevelData(res.data);
        }
      }
    });

    tagsService.getTags().then((res) => {
      if (res?.success) {
        console.log(res.data);
        if (Array.isArray(res?.data)) {
          setTagData(
            res.data.map((tag) => ({
              label: tag.name,
              value: tag.name,
            }))
          );
        }
      }
    });
  }, []);

  const onSubmit = (data) => {
    const filterData = filterTruthyValues(data);
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    setFilters(filterData);
    logUserActivity({
      action: "filter",
      type: "to Table",
      detailItem: "Products",
    });
    dispatch(closeModal(modalName));
  };

  const resetForm = () => {
    reset({
      name: "",
      level: null,
      price: null,
      tag: "",
    });
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  useEffect(() => {
    if (open) {
      reset({
        ...filters,
      });
    }else{
      resetForm();
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} disablePortal>
      <Box className="bg-white p-6 rounded-md mx-auto mt-20 w-full max-w-2xl ">
        <Typography variant="h6" className="text-center mb-4">
          Product Filters
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-h-[65dvh] overflow-y-auto space-y-4 p-4 border rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput name="name" label="Product Name" control={control} />
              <Controller
                name="level"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="level-label">Product Level</InputLabel>
                    <Select
                      {...field}
                      labelId="level-label"
                      label="Product Level"
                      value={
                        field.value
                          ? field.value
                          : field.value === 0
                          ? field.value
                          : ""
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      {productLevelData.map((option) => (
                        <MenuItem key={option.level} value={option.level}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <FormInput
                name="price.$gte"
                label="Price (Min)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="price.$lte"
                label="Price (Max)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              

              <Controller
                name="tag"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="level-label">Product Tag</InputLabel>
                    <Select
                      {...field}
                      labelId="product-tag-label"
                      label="Product Tag"
                      value={field.value || ""}
                    >
                      <MenuItem value="">All</MenuItem>
                      {tagData.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <button className={globalButton} onClick={resetForm}>
              Reset
            </button>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outlined" color="secondary">
                Cancel
              </Button>
              <button type="submit" className={globalButton}>
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default ProductFilterModal;
