import { useForm, Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import Select from "react-select";

import {
  addLocation,
  updateLocationState,
} from "../../../features/actions/location";
import { states } from "../../../utils/columnData";



const stateOptions = states.map((state) => ({ value: state, label: state }));

const AddRequestLocation = ({
  setModal,
  locationsData,
  title,
  isLoading = false,
}) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: locationsData?.name || "",
      state: locationsData?.state || null,
      previousName: locationsData?.previousName || null,
    },
  });

  const onSubmit = (data) => {
    if (locationsData && locationsData._id) {
      const payload = {
        id: locationsData._id,
        data,
      };

      dispatch(updateLocationState(payload));
    } else dispatch(addLocation(data));
  };

  return (
    // Modal container with high z-index
    <div className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-300/20 backdrop-blur-sm">
      {/* Modal content */}
      <div className="w-full max-w-md flex flex-col gap-4 overflow-hidden rounded bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-center">{title}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Location Name Input */}
          <div>
            <label
              htmlFor="locationName"
              className="block text-sm font-medium pb-2"
            >
              Location Name:
            </label>
            <input
              id="locationName"
              {...register("name", { required: "Location Name is required" })}
              type="text"
              placeholder="Enter Location Name"
              className={`w-full rounded-lg border focus:border-teal-500 outline-none p-2 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* State Selection Dropdown */}
          <div>
            <label
              htmlFor="stateSelect"
              className="block text-sm font-medium pb-2"
            >
              State:
            </label>
            <Controller
              name="state"
              control={control}
              rules={{ required: "State is required" }}
              render={({
                field: { onChange, value, ref },
                fieldState: { error },
              }) => (
                <>
                  <Select
                    inputId="stateSelect"
                    inputRef={ref}
                    options={stateOptions}
                    value={stateOptions.find(
                      (option) => option.value === value
                    )}
                    onChange={(selectedOption) =>
                      onChange(selectedOption ? selectedOption.value : null)
                    }
                    placeholder="Select or search state..."
                    isClearable
                    // --- FIX STARTS HERE ---
                    menuPortalTarget={document.body} // Render menu in body
                    styles={{
                      // Ensure menu rendered in portal is above the modal (z-[9999] needs higher index)
                      menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                      // Optional: Adjust control styling for error
                      control: (baseStyles) => ({
                        ...baseStyles,
                        borderColor: error
                          ? "rgb(239 68 68)"
                          : "rgb(209 213 219)",
                        "&:hover": {
                          borderColor: error
                            ? "rgb(239 68 68)"
                            : baseStyles.borderColor,
                        },
                      }),
                    }}
                    // --- FIX ENDS HERE ---
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-150"
          >
            {isLoading ? "Loading..." : "Submit"}
          </button>
        </form>

        <button
          onClick={() => setModal(null)}
          className="inline-flex h-10 items-center justify-center w-full text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition duration-300 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddRequestLocation;
