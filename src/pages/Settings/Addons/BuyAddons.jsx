import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useRoles from "../../../hooks/useRoles";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { getAddons } from "../../../features/actions/pricePlan";
import { resetAddonsData } from "../../../features/slices/pricePlan";
import AddonCard from "./AddonCard";

const BuyAddOnsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();

  const { userData } = useSelector((state) => state.auth);
  const { addonsData = [] } = useSelector((state) => state.pricePlans);

  useEffect(() => {
    dispatch(getAddons());
    return () => {
      dispatch(resetAddonsData());
    };
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen px-6 pt-14">
      <h1 className="text-2xl font-bold text-center mb-6">Buy AddOns</h1>

      <div className="flex justify-end mb-6">
        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          <button
            onClick={() => navigate(`/addons/${userData?._id}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            My AddOns
          </button>
        </ComponentGuard>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {addonsData.map((addon) => (
          <AddonCard
            key={addon._id}
            addon={addon}
            roles={roles}
            id={addon._id}
            showExpiryDate={true}
          />
        ))}
      </div>
    </div>
  );
};

export default BuyAddOnsPage;

