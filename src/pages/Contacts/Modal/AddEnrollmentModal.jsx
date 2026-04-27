import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { getAllProducts, getEnrollmentsByEmail } from "../../../features/actions/product";
import { addEnrollment } from "../../../features/actions/attendees";
import AppLoader from "../../../components/AppLoader";
import { clearProductData } from "../../../features/slices/product";
import { formatDateAsNumber } from "../../../utils/extra";

const AddEnrollmentModal = ({ setModal, attendeeEmail, webinarData, logUserActivity, userData }) => {
  const { productData } = useSelector((state) => state.product);
  console.log(webinarData, productData)
  const dispatch = useDispatch();
  const [loading , setLoading] = useState(false);

  useEffect(() => {
    console.log(webinarData)
    dispatch(getAllProducts({}));

    return () => {
      dispatch(clearProductData());
    }
  }, []);


  const { register, handleSubmit, formState: { errors },
} = useForm({
    defaultValues: {
      attendee: attendeeEmail || "",
      product: "",
      webinar: "",
    },
  });

  const onSubmit = (data) => {
    data["attendee"] = attendeeEmail;
    data["createdBy"] = userData?.userName;
    console.log('productData',productData)
    const selectedProduct = productData.find((item) => item._id === data.product);
    console.log('productData',selectedProduct)

    if(selectedProduct)
    data["productName"] = selectedProduct?.name;

    const selectedWebinar = webinarData.find((item) => item?.webinar[0]?._id === data.webinar);
    if(selectedWebinar)
    data["webinarName"] = selectedWebinar?.webinar[0]?.webinarName;
    console.log(data)
    setLoading(true);
    dispatch(addEnrollment(data)).then(res => {
      if(res.meta.requestStatus === "fulfilled"){
        dispatch(getEnrollmentsByEmail({email:attendeeEmail}));
        setModal(false)
        logUserActivity({
          action: "addEnrollment",
          details: `User added an enrollment for the attendee with email: ${attendeeEmail}`,
          activityItem: attendeeEmail,
        });
      }
    })
    .finally(() => setLoading(false));
  };

  return (
    <div className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-300/20 backdrop-blur-sm">
      <div className="flex flex-col gap-6 overflow-hidden rounded bg-white p-6 shadow-xl sm:w-[800px]">
        <h2 className="text-lg font-semibold text-center">Add Enrollment</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Product</label>
            <select
              {...register("product",{ required: "Product is required" }) }
              className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-teal-500 focus:outline-none"
            >
              <option value="" className="md:text-md text-xs">Select Product</option>
              {productData &&
                productData.map((product) => (
                  <option value={product._id} key={product._id} className="md:text-md text-xs">
                    {product?.name} | Level: {product?.level} | Price:{" "}
                    {product?.price}
                  </option>
                ))}
            </select>
            {errors.product && (
              <p className="text-red-500 text-sm mt-1">{errors.product.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Webinar</label>
            <select
              {...register("webinar",{ required: "Webinar is required" })}
              className="mt-1 block w-full h-10 rounded border border-gray-300 px-3 focus:border-red-500 focus:outline-none"
            >
              <option value="" className="md:text-md text-xs">Select Webinar</option>
              {webinarData &&
                  webinarData.length > 0 &&
                  webinarData?.map((item, index) => (
                  <option value={item?.webinar[0]?._id} key={index} className="md:text-md text-xs">
                    {item?.webinar[0]?.webinarName} | {formatDateAsNumber(item?.webinar[0]?.webinarDate)}
                  </option>
                ))}
            </select>
            {errors.webinar && (
              <p className="text-red-500 text-sm mt-1">{errors.webinar.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-150"
            disabled={loading}
          >
          {
            loading ?
            <AppLoader size="md" variant="inverse" />
            : "Submit"
          }
          </button>
        </form>

        <button
          onClick={() => setModal(null)}
          className="inline-flex h-10 items-center justify-center w-full mt-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddEnrollmentModal;
