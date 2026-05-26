import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector as useReduxSelector } from "react-redux";
import {
  addPricePlans,
  getPricePlan,
  updatePricePlans,
} from "../../../features/actions/pricePlan";
import { useNavigate, useParams } from "react-router-dom";
import AppLoader from "../../../components/AppLoader";
import InfoIcon from '@mui/icons-material/Info';
import Collapse from "@mui/material/Collapse";
import { ChevronDown, ChevronUp, Sparkles, ShieldCheck, Check, X, Shield, PlusCircle, PenTool } from "lucide-react";

import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { filterTruthyValues } from "../../../utils/extra";
import { getCustomOptions } from "../../../features/actions/globalData";
import {
  attendeeTableColumns,
  groupedAttendeeTableColumns,
} from "../../../utils/columnData";
import { getAllClientsForDropdown } from "../../../features/actions/client";
import { toast } from "sonner";
import DiscountSection from "./DiscountSection";
import { clearSinglePlanData } from "../../../features/slices/pricePlan";
import useRoles from "../../../hooks/useRoles";

// Premium Input field component styled in signature glassmorphic look
function CustomFormInput({ name, label, control, type = "text", required = false, errorMessage = "This field is required", placeholder = "" }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? errorMessage : false }}
      render={({ field, fieldState }) => (
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label} {required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <div className="relative">
            <input
              {...field}
              type={type}
              value={type === "number" ? field.value ?? "" : field.value}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                return field.onChange(
                  type === "number" ? (Number.isNaN(parsed) ? "" : parsed) : e.target.value
                );
              }}
              placeholder={placeholder}
              className={`w-full px-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 outline-none
                ${
                  fieldState?.error
                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                }`}
            />
          </div>
          {fieldState?.error && (
            <span className="text-xs font-semibold text-red-500 mt-1">{fieldState?.error?.message}</span>
          )}
        </div>
      )}
    />
  );
}

