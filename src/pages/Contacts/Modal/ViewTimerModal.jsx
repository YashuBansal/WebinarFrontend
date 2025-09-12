import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { getAttendeeAlarm, setAlarm } from "../../../features/actions/alarm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

const ViewTimerModal = ({ setModal, email, attendeeId, dateFormat, logUserActivity,noteData,uniquePhones }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { userData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // State pieces for date and time
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);

  const initHourRaw = now.getHours();
  const initMinute = now.getMinutes().toString().padStart(2, "0");

  const initAmPm = initHourRaw >= 12 ? "PM" : "AM";
  const initHour12 = (initHourRaw % 12 || 12).toString().padStart(2, "0");

  const [selectedDate, setSelectedDate] = useState(now);
  const [hour, setHour] = useState(initHour12);
  const [minute, setMinute] = useState(initMinute);
  const [ampm, setAmPm] = useState(initAmPm);


  // react-select options
  const hours = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: (i + 1).toString().padStart(2, "0"),
  }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: i.toString().padStart(2, "0"),
    label: i.toString().padStart(2, "0"),
  }));
  const ampmOptions = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  // Styling for react-select
  const customStyles = {
    menuList: (provided) => ({
      ...provided,
      maxHeight: 160, // scroll limit
      overflowY: "auto",
    }),
    control: (provided) => ({
      ...provided,
      minHeight: "36px",
      fontSize: "0.875rem",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "4px",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 6px",
    }),
  };

  const formatIndianPhoneNumber = (phone) => {
    const defaultValue = "Number not Available";
    if (!phone) return defaultValue;

    const phoneStr = String(phone).trim().replace(/\D/g, "");
    if (phoneStr.length === 10) return `+91${phoneStr}`;
    if (phoneStr.length === 12 && phoneStr.startsWith("91"))
      return `+${phoneStr}`;
    return defaultValue;
  };

  const findAndFormatFirstValidPhone = (noteData = [], uniquePhones = []) => {
    for (const item of noteData) {
      const formattedPhone = formatIndianPhoneNumber(item?.phone);
      if (formattedPhone !== "Number not Available") return formattedPhone;
    }
    for (const rawPhone of uniquePhones) {
      const formattedPhone = formatIndianPhoneNumber(rawPhone);
      if (formattedPhone !== "Number not Available") return formattedPhone;
    }
    return "Number not Available";
  };

  const onSubmit = (data) => {
    if (data.note) data.note = data.note.trim();

    // Convert chosen date + time parts into full Date object
    let finalDate = new Date(selectedDate);
    let hr = parseInt(hour, 10);
    const min = parseInt(minute, 10);

    if (ampm === "PM" && hr < 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;

    finalDate.setHours(hr);
    finalDate.setMinutes(min);
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);

    data["email"] = email;
    data["createdBy"] = userData?.userName;
    data["attendeeId"] = attendeeId;
    data["date"] = finalDate.toISOString();
    data["attendeePhone"] = findAndFormatFirstValidPhone(
      noteData,
      uniquePhones
    );

    if (!data?.secondaryNumber) data.secondaryNumber = undefined;

    console.log("Payload:", data);

    dispatch(setAlarm(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        logUserActivity({
          action: "setAlarm",
          type: "contact",
          detailItem: email,
          activityItem: email,
        });
        dispatch(getAttendeeAlarm({ email }));
      }
    });
    setModal(false);
  };

  return (
    <div className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-300/20 backdrop-blur-sm">
      <div className="relative h-auto max-w-96 flex-col gap-6 rounded bg-white p-6 shadow-xl">
        <button
          onClick={() => setModal(false)}
          className="absolute right-2 top-2 w-8 h-8 rounded-full hover:bg-green-500 hover:text-white transition duration-300"
        >
          X
        </button>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-lg p-5 bg-slate-50 w-full">
            {/* Date Selection */}
            <div className="flex gap-1 flex-col">
              <label className="font-medium text-sm">Date</label>
              <DatePicker
                className="border p-2 rounded-lg w-full mt-1"
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                dateFormat={dateFormat}
              />
            </div>

            {/* Time Selection */}
            <div className="pt-2 ">
              <label className="font-medium text-sm">Time</label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                {/* Hours */}
                <Select
                  value={hours.find((h) => h.value === hour)}
                  onChange={(opt) => setHour(opt.value)}
                  options={hours}
                  styles={customStyles}
                />

                {/* Minutes */}
                <Select
                  value={minutes.find((m) => m.value === minute)}
                  onChange={(opt) => setMinute(opt.value)}
                  options={minutes}
                  styles={customStyles}
                />

                {/* AM/PM */}
                <Select
                  value={ampmOptions.find((ap) => ap.value === ampm)}
                  onChange={(opt) => setAmPm(opt.value)}
                  options={ampmOptions}
                  styles={customStyles}
                />
              </div>
            </div>

            {/* Note */}
            <div className="pt-2">
              <label className="font-medium text-sm">Note</label>
              <textarea
                {...register("note", {
                  required: "Note is required",
                  maxLength: {
                    value: 600,
                    message: "Note cannot exceed 600 characters",
                  },
                })}
                className="w-full bg-white mt-1 px-5 py-2 text-gray-500 text-sm border-slate-300 border rounded-lg focus:border-teal-400 shadow-sm"
                placeholder="Write a note (Max. 600 chars)"
              />
              {errors.note && (
                <span className="text-red-500 text-sm">
                  {errors.note.message}
                </span>
              )}
            </div>

            {/* Secondary Number */}
            <div className="pt-2">
              <label className="font-medium text-sm">
                Secondary Number (Optional)
              </label>
              <input
                {...register("secondaryNumber", {
                  pattern: {
                    value: /^\+91\d+$/,
                    message: "Number must start with +91",
                  },
                })}
                type="tel"
                placeholder="+91XXXXXXXXXX"
                className="w-full bg-white mt-1 px-5 py-2 text-gray-500 text-sm border-slate-300 border rounded-lg focus:border-teal-400 shadow-sm"
              />
              {errors.secondaryNumber && (
                <span className="w-fit text-red-500 text-sm">
                  {errors.secondaryNumber.message}
                </span>
              )}
            </div>

            <button className="text-white bg-blue-600 hover:bg-blue-700 py-1 px-4 mt-3 rounded-md w-full">
              Set Alarm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewTimerModal;
