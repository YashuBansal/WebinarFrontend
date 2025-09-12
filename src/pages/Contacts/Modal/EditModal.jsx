import React, { useEffect, useLayoutEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { addLocation } from "../../../features/actions/location";
import Select from "react-select";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import { Select as MuiSelect } from "@mui/material";
import tagsService from "../../../services/tagsService";
import TailwindLoader from "../../../components/TailwindLoader";
import AddRequestLocation from "../../Location/Modal/AddRequestLocation";
import { states } from "../../../utils/columnData";
import { capitalizeWords } from "../../../utils/extra";

const EditModal = ({
  setModal,
  initialData,
  onConfirmEdit,
  locationsMap = new Map(),
  locations = [],
  userData,
}) => {
  console.log(initialData, "webinarName");
  const dispatch = useDispatch();
  const {
    globalLocationsData,
    isLoading: isLocationLoading,
    isSuccess,
  } = useSelector((state) => state.location);
  const [tagData, setTagData] = useState([]);
  const { isLoading } = useSelector((state) => state.attendee);

  const [selectedState, setSelectedState] = useState("");
  console.log(selectedState, "selectedState");
  const [addRequestModal, setAddRequestModal] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [locationsList, setLocationsList] = useState([]);

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        setTagData(
          res.data.map((tag) => ({
            label: tag.name,
            value: tag.name,
          }))
        );
      }
    });
  }, []);

  function removeBlankAttributes(obj) {
    const result = {};
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key].length > 0) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  const { control, register, handleSubmit, setValue } = useForm({
    defaultValues: {
      firstName: initialData?.firstName,
      lastName: initialData?.lastName,
      phone: initialData?.phone,
      location: initialData?.location,
      gender: initialData?.gender,
      tags: initialData?.tags || [],
    },
  });

  const onSubmit = (data) => {
    console.log(initialData?.webinar?.webinarName, "webinarName");
    data["id"] = initialData?._id;
    let finalData = removeBlankAttributes(data);

    finalData["tags"] = data?.tags;
    finalData["createdBy"] = userData?.userName;
    if (Array.isArray(initialData?.webinar) && initialData?.webinar.length > 0)
      finalData["webinarName"] = initialData.webinar[0]?.webinarName;
    onConfirmEdit(finalData);
  };

  useLayoutEffect(() => {
    const filter = locations.filter(
      (item) => item.state === selectedState.value
    );
    console.log("filter", filter);

    setLocationsList(
      filter.map((item) => ({
        value: item.name,
        label: capitalizeWords(item.name),
      }))
    );
  }, [locations, selectedState]);

  useLayoutEffect(() => {
    if (typeof initialData?.location === "string") {
      const location = locationsMap.get(
        initialData.location.trim().toLowerCase()
      );
      const locationName = states.find(
        (item) => item.trim().toLowerCase() === location
      );

      if (locationName) {
        setSelectedState({
          value: locationName.trim().toLowerCase(),
          label: locationName,
        });
      } else {
        setSelectedState("");
      }
    }
  }, [initialData, locationsMap]);

  useEffect(() => {
    if (isSuccess) {
      setAddRequestModal(false);
      setLocationData(null);
    }
  }, [isSuccess]);

  return (
    <div className="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-slate-300/20 backdrop-blur-sm">
      <div className="flex flex-col gap-6 overflow-hidden rounded bg-white p-6 shadow-xl w-full mx-3 sm:w-[800px]">
        <h2 className="text-lg font-semibold text-center">
          Attendee Information
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                {...register("firstName")}
                type="text"
                className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-teal-500 focus:outline-none"
                placeholder="Enter First Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                {...register("lastName")}
                type="text"
                className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-teal-500 focus:outline-none"
                placeholder="Enter Last Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                {...register("phone")}
                type="tel"
                className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-teal-500 focus:outline-none"
                placeholder="Enter Phone Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Gender</label>
              <select
                {...register("gender")}
                className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Location</label>
              <input
                {...register("location")}
                type="text"
                className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-teal-500 focus:outline-none"
                placeholder="Enter Location"
              />
            </div>

            {/* <div>
              <div className="flex flex-row justify-between">
                <label className="block text-sm font-medium">State</label>
              </div>
              <Select
                options={states.map((option) => ({
                  value: option.trim().toLowerCase(),
                  label: option,
                }))}
                className="mt-1 text-sm shadow"
                placeholder="Choose Location"
                // Correctly setting the selected option
                value={selectedState}
                onChange={(selected) => {
                  setSelectedState(selected);
                  setValue("location", "");
                }}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: "1px solid #CBD5E1", // Red border if there's an error
                    borderRadius: "7px",
                  }),
                  placeHolder: (provided) => ({
                    ...provided,
                    color: "#9CA3AF",
                  }),
                }}
              />
            </div> */}

            <div>
              <label className="block text-sm mb-1 font-medium">Tags</label>

              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    value={tagData.filter((option) =>
                      field.value?.includes(option.value)
                    )}
                    className="w-full mt-2"
                    options={tagData}
                    onChange={(selectedOptions) => {
                      field.onChange(
                        selectedOptions.map((option) => option.value)
                      );
                    }}
                    isClearable={true}
                    placeholder="Tags"
                    menuPlacement="auto"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                  />
                )}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 mt-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-150"
          >
            {isLoading ? <TailwindLoader size={6} /> : "Submit"}
          </button>
        </form>

        <button
          onClick={() => setModal(null)}
          className="inline-flex h-10 items-center justify-center w-full mt-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-md"
        >
          Cancel
        </button>
      </div>

      {addRequestModal && (
        <AddRequestLocation
          setModal={setAddRequestModal}
          locationsData={locationData}
          isLoading={isLocationLoading}
          title={"Request Location"}
        />
      )}
    </div>
  );
};

export default EditModal;