function AttendeeTable({ control, setValue, watch }) {
  const { customOptions } = useReduxSelector((state) => state.globalData);
  
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/45 dark:bg-slate-950/20 shadow-inner">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <th className="py-3 px-5 font-black uppercase tracking-wider text-[11px] text-slate-400">Field Name</th>
              <th className="py-3 px-5 text-center font-black uppercase tracking-wider text-[11px] text-slate-400">Filterable</th>
              <th className="py-3 px-5 text-center font-black uppercase tracking-wider text-[11px] text-slate-400">Downloadable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {[
              { header: "Lead Type", key: "leadType", width: 20, type: "" },
              ...attendeeTableColumns,
              ...groupedAttendeeTableColumns.filter(
                (column) =>
                  !attendeeTableColumns.some(
                    (attendeeColumn) => attendeeColumn.key === column.key
                  ) && column.header !== "Email"
              ),
            ].map(({ key, header }) => (
              <tr key={key} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                <td className="py-3 px-5 font-bold text-slate-700 dark:text-slate-200">{header}</td>
                <td className="py-3 px-5 text-center">
                  <Controller
                    name={`attendeeTableConfig.${key}.filterable`}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          onChange(isChecked);
                          if (!isChecked) {
                            setValue(
                              `attendeeTableConfig.${key}.downloadable`,
                              false
                            );

                            if (key === "status") {
                              customOptions.forEach((option) =>
                                setValue(
                                  `attendeeTableConfig.defaultOptions.${option?.label}`,
                                  false
                                )
                              );
                              setValue(
                                  `attendeeTableConfig.customOptions.filterable`,
                                  false
                              );
                            }
                          }
                        }}
                        checked={value || false}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </td>
                <td className="py-3 px-5 text-center">
                  <Controller
                    name={`attendeeTableConfig.${key}.downloadable`}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          onChange(isChecked);
                          if (isChecked) {
                            setValue(
                              `attendeeTableConfig.${key}.filterable`,
                              true
                            );
                          }
                        }}
                        checked={value || false}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </td>
              </tr>
            ))}
            
            {/* Header divider */}
            <tr className="bg-slate-50/40 dark:bg-slate-900/20">
              <td className="py-2.5 px-5 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider" colSpan={3}>
                Default Status Options
              </td>
            </tr>

            {(Array.isArray(customOptions) ? customOptions : []).map((option) => (
              <tr key={option?._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                <td className="py-3 px-5 pl-8 text-slate-600 dark:text-slate-350 font-semibold">{option?.label}</td>
                <td className="py-3 px-5 text-center">
                  <Controller
                    name={`attendeeTableConfig.defaultOptions.${option?.label}`}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={value || false}
                        disabled={
                          !watch(`attendeeTableConfig.status.filterable`)
                        }
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25 disabled:opacity-40"
                      />
                    )}
                  />
                </td>
                <td className="py-3 px-5"></td>
              </tr>
            ))}

            {/* Custom Options Allowed row */}
            <tr className="bg-slate-50/40 dark:bg-slate-900/20">
              <td className="py-3 px-5 font-black text-slate-850 dark:text-slate-200 text-xs uppercase tracking-wider">Custom Status Options</td>
              <td className="py-3 px-5 text-center">
                <Controller
                  name={`attendeeTableConfig.customOptions.filterable`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="checkbox"
                      onChange={(e) => onChange(e.target.checked)}
                      checked={value || false}
                      disabled={
                        !watch(`attendeeTableConfig.status.filterable`) ||
                        !watch(`attendeeTableConfig.isCustomOptionsAllowed`)
                      }
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25 disabled:opacity-40"
                    />
                  )}
                />
              </td>
              <td className="py-3 px-5"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const regularDurations = {
  monthly: {
    duration: 30,
    discountType: "percent",
    discountValue: 0,
    price: 0,
    isEnabled: false,
    razorpayPlanId: "",
  },
  quarterly: {
    duration: 90,
    discountType: "percent",
    discountValue: 0,
    price: 0,
    isEnabled: false,
    razorpayPlanId: "",
  },
  halfyearly: {
    duration: 180,
    discountType: "percent",
    discountValue: 0,
    price: 0,
    isEnabled: false,
    razorpayPlanId: "",
  },
  yearly: {
    duration: 365,
    discountType: "percent",
    discountValue: 0,
    price: 0,
    isEnabled: false,
    razorpayPlanId: "",
  },
  custom: {
    duration: 0,
    discountType: "percent",
    discountValue: 0,
    price: 0,
    isEnabled: false,
    razorpayPlanId: "",
  },
};

