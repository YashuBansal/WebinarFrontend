import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { addNote } from "../../features/actions/assign";
import { ClipLoader } from "react-spinners";
import {
  createAttendeeProduct,
  getAllProductsByAdminId,
} from "../../features/actions/product";
import { getCustomOptions } from "../../features/actions/globalData";
import { resetFormSuccess } from "../../features/slices/assign";
import { getUnAckAlarmData, removeAckAlarm } from "../../features/slices/alarm";

const AddNoteForm = (props) => {
  const { customOptions } = useSelector((state) => state.globalData);
  const dispatch = useDispatch();
  const { isFormLoading, isFormSuccess } = useSelector((state) => state.assign);
  const unAcknowledgedData = useSelector(getUnAckAlarmData);
  const {
    email,
    attendeeId,
    uniquePhones,
    addUserActivityLog,
    employeeModeData,
    userData,
  } = props;
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isNoteRequired, setNoteRequired] = useState(false);
  const [IsNumberInValid, setNumberInvalid] = useState(false);
  const { productDropdownData } = useSelector((state) => state.product);
  const [isAckPending, setAckPending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      attendee: attendeeId,
      email: email,
      phone: "",
      callDuration: { hr: "", min: "", sec: "" },
      status: "",
      note: "",
      image: null,
    },
  });

  useEffect(() => {
    if (userData) {
      dispatch(getAllProductsByAdminId());
      dispatch(getCustomOptions());
    }
  }, []);

  // Updated useEffect to correctly set and reset isAckPending state
  useEffect(() => {
    if (userData && email && Array.isArray(unAcknowledgedData)) {
      const hasPendingAlarm = unAcknowledgedData.some(
        (item) => item.email === email
      );
      setAckPending(hasPendingAlarm);
    }
  }, [unAcknowledgedData, email, userData]);

  // New useEffect to handle form state when an alarm is pending
  useEffect(() => {
    if (isAckPending) {
      const ackStatusValue = "Alarm Acknowledgement";
      setValue("status", ackStatusValue, { shouldValidate: true });
      setSelectedStatus(ackStatusValue);
      setNoteRequired(true);
      setNumberInvalid(false);
    }
  }, [isAckPending, setValue]);

  useEffect(() => {
    if (isFormSuccess) {
      reset({
        attendee: attendeeId,
        email: email,
        phone: "",
        callDuration: { hr: "", min: "", sec: "" },
        status: "",
        note: "",
        image: null,
      });
      setSelectedStatus(null);
      setSelectedFile(null);
      dispatch(resetFormSuccess());
    }
  }, [isFormSuccess, reset, attendeeId, email, dispatch]);

  const onSubmit = (data) => {
    data.callDuration.hr = data.callDuration.hr ? data.callDuration.hr : "00";
    data.callDuration.min = data.callDuration.min
      ? data.callDuration.min
      : "00";
    data.callDuration.sec = data.callDuration.sec
      ? data.callDuration.sec
      : "00";

    data.isWorked = !isNoteRequired;
    data.isInvalidPhone = IsNumberInValid;
    data["createdBy"] = userData?.userName;

    if (isAckPending) {
      const alarm = unAcknowledgedData.find((item) => item.email === email);
      if (alarm) {
        data["alarmId"] = alarm._id;
      }
    }

    dispatch(addNote(data)).then((res) => {
      console.log(res);
      if (res?.meta?.requestStatus === "fulfilled") {
        setNoteRequired(false);
        addUserActivityLog({
          action: "note",
          type: "contact",
          detailItem: data?.email,
          activityItem: data?.email,
        });
        console.log('isAckPending', isAckPending)
        if (isAckPending) {
          dispatch(removeAckAlarm(email));
          setAckPending(false);
        }
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setValue("image", file);
  };

  const handleInput = (e, maxValue, numAllowed = 2) => {
    let value = e.target.value;

    value = value.replace(/[^0-9]/g, "");
    if (value.length > numAllowed) {
      value = value.slice(0, numAllowed);
    }

    const num = Number(value);

    if (num > maxValue) {
      value = maxValue.toString().padStart(2, "0");
    }

    e.target.value = value;
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-5 flex flex-col h-full"
    >
      <div className=" flex-1">
        <div className="w-full bg-inherit">
          <label className="font-medium text-sm">Phone Number</label>
          <Controller
            name="phone"
            control={control}
            rules={{ required: "Phone number is required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={uniquePhones.map((phone) => ({
                  value: phone,
                  label: phone,
                }))}
                className="mt-1 text-sm shadow bg-gray-200"
                placeholder="Choose Phone Number"
                value={
                  field.value
                    ? { value: field.value, label: field.value }
                    : null
                }
                onChange={(selected) => {
                  field.onChange(selected.value);
                }}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: errors.phone
                      ? "1px solid #EF4444"
                      : "1px solid #CBD5E1",
                  }),
                  placeHolder: (provided) => ({
                    ...provided,
                    color: "#9CA3AF",
                  }),
                }}
              />
            )}
          />
          {errors.phone && (
            <span className="text-red-500">Phone Number is required</span>
          )}
        </div>

        {/* Status Select */}
        <div className="pt-2">
          <div className="font-medium">Status</div>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Status is required" }}
            render={({ field }) => {
              // Conditionally set options based on isAckPending
              const statusOptions = isAckPending
                ? [
                    {
                      value: "Alarm Acknowledgement",
                      label: "Alarm Acknowledgement",
                      isWorked: true, // Prevents note field from showing
                      isInvalid: false,
                    },
                  ]
                : customOptions.map((option) => ({
                    value: option?.label,
                    label: option?.label,
                    isWorked: option?.isWorked,
                    isInvalid: option?.isInvalid,
                  }));

              return (
                <Select
                  {...field}
                  isDisabled={isAckPending} // Disable the select if alarm is pending
                  options={statusOptions}
                  className="mt-1 text-sm shadow bg-gray-200"
                  placeholder="Choose Status"
                  value={
                    field.value
                      ? { value: field.value, label: field.value }
                      : null
                  }
                  onChange={(selected) => {
                    field.onChange(selected.value);
                    setSelectedStatus(selected.value);
                    setNoteRequired(!selected.isWorked);
                    setNumberInvalid(selected.isInvalid);
                  }}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (provided, state) => ({
                      ...provided,
                      border: errors.status
                        ? "1px solid #EF4444"
                        : "1px solid #CBD5E1",
                      // Style for disabled state
                      backgroundColor:
                        state.isDisabled && !selectedStatus
                          ? "#e9ecef"
                          : provided.backgroundColor,
                    }),
                    placeHolder: (provided) => ({
                      ...provided,
                      color: "#9CA3AF",
                    }),
                  }}
                />
              );
            }}
          />

          {errors.status && (
            <span className="text-red-500 text-sm mt-1">
              {errors.status.message}
            </span>
          )}
        </div>

        {isNoteRequired && (
          <>
            <div className="w-full flex mt-2 gap-5 items-center">
              <label className="font-medium text-sm">
                Call Duration{" "}
                <span className="font-normal text-xs">(min : sec)</span>
              </label>
              <div className="mt-1 flex items-center">
                <input
                  {...register("callDuration.min")}
                  type="text"
                  placeholder={"00"}
                  className="w-12 h-10 rounded-lg border focus:border-teal-500 outline-none text-center text-xl"
                  maxLength={3}
                  onInput={(e) => handleInput(e, 150, 3)}
                  onClick={(e) => e.target.select()}
                />
                <span className="font-light px-1">:</span>
                <input
                  {...register("callDuration.sec")}
                  type="text"
                  placeholder={"00"}
                  className="w-10 h-10 rounded-lg border focus:border-teal-500 outline-none text-center text-xl"
                  maxLength={2}
                  onInput={(e) => handleInput(e, 59)}
                  onClick={(e) => e.target.select()}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="font-medium text-sm">Note</label>
              <textarea
                {...register("note", { required: true })}
                className="w-full mt-1 px-5 py-2 text-gray-500 border-slate-300 bg-transparent outline-none border focus:border-teal-400 shadow-sm rounded-lg"
              />
              {errors.note && (
                <span className="text-red-500">Note is required</span>
              )}
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isFormLoading || employeeModeData
            ? true
            : false || !userData?.isActive
        }
        className="bg-indigo-700 w-full hover:bg-indigo-800 my-2 text-white py-2 px-4 rounded-md"
      >
        {isFormLoading ? <ClipLoader size={17} color="#c4c2c2" /> : "Add Note"}
      </button>
    </form>
  );
};

export default AddNoteForm;
