import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPricePlans } from "../../features/actions/pricePlan";
import PlanCard from "../Settings/Plans/PlanCard";
import { errorToast } from "../../utils/extra";
import { useNavigate, useParams } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { updateClientPlan } from "../../features/actions/client";
import { resetClientState } from "../../features/slices/client";
import { Switch, FormControlLabel, Typography, Box } from "@mui/material";

const UpdateClientPlan = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { planData } = useSelector((state) => state.pricePlans);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [durationType, setDurationType] = useState(null);
  const [isYearly, setIsYearly] = useState(false); // Toggle for monthly/yearly

  const { isUpdating, isSuccess } = useSelector((state) => state.client);

  // Memoize filtered plans to prevent unnecessary re-renders
  const filteredPlans = useMemo(() => {
    if (!planData || !Array.isArray(planData)) return [];
    
    const durationType = isYearly ? "yearly" : "monthly";
    
    return planData.filter((item) => {
      const durationConfig = item.planDurationConfig?.[durationType];
      return durationConfig?.isEnabled === true;
    });
  }, [planData, isYearly]);

  useEffect(() => {
    dispatch(getPricePlans());
  }, []);

  const handleConfirmPlan = () => {
    if (!selectedPlan) errorToast("Please select a plan");
    if(!id) errorToast("Client ID not found");
    const payload = {
      adminId: id,
      planId: selectedPlan,
      durationType,
    };
    console.log(payload);
    dispatch(updateClientPlan(payload));
  };

  useEffect(() => {
    if (isSuccess) {
      navigate("/clients");
      dispatch(resetClientState())
    }
  }, [isSuccess]);

  return (
    <div className=" w-full pt-14 p-6">
      <div className="p-6 bg-gray-50  rounded-lg">
        <div className="flex gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-700">Update Plan</h2>
          <button
            onClick={handleConfirmPlan}
            disabled={!selectedPlan || isUpdating}
            className=" px-6 w-fit bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
          >
            {isUpdating ? (
              <ClipLoader size={20} color="#fff" />
            ) : (
              "Confirm Plan"
            )}
          </button>
        </div>

        {/* Monthly/Yearly Toggle */}
        <Box className="flex justify-center mb-6">
          <FormControlLabel
            control={
              <Switch
                checked={isYearly}
                onChange={(e) => setIsYearly(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="h6" className="ml-2">
                {isYearly ? "Yearly Plans" : "Monthly Plans"}
              </Typography>
            }
          />
        </Box>

        <div className="flex overflow-x-auto gap-4">
          {filteredPlans.map((item, index) => (
            <div key={item._id || index} className="min-w-72">
              <PlanCard
                plan={item}
                isSelectVisible={true}
                selectedPlan={selectedPlan}
                isYearly={isYearly}
                handlePlanSelection={(id, billing) => {
                  setSelectedPlan(id);
                  setDurationType(billing.durationType || (isYearly ? "yearly" : "monthly"));
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpdateClientPlan;