export default function AddPlan() {
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(id ? true : false);
  const {
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
  } = useForm();
  const { isLoading, isSuccess, singlePlanData } = useReduxSelector(
    (state) => state.pricePlans
  );
  const { clientsDropdownData } = useReduxSelector((state) => state.client);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [planType, setPlanType] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [planDurationConfig, setPlanDurationConfig] = useState(regularDurations);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();

  const onSubmit = async (data) => {
    const payload = filterTruthyValues(data);

    payload["calendarFeatures"] = data["calendarFeatures"];
    payload["employeeRealTimeStatusUpdate"] =
      data["employeeRealTimeStatusUpdate"];
    payload["employeeInactivity"] = data["employeeInactivity"];
    payload["whatsappNotificationOnAlarms"] =
      data["whatsappNotificationOnAlarms"];
    payload["setAlarm"] = data["setAlarm"];
    payload["productRevenueMetrics"] = data["productRevenueMetrics"];
    payload["assignmentMetrics"] = data["assignmentMetrics"];

    if (planType === "custom" && assignedUsers.length > 0) {
      payload["planType"] = "custom";
      payload["assignedUsers"] = assignedUsers;
    } else {
      payload["planType"] = "normal";
    }

    if (!("attendeeTableConfig" in payload)) {
      payload["attendeeTableConfig"] = {};
    }
    if (isEditMode) {
      payload["_id"] = id;
    }

    if (planType === "normal" && payload["renewalNotAllowed"]) {
      payload["renewalNotAllowed"] = false;
    }

    payload["planDurationConfig"] = planDurationConfig;
    dispatch(isEditMode ? updatePricePlans(payload) : addPricePlans(payload));
  };

  useEffect(() => {
    if (isSuccess) {
      navigate("/plans");
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isEditMode) {
      dispatch(getPricePlan(id));
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (isEditMode && singlePlanData) {
      reset({
        name: singlePlanData.name || "",
        internalName: singlePlanData.internalName || "",
        planDuration: singlePlanData.planDuration || 0,
        employeeCount: singlePlanData.employeeCount || 0,
        contactLimit: singlePlanData.contactLimit || 0,
        toggleLimit: singlePlanData.toggleLimit || 0,
        whatsappProjectLimit: singlePlanData.whatsappProjectLimit || 0,
        zoomProjectLimit: singlePlanData.zoomProjectLimit || 0,
        webinarLimit: singlePlanData.webinarLimit || 0,
        attendeeTableConfig: singlePlanData.attendeeTableConfig || {},
        whatsappNotificationOnAlarms:
          singlePlanData.whatsappNotificationOnAlarms || false,
        employeeInactivity: singlePlanData.employeeInactivity || false,
        employeeRealTimeStatusUpdate:
          singlePlanData.employeeRealTimeStatusUpdate || false,
        calendarFeatures: singlePlanData.calendarFeatures || false,
        setAlarm: singlePlanData.setAlarm || false,
        productRevenueMetrics: singlePlanData.productRevenueMetrics || false,
        renewalNotAllowed: singlePlanData.renewalNotAllowed || false,
        customRibbon: singlePlanData.customRibbon || "",
        customRibbonColor: singlePlanData.customRibbonColor || "",
        assignmentMetrics: singlePlanData.assignmentMetrics || false,
      });

      setPlanType(singlePlanData.planType || "normal");
      setAssignedUsers(singlePlanData.assignedUsers || []);

      if (singlePlanData.planDurationConfig) {
        const updatedConfig = { ...regularDurations };
        Object.keys(singlePlanData.planDurationConfig).forEach(key => {
          if (updatedConfig[key]) {
            updatedConfig[key] = {
              ...updatedConfig[key],
              ...singlePlanData.planDurationConfig[key]
            };
          }
        });
        setPlanDurationConfig(updatedConfig);
        
        Object.keys(updatedConfig).forEach(duration => {
          setValue(`planDurationConfig.${duration}.price`, updatedConfig[duration].price);
          setValue(`planDurationConfig.${duration}.isEnabled`, updatedConfig[duration].isEnabled);
          setValue(`planDurationConfig.${duration}.discountType`, updatedConfig[duration].discountType);
          setValue(`planDurationConfig.${duration}.discountValue`, updatedConfig[duration].discountValue);
          setValue(`planDurationConfig.${duration}.razorpayPlanId`, updatedConfig[duration].razorpayPlanId || "");
          if (duration === 'custom') {
            setValue(`planDurationConfig.${duration}.duration`, updatedConfig[duration].duration);
          }
        });
      } else {
        setPlanDurationConfig(regularDurations);
      }
    }
  }, [singlePlanData, isEditMode, setValue]);

  useEffect(() => {
    if (!id) {
      setPlanType("normal");
    }

    dispatch(getAllClientsForDropdown());
    dispatch(getCustomOptions());

    return () => {
      dispatch(clearSinglePlanData());
    }
  }, []);

  return (
    <HubSubpageShell>
      <div className="flex w-full justify-center px-2 py-4">
        <div className="max-w-4xl w-full rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          
          {/* Visual Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50/50 to-white/10 border-b border-slate-150 dark:border-slate-800 dark:bg-slate-900/40 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm">
              {isEditMode ? <PenTool className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                {isEditMode ? "Edit Price Plan" : "Add Price Plan"}
                <Sparkles className="h-5 w-5 text-amber-450 animate-pulse" />
              </h2>
              <p className="text-sm font-semibold text-slate-450 dark:text-slate-400 mt-0.5">
                Define the tiers, features, limits, pricing structures, and Razorpay integrations.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 w-full space-y-8">
            
            {/* Form Section 1: Core Identification */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Plan Identification
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <CustomFormInput
                  name="name"
                  label="Display Plan Name"
                  control={control}
                  required={true}
                  errorMessage="Plan name is required"
                  placeholder="e.g. Starter Plan"
                />
                <CustomFormInput
                  name="internalName"
                  label="Unique Plan Name"
                  control={control}
                  required={true}
                  errorMessage="Plan name is required"
                  placeholder="e.g. starter_tier_v1"
                />
              </div>
            </div>

            {/* Form Section 2: Usage Limits & Caps */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Tiers & Resource Limits
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <CustomFormInput
                  name="employeeCount"
                  label="Employees Count"
                  type="number"
                  control={control}
                  required={true}
                  errorMessage="Employee count is required"
                  placeholder="10"
                />
                <CustomFormInput
                  name="contactLimit"
                  label="Contact Limit"
                  type="number"
                  control={control}
                  required={true}
                  errorMessage="Contact limit is required"
                  placeholder="5000"
                />
                <CustomFormInput
                  name="toggleLimit"
                  label="Toggle Limit"
                  type="number"
                  control={control}
                  required={true}
                  errorMessage="Toggle limit is required"
                  placeholder="100"
                />
                <CustomFormInput
                  name="whatsappProjectLimit"
                  label="WhatsApp Project Limit"
                  type="number"
                  control={control}
                  required={true}
                  errorMessage="WhatsApp project limit is required"
                  placeholder="3"
                />
                <CustomFormInput
                  name="zoomProjectLimit"
                  label="Zoom Project Limit"
                  type="number"
                  control={control}
                  required={true}
                  errorMessage="Zoom project limit is required"
                  placeholder="3"
                />
                <CustomFormInput
                  name="webinarLimit"
                  label="Webinar Limit"
                  type="number"
                  control={control}
                  required={true}
                  errorMessage="Webinar limit is required"
                  placeholder="10"
                />
              </div>
            </div>

            {/* Form Section 3: Configuration & Customizations */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Assigned Scope & Ribbon
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                
                {/* Plan Type Selector */}
                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Plan Type
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/45 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-slate-100 transition-all outline-none dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="normal">Normal Plan (Publicly viewable)</option>
                    <option value="custom">Custom Plan (Restricted access)</option>
                  </select>
                </div>

                {/* Scope Users Multi-Select */}
                {planType === "custom" ? (
                  <div className="flex flex-col space-y-1.5 w-full">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Scope Users
                    </label>
                    <select
                      multiple
                      value={assignedUsers}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                        setAssignedUsers(selected);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/45 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-slate-100 transition-all outline-none dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 min-h-[120px]"
                    >
                      {(Array.isArray(clientsDropdownData) ? clientsDropdownData : []).map((client, index) => (
                        <option key={index} value={client.value}>
                          {client.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">Hold Ctrl (or Cmd on Mac) to select multiple users.</p>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <CustomFormInput
                  name="customRibbon"
                  label="Custom Ribbon Label"
                  control={control}
                  placeholder="e.g. POPULAR, BEST VALUE"
                />

                {/* Color Picker Container */}
                <Controller
                  name="customRibbonColor"
                  control={control}
                  render={({ field }) => (
                    <div className="flex border px-4 py-2.5 rounded-xl border-slate-200/90 bg-white/40 dark:border-slate-800 dark:bg-slate-900/20 gap-5 items-center justify-between">
                      <label
                        htmlFor="color-picker"
                        className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Custom Ribbon Color
                      </label>
                      <input
                        type="color"
                        id="color-picker"
                        {...field}
                        className="w-16 h-8 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg p-0.5"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Form Section 4: Features Checklist Toggles */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Included Features & Entitlements Toggles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Switch Item: Custom Options */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      Custom Options Allowed
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Allow creation and use of custom status options for attendee filtering" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Allow custom attendee status options</span>
                  </div>
                  <Controller
                    name={`attendeeTableConfig.isCustomOptionsAllowed`}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          onChange(isChecked);
                          if (!isChecked) {
                            setValue(
                              `attendeeTableConfig.customOptions.filterable`,
                              false
                            );
                          }
                        }}
                        checked={value || false}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: Employee Inactivity */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      Employee Inactivity Tracking
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Enable employee inactivity monitoring with automatic reminder notifications" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Track inactive members and alert</span>
                  </div>
                  <Controller
                    name="employeeInactivity"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={value || false}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: Set Alarm */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      Set Alarm Capability
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Enable setting alarms for important events or deadlines" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Allow scheduled alarms & reminder events</span>
                  </div>
                  <Controller
                    name="setAlarm"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          onChange(isChecked);
                          if (!isChecked) {
                            setValue('whatsappNotificationOnAlarms', false);
                          }
                        }}
                        checked={value || false}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: WhatsApp Notifications */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      WhatsApp Notifications
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Automatically send WhatsApp messages when alarms are triggered" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Send alarm triggers via WhatsApp API</span>
                  </div>
                  <Controller
                    name="whatsappNotificationOnAlarms"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={value || false}
                        disabled={!watch('setAlarm')}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25 disabled:opacity-40"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: Calendar Features */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      Calendar Features
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Provide access to calendar with alarm history and scheduled event management" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Access deep logs and calendar planner view</span>
                  </div>
                  <Controller
                    name="calendarFeatures"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={value || false}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: Product Revenue Metrics */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      Product Revenue Metrics
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Enable user to View Product Revenue Metrics" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Show financial reports & earnings</span>
                  </div>
                  <Controller
                    name="productRevenueMetrics"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={value || false}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: Assignment Metrics */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                      Assignment Metrics
                      <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Enable user to View Assignment Metrics" />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Track team tasks & assignment numbers</span>
                  </div>
                  <Controller
                    name="assignmentMetrics"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="checkbox"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={value || false}
                        className="h-5 w-5 rounded border-slate-350 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                      />
                    )}
                  />
                </div>

                {/* Switch Item: Renewal Not Allowed */}
                {planType === "custom" && (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/20 transition-all">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-200">
                        Renewal Not Allowed
                        <InfoIcon className="ms-1.5 text-blue-500 text-sm shrink-0" title="Disable renewal of this plan" />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Stop billing cycles at term end</span>
                    </div>
                    <Controller
                      name="renewalNotAllowed"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <input
                          type="checkbox"
                          onChange={(e) => onChange(e.target.checked)}
                          checked={value || false}
                          className="h-5 w-5 rounded border-slate-355 dark:border-slate-750 text-blue-600 focus:ring-blue-500/25"
                        />
                      )}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Form Section 5: Attendee Filters and Exports (Collapsible Table) */}
            <div className="overflow-hidden rounded-3xl border border-slate-150 bg-white/40 dark:border-slate-800 dark:bg-slate-950/10">
              <div
                className="flex items-center justify-between cursor-pointer select-none px-6 py-5 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors"
                onClick={() => setIsTableOpen(!isTableOpen)}
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                    Attendee Filters and Exports Configuration
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                    Toggle which attendee data fields are filterable or downloadable under this tier.
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 transition-colors">
                  {isTableOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
              <Collapse in={isTableOpen} timeout="auto" unmountOnExit>
                <div className="px-6 pb-6">
                  <AttendeeTable
                    watch={watch}
                    control={control}
                    setValue={setValue}
                  />
                </div>
              </Collapse>
            </div>

            {/* Form Section 6: Pricing and Discounts */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Duration Pricing & Discounts Config
              </h3>
              <div className="p-6 rounded-3xl border border-slate-150 bg-white/40 dark:border-slate-800 dark:bg-slate-950/10">
                <DiscountSection
                  planDurationConfig={planDurationConfig}
                  setPlanDurationConfig={setPlanDurationConfig}
                  regularDurations={regularDurations}
                  watch={watch}
                  control={control}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="py-3 text-sm font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-600/35 transition-all w-full flex items-center justify-center min-h-[48px] disabled:opacity-50"
              >
                {isLoading ? (
                  <AppLoader size="md" variant="inverse" />
                ) : isEditMode ? (
                  "Update Plan Tiers"
                ) : (
                  "Create Price Plan Tiers"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </HubSubpageShell>
  );
}
