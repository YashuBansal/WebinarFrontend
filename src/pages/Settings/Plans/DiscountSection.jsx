import { useEffect, useState } from "react";
import { errorToast } from "../../../utils/extra";
import Select from 'react-select';
import { Controller } from "react-hook-form";
import { Checkbox, TextField, Typography } from "@mui/material";

const discountTypeOptions = [
  { value: 'percent', label: 'Percent' },
  { value: 'flat', label: 'Flat' }
];

const DiscountSection = (props) => {
  const { planDurationConfig, setPlanDurationConfig, watch, regularDurations, control } =
    props;

  const [isRegularDuration, setIsRegularDuration] = useState(true);

  const handleInputChange = (key, field, value) => {
    if (field === "discountType") {
      setPlanDurationConfig((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          discountValue: 0,
          discountType: value,
        },
      }));
    } else {
      const currentPrice = planDurationConfig[key].price;
      if (
        value > currentPrice &&
        planDurationConfig[key].discountType === "flat"
      ) {
        errorToast(`Discount value cannot exceed the price (₹${currentPrice}).`);
        return;
      } else if (
        value > 100 &&
        planDurationConfig[key].discountType === "percent"
      ) {
        errorToast("Discount value cannot exceed 100%.");
        return;
      }

      setPlanDurationConfig((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          discountValue: Number(value),
        },
      }));
    }
  };


  // useEffect(() => {
  //   if(planDurationConfig.custom){
  //     setIsRegularDuration(false)
  //   }else{
  //     setIsRegularDuration(true)
  //   }

  // },[planDurationConfig])

  return (
    <div>
      <div className="flex gap-4 flex-col md:flex-row">
        <label className="flex items-center gap-2 px-4 cursor-pointer">
          <input
            type="radio"
            name="durationType"
            checked={isRegularDuration}
            onChange={() => {
              setIsRegularDuration(true);
              setPlanDurationConfig(regularDurations);
            }}
            className="h-4 w-4 text-blue-600"
          />
          <span>Regular Durations</span>
        </label>
        <label className="flex items-center gap-2 px-4 cursor-pointer">
          <input
            type="radio"
            name="durationType"
            checked={!isRegularDuration}
            onChange={() => {
              setIsRegularDuration(false);
              setPlanDurationConfig({
                custom: {
                  duration: 0,
                  discountType: "percent",
                  discountValue: 0,
                  price: 0,
                  isEnabled: false,
                },
              });
            }}
            className="h-4 w-4 text-blue-600"
          />
          <span>Custom Durations</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {Object.entries(planDurationConfig)
          .filter(([key]) => {
            if (isRegularDuration) {
              return key !== "custom";
            } else {
              return key === "custom";
            }
          })
          .map(([key, config]) => (
          <div
            key={key}
            className="p-4 border rounded-lg shadow-md bg-white space-y-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold capitalize">{key}</h3>
              <Controller
                name={`planDurationConfig.${key}.isEnabled`}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      onChange(isChecked);
                      setPlanDurationConfig(prev => ({
                        ...prev,
                        [key]: { ...prev[key], isEnabled: isChecked }
                      }));
                    }}
                    checked={value || planDurationConfig[key]?.isEnabled || false}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              {/* Price Input */}
              <div className="flex flex-col">
                <label htmlFor={`${key}-price`} className="text-sm font-medium">
                  Price
                </label>
                <Controller
                  name={`planDurationConfig.${key}.price`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <TextField
                      fullWidth
                      id={`${key}-price`}
                      type="number"
                      value={value || planDurationConfig[key]?.price || 0}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        onChange(price);
                        setPlanDurationConfig(prev => ({
                          ...prev,
                          [key]: { ...prev[key], price }
                        }));
                      }}
                      disabled={!(planDurationConfig[key]?.isEnabled || false)}
                      size="small"
                      InputProps={{
                        startAdornment: <span className="text-gray-500">₹</span>
                      }}
                    />
                  )}
                />
              </div>

              {key === "custom" && (
                <div className="flex flex-col">
                  <label
                    htmlFor="custom-duration-value"
                    className="text-sm font-medium"
                  >
                    Duration
                  </label>
                  <input
                    type="number"
                    id="custom-duration-value"
                    value={config.duration}
                    onChange={(e) =>
                      setPlanDurationConfig((prev) => ({
                        custom: {
                          duration: Number(e.target.value),
                          discountType: prev.custom.discountType,
                          discountValue: prev.custom.discountValue,
                          price: prev.custom.price,
                          isEnabled: prev.custom.isEnabled,
                        },
                      }))
                    }
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>
              )}

              <div className="flex flex-col">
  <label htmlFor={`${key}-type`} className="text-sm font-medium">
    Discount Type
  </label>
  <Select
    id={`${key}-type`}
    value={discountTypeOptions.find(option => option.value === config.discountType)}
    onChange={(selectedOption) =>
      handleInputChange(key, "discountType", selectedOption.value)
    }
    options={discountTypeOptions}
    className="react-select-container"
    classNamePrefix="react-select"
  />
</div>


              {/* Discount Value Input */}
              <div className="flex flex-col">
                <label htmlFor={`${key}-value`} className="text-sm font-medium">
                  Discount Value
                </label>
                <input
                  type="number"
                  id={`${key}-value`}
                  value={config.discountValue}
                  onChange={(e) =>
                    handleInputChange(key, "discountValue", e.target.value)
                  }
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                  max={
                    config.discountType === "percent"
                      ? 100
                      : config.price || 0
                  }
                />
                {config.discountType === "percent" ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Discount value cannot exceed 100%.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Discount value cannot exceed the price (₹{config.price || 0}).
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscountSection;
