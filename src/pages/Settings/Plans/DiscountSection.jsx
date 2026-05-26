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

  return (
    <div className="space-y-6">
      {/* Premium Radio Toggle Tabs */}
      <div className="flex rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner dark:border-slate-800 dark:bg-slate-950/40 w-fit">
        <button
          type="button"
          onClick={() => {
            setIsRegularDuration(true);
            setPlanDurationConfig(regularDurations);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
            isRegularDuration
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-700"
              : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Regular Durations
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegularDuration(false);
            setPlanDurationConfig({
              custom: {
                duration: 0,
                discountType: "percent",
                discountValue: 0,
                price: 0,
                isEnabled: false,
                razorpayPlanId: "",
              },
            });
          }}
          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
            !isRegularDuration
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-700"
              : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Custom Durations
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            className="p-5 border border-slate-100 bg-slate-50/40 rounded-2xl dark:border-slate-800 dark:bg-slate-950/20 space-y-4 hover:border-slate-250 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold capitalize text-slate-850 dark:text-slate-200 tracking-tight">{key} TIER</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                  Enable
                </span>
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
            </div>
            
            <div className="space-y-3.5">
              {/* Price Input */}
              <div className="flex flex-col space-y-1">
                <label htmlFor={`${key}-price`} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Base Price
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
                        startAdornment: <span className="text-slate-450 mr-1.5 font-bold">₹</span>
                      }}
                    />
                  )}
                />
              </div>

              {key === "custom" && (
                <div className="flex flex-col space-y-1">
                  <label
                    htmlFor="custom-duration-value"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    id="custom-duration-value"
                    value={config.duration}
                    onChange={(e) =>
                      setPlanDurationConfig((prev) => ({
                        custom: {
                          ...prev.custom,
                          duration: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    min={0}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor={`${key}-type`} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Discount Type
                  </label>
                  <Select
                    id={`${key}-type`}
                    value={discountTypeOptions.find(option => option.value === config.discountType)}
                    onChange={(selectedOption) =>
                      handleInputChange(key, "discountType", selectedOption.value)
                    }
                    options={discountTypeOptions}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Discount Value Input */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor={`${key}-value`} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    id={`${key}-value`}
                    value={config.discountValue}
                    onChange={(e) =>
                      handleInputChange(key, "discountValue", e.target.value)
                    }
                    className="w-full px-3 py-[9px] text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100"
                    min={0}
                    max={
                      config.discountType === "percent"
                        ? 100
                        : config.price || 0
                    }
                  />
                </div>
              </div>

              {/* Razorpay Plan ID Input */}
              <div className="flex flex-col space-y-1 pt-1.5 border-t border-slate-100/60 dark:border-slate-800/80">
                <label htmlFor={`${key}-razorpay-id`} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Razorpay Plan ID (Recurring)
                </label>
                <Controller
                  name={`planDurationConfig.${key}.razorpayPlanId`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <TextField
                      fullWidth
                      id={`${key}-razorpay-id`}
                      type="text"
                      placeholder="e.g. plan_NXYZ81H"
                      value={value || planDurationConfig[key]?.razorpayPlanId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange(val);
                        setPlanDurationConfig(prev => ({
                          ...prev,
                          [key]: { ...prev[key], razorpayPlanId: val }
                        }));
                      }}
                      disabled={!(planDurationConfig[key]?.isEnabled || false)}
                      size="small"
                    />
                  )}
                />
                <p className="text-[10px] font-medium text-slate-450 dark:text-slate-500">
                  Optional. Maps this duration to a Razorpay Subscription Plan.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscountSection;
