import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { closeModal } from "../../../features/slices/modalSlice";
import { useDispatch, useSelector } from "react-redux";
import { filterTruthyValues, successToast } from "../../../utils/extra";
import Select from "react-select";
import { setAllAttendeesFilters } from "../../../features/slices/filters.slice";
import { allAttendeesSortByOptions } from "../../../utils/columnData";
import { getCustomOptionsForFilters } from "../../../features/actions/globalData";
import { getAllProductsByAdminId } from "../../../features/actions/product";
import tagsService from "../../../services/tagsService";
import { globalButton } from "../../../utils/style";
import CreatableSelect from "react-select/creatable";

const GroupedAttendeeFilterModal = ({ modalName, setPage, handleCopy }) => {
  const dispatch = useDispatch();
  const { control, handleSubmit, reset, watch } = useForm();

  const { leadTypeData } = useSelector((state) => state.assign);
  const { subscription } = useSelector((state) => state.auth);
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const { allAttendeesFilters, allAttendeesSortBy } = useSelector(
    (state) => state.filters
  );
  const { productDropdownData } = useSelector((state) => state.product);
  const { customOptionsForFilters } = useSelector((state) => state.globalData);
  const { employeeData } = useSelector((state) => state.employee);
  const [sortBy, setSortBy] = useState(
    allAttendeesSortBy || {
      sortBy: allAttendeesSortByOptions[0].value,
      sortOrder: "asc",
    }
  );
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [tagData, setTagData] = useState([]);
  const [salesOptions, setSalesOptions] = useState([]);
  const [reminderOptions, setReminderOptions] = useState([]);

  const onSubmit = (data) => {
    console.log(data);
    const filterData = filterTruthyValues(data);
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    dispatch(
      setAllAttendeesFilters({
        filters: filterData,
        sortBy: sortBy,
      })
    );
    setPage(1);
    onClose();
  };

  const onCopy = (e) => {
    e.preventDefault();
    const formValues = watch();
    const filterData = filterTruthyValues(formValues);
    handleCopy(filterData);
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  const resetForm = () => {
    reset({
      email: "",
      "timeInSession.$gte": "",
      "timeInSession.$lte": "",
      "createdAt.$gte": "",
      "createdAt.$lte": "",
      "attendedWebinarCount.$gte": "",
      "attendedWebinarCount.$lte": "",
      "registeredWebinarCount.$gte": "",
      "registeredWebinarCount.$lte": "",
      leadType: "",
      lastAssignedTo: "",
      enrollments: [],
      tags: [],
      professions: [],
    });
  };

  useEffect(() => {
    // Block scroll when modal is open
    document.body.style.overflow = "hidden";
    console.log(allAttendeesFilters);

    reset({
      email: "",
      "timeInSession.$gte": "",
      "timeInSession.$lte": "",
      "createdAt.$gte": "",
      "createdAt.$lte": "",
      "attendedWebinarCount.$gte": "",
      "attendedWebinarCount.$lte": "",
      "registeredWebinarCount.$gte": "",
      "registeredWebinarCount.$lte": "",
      ...allAttendeesFilters,
    });
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    dispatch(getCustomOptionsForFilters());
    dispatch(getAllProductsByAdminId());

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

  useEffect(() => {
    if (!leadTypeData) return;
    const options = leadTypeData.map((item) => ({
      value: item._id,
      label: item.label,
      color: item.color,
    }));
    setLeadTypeOptions(options);
  }, [leadTypeData]);

  useEffect(() => {
    if (!Array.isArray(employeeData)) return;
    console.log(employeeData);

    setReminderOptions(
      employeeData
        .filter((emp) => emp.role === "EMPLOYEE_REMINDER")
        .map((item) => ({
          value: item._id,
          label: item.userName,
        }))
    );
    setSalesOptions(
      employeeData
        .filter((emp) => emp.role === "EMPLOYEE_SALES")
        .map((item) => ({
          value: item._id,
          label: item.userName,
        }))
    );
  }, [employeeData]);

  useEffect(() => {
    if (!productDropdownData) return;
    const options = productDropdownData.map((item) => ({
      value: item._id,
      label: `${item.name} | Level - ${item.level}`,
    }));
    setProductOptions(options);
  }, [productDropdownData]);

  return (
    <div className="absolute z-[1000] inset-0 -bottom-12 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
        <div className="p-4 border-b flex justify-between border-gray-200">
          <h2 className="text-lg font-semibold">Attendee Filters</h2>
        </div>

        <div className="px-4 pt-4 pb-8 max-h-96 overflow-y-auto">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-x-3 sm:grid-cols-3"
          >
            {tableConfig?.email?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Email"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  )}
                />
              </div>
            )}

            {tableConfig?.leadType?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Lead Type
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="leadType"
                    render={({ field }) => (
                      <Select
                        isMulti
                        value={leadTypeOptions.filter((option) =>
                          field.value?.includes(option.value)
                        )}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        className="w-full mt-2"
                        options={leadTypeOptions}
                        isClearable={true}
                        placeholder="Lead Type"
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                        }}
                        getOptionLabel={(e) => (
                          <div className="flex items-center gap-5">
                            <div
                              style={{ backgroundColor: e.color }}
                              className="w-10 h-5 rounded-sm mr-2"
                            ></div>
                            {e.label}
                          </div>
                        )}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.enrollments?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Enrollments
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="enrollments"
                    render={({ field }) => (
                      <Select
                        isMulti
                        value={productOptions.filter((option) =>
                          field.value?.includes(option.value)
                        )}
                        className="w-full mt-2"
                        options={productOptions}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        isClearable={true}
                        placeholder="Enrollments"
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
            )}

            {tableConfig?.timeInSession?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Time In Session
                </label>
                <div className="flex space-x-4">
                  <Controller
                    name="timeInSession.$gte"
                    control={control}
                    rules={{ min: 0 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Min"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="timeInSession.$lte"
                    control={control}
                    rules={{ min: 0 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Max"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.createdAt?.filterable && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <Controller
                    name="createdAt.$gte"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <Controller
                    name="createdAt.$lte"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    )}
                  />
                </div>
              </>
            )}

            {tableConfig?.registeredWebinarCount?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Webinar Registered
                </label>
                <div className="flex space-x-4">
                  <Controller
                    name="registeredWebinarCount.$gte"
                    control={control}
                    rules={{ min: 0 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Min"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="registeredWebinarCount.$lte"
                    control={control}
                    rules={{ min: 0 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Max"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.attendedWebinarCount?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Webinar Attended
                </label>
                <div className="flex space-x-4">
                  <Controller
                    name="attendedWebinarCount.$gte"
                    control={control}
                    rules={{ min: 0 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Min"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="attendedWebinarCount.$lte"
                    control={control}
                    rules={{ min: 0 }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Max"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.reminderAssignedTo?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Reminder Assigned To
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="reminderAssignedTo"
                    render={({ field }) => (
                      <Select
                        isMulti
                        value={reminderOptions.filter((option) =>
                          field.value?.includes(option.value)
                        )}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        className="w-full mt-2"
                        options={reminderOptions}
                        isClearable={true}
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                        }}
                        placeholder="Reminder Assigned To"
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.salesAssignedTo?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sales Assigned To
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="salesAssignedTo"
                    render={({ field }) => (
                      <Select
                        isMulti
                        value={salesOptions.filter((option) =>
                          field.value?.includes(option.value)
                        )}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        className="w-full mt-2"
                        options={salesOptions}
                        isClearable={true}
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                        }}
                        placeholder="Sales Assigned To"
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.reminderLastStatus?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Reminder Last Status
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="reminderLastStatus"
                    render={({ field }) => (
                      <Select
                        isMulti
                        value={customOptionsForFilters.filter((option) =>
                          field.value?.includes(option.label)
                        )}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.label)
                          );
                        }}
                        className="w-full mt-2"
                        options={customOptionsForFilters}
                        isClearable={true}
                        placeholder="Reminder Last Status"
                        menuPlacement="top"
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
            )}

            {tableConfig?.salesLastStatus?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sales Last Status
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="salesLastStatus"
                    render={({ field }) => (
                      <Select
                        isMulti
                        value={customOptionsForFilters.filter((option) =>
                          field.value?.includes(option.label)
                        )}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.label)
                          );
                        }}
                        className="w-full mt-2"
                        options={customOptionsForFilters}
                        isClearable={true}
                        placeholder="Sales Last Status"
                        menuPlacement="top"
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
            )}

            {tableConfig?.tags?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="tags"
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
            )}

            {tableConfig?.locations?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Locations
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="locations"
                    defaultValue={[]}
                    render={({ field }) => (
                      <CreatableSelect
                        isMulti
                        isClearable
                        styles={{
                          menu: (provided, state) => ({
                            ...provided,
                            display: state.options?.length ? "block" : "none",
                          }),
                        }}
                        // No 'options' prop, so no dropdown list appears by default
                        // The component's value needs to be in the format: { value: 'tag', label: 'tag' }
                        // We map the string array from the form state to this format.
                        value={
                          field.value?.map((location) => ({
                            value: location,
                            label: location,
                          })) || []
                        }
                        onChange={(selectedOptions) => {
                          // And we map it back to a simple string array for react-hook-form
                          field.onChange(
                            selectedOptions
                              ? selectedOptions.map((option) => option.value)
                              : []
                          );
                        }}
                        className="w-full mt-2"
                        placeholder="Type Locations"
                        components={{
                          DropdownIndicator: () => null, // 🔥 removes dropdown icon
                          IndicatorSeparator: () => null, // optional: removes the vertical bar separator
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {(tableConfig?.professions?.filterable !== false) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Professions
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="professions"
                    defaultValue={[]}
                    render={({ field }) => (
                      <CreatableSelect
                        isMulti
                        isClearable
                        styles={{
                          menu: (provided, state) => ({
                            ...provided,
                            display: state.options?.length ? "block" : "none",
                          }),
                        }}
                        value={
                          field.value?.map((prof) => ({
                            value: prof,
                            label: prof,
                          })) || []
                        }
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions
                              ? selectedOptions.map((option) => option.value)
                              : []
                          );
                        }}
                        className="w-full mt-2"
                        placeholder="Type Professions"
                        components={{
                          DropdownIndicator: () => null,
                          IndicatorSeparator: () => null,
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {tableConfig?.sources?.filterable && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sources
                </label>
                <div className="flex space-x-4">
                  <Controller
                    control={control}
                    name="sources"
                    defaultValue={[]}
                    render={({ field }) => (
                      <CreatableSelect
                        isMulti
                        isClearable
                        styles={{
                          menu: (provided, state) => ({
                            ...provided,
                            display: state.options?.length ? "block" : "none",
                          }),
                        }}
                        // No 'options' prop, so no dropdown list appears by default
                        // The component's value needs to be in the format: { value: 'tag', label: 'tag' }
                        // We map the string array from the form state to this format.
                        value={
                          field.value?.map((source) => ({
                            value: source,
                            label: source,
                          })) || []
                        }
                        onChange={(selectedOptions) => {
                          // And we map it back to a simple string array for react-hook-form
                          field.onChange(
                            selectedOptions
                              ? selectedOptions.map((option) => option.value)
                              : []
                          );
                        }}
                        className="w-full mt-2"
                        placeholder="Type Sources"
                        components={{
                          DropdownIndicator: () => null, // 🔥 removes dropdown icon
                          IndicatorSeparator: () => null, // optional: removes the vertical bar separator
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                value={sortBy.sortBy}
                onChange={(e) =>
                  setSortBy((prev) => ({
                    ...prev,
                    sortBy: e.target.value,
                  }))
                }
                className="border rounded-md p-2 text-sm"
              >
                {allAttendeesSortByOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Order</label>
              <select
                value={sortBy.sortOrder}
                onChange={(e) =>
                  setSortBy((prev) => ({
                    ...prev,
                    sortOrder: e.target.value,
                  }))
                }
                className="border rounded-md p-2 text-sm"
              >
                <option value="asc">A - Z</option>
                <option value="desc">Z - A</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between md:flex-row flex-col gap-2">
            <div className="flex justify-between md:justify-center gap-2 md:w-auto w-full">
              <button onClick={resetForm} className={globalButton}>
                Reset
              </button>
              <button
                onClick={onCopy}
                className={`${globalButton} bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500`}
              >
                Copy API
              </button>
            </div>
            <div className="flex justify-between md:justify-center gap-2 md:w-auto w-full">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-500 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button onClick={handleSubmit(onSubmit)} className={globalButton}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupedAttendeeFilterModal;
