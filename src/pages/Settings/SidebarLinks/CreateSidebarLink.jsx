import React, { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";

import { useNavigate } from "react-router-dom";
import {
  addSidebarLink,
  getAllSidebarLinks,
} from "../../../features/actions/sidebarLink";
import { globalButton } from "../../../utils/style";

const CreateSidebarLink = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.sidebarLink);
  const { roles } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const onSubmit = (data) => {
    const body = { ...data, role: data.role?.value };
    dispatch(addSidebarLink(body)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(getAllSidebarLinks());
        navigate("/sidebarLinks");
      }
    });
  };

  const rolesOptions = useMemo(() => {
    if (!roles) return [];
    return roles.map(({_id, name}) => ({
      value: _id,
      label: name.split('_').join(" "),
    }));
  }, [roles]);

  return (
    <div className="">
      <div className="mt-14 ">
        <div className=" flex justify-center"></div>
        <div className="bg-white rounded-lg shadow-lg  sm:rounded-lg sm:max-w-5xl mt-8 mx-auto">
          <h3 className="text-gray-700 text-base text-center bg-gray-100 font-medium sm:text-xl p-2 rounded-t-lg uppercase">
            {" "}
            Add Sidebar Link{" "}
          </h3>
          <form
            className="space-y-6 mx-8 sm:mx-2  p-4 py-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="sm:flex space-y-6 sm:space-y-0 justify-between gap-10">
              <div className="w-full">
                <label className="font-medium">Title</label>
                <input
                  {...register("title", { required: true })}
                  type="text"
                  className="w-full mt-2  px-5 py-2 text-gray-500 border-slate-300 bg-transparent outline-none border focus:border-teal-400 shadow-sm rounded-lg"
                />
                {errors.title && (
                  <span className="text-red-500">Title is required</span>
                )}
              </div>
              <div className="w-full">
                <label className="font-medium">Link</label>
                <input
                  {...register("link", { required: true })}
                  type="text"
                  className="w-full mt-2  px-5 py-2 text-gray-500 border-slate-300 bg-transparent outline-none border focus:border-teal-400 shadow-sm rounded-lg"
                />
                {errors.link && (
                  <span className="text-red-500">Link is required</span>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 justify-between gap-10">
              
              <div className="w-full">
                <label className="font-medium">Role</label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable={true}
                      options={rolesOptions}
                      menuPlacement="top"
                      className="w-full mt-2"
                    />
                  )}
                />
              </div>
            </div>

            <div style={{ marginTop: "4rem" }}>
              <button
                disabled={isLoading}
                className={`${globalButton} min-w-full`}
              >
                {isLoading ? "Loading..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSidebarLink;
