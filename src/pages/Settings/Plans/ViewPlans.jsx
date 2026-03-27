import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getExternalPlanURI, getPricePlans } from "../../../features/actions/pricePlan";
import PlanCard from "./PlanCard";
import useUserSubscription from "../../../hooks/useUserSubscription";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import useRoles from "../../../hooks/useRoles";
import { Link } from "react-router-dom";
import { resetPricePlanSuccess } from "../../../features/slices/pricePlan";
import PlanInactiveModal from "./PlanInactiveModal";
import { globalButton } from "../../../utils/style";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const BrowseHeader = ({planURI}) => {
  return (
    <div className="bg-gradient-to-r from-neutral-600 to-neutral-700 text-white p-8 rounded-xl mb-10 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Browse Our Plans
          </h1>
          <p className="mt-2 max-w-2xl text-gray-300">
            Explore our full range of subscription tiers. Find the perfect fit
            for your needs and unlock powerful features to elevate your workflow.
          </p>
        </div>
        <div className="flex-shrink-0 mt-4 md:mt-0">
          <a
            href={planURI}
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-200 transition-all duration-300 shadow-md transform hover:scale-105"
          >
            Explore All Features
            <ArrowForwardIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

const ViewPlans = () => {
  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const { planData, isPlanDeleted, isSuccess, isLoading } = useSelector(
    (state) => state.pricePlans
  );
  const dispatch = useDispatch();

  const [modalData, setModalData] = useState(null);
  const [planType, setPlanType] = useState("active");
  const [planDuration, setPlanDuration] = useState("monthly"); // monthly | yearly | custom

  const durationTabs = useMemo(() => {
    const tabs = [
      { key: "monthly", label: "Monthly" },
      { key: "yearly", label: "Yearly" },
    ];

    if (userData && roles?.isSuperAdmin?.(userData.role)) {
      tabs.push({ key: "custom", label: "Custom" });
    }

    return tabs;
  }, [roles, userData]);

  // Ensure selected tab is valid for current role
  useEffect(() => {
    if (!durationTabs.find((tab) => tab.key === planDuration)) {
      setPlanDuration(durationTabs[0]?.key || "monthly");
    }
  }, [durationTabs, planDuration]);

  const planDataFiltered = useMemo(() => {
    if (!Array.isArray(planData) || !userData || !roles) return [];

    const durationType = planDuration;
    const durationFilteredPlans = planData.filter((item) => {
      const durationConfig = item.planDurationConfig?.[durationType];
      return durationConfig?.isEnabled === true;
    });

    if (roles.isSuperAdmin(userData.role)) return durationFilteredPlans;
    if (!subscription || !subscription.plan) return [];
    const plan = durationFilteredPlans.find((plan) => plan._id === subscription.plan._id);
    if (!plan) return [];
    return [plan];
  }, [userData, planData, roles, subscription, planDuration]);

  useEffect(() => {
    dispatch(getPricePlans({ isActive: planType }));
  }, [planType]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getPricePlans({ isActive: planType }));
      resetPricePlanSuccess();
    }
  }, [isSuccess]);


  return (
    <div className="py-14 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-screen-2xl">
        {/* <BrowseHeader planURI={planURI}/> */}
      </div>

      <div className="p-6 bg-gray-50 rounded-lg w-full">
        <div className="flex gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-700">Manage Plans</h2>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            {durationTabs.map((tab) => {
              const isActive = tab.key === planDuration;
              return (
                <button
                  key={tab.key}
                  onClick={() => setPlanDuration(tab.key)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1   lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          <div className="col-span-full  flex justify-end items-end pt-6">
            <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
              <div className=" flex gap-5 w-full justify-between flex-wrap">
                <div className="flex gap-5 justify-between w-full md:w-auto">
                  <Link to="/plans/order">
                    <button className={globalButton}>Change Order</button>
                  </Link>
                  <Link to="/plans/addPlan">
                    <button className={globalButton}>Add Plan</button>
                  </Link>
                </div>

                <button
                  onClick={() => {
                    setPlanType(planType === "active" ? "inactive" : "active");
                  }}
                  disabled={isLoading}
                  className={globalButton}
                >
                  {planType === "active" ? "Inactive" : "Active"} Plans
                </button>
              </div>
            </ComponentGuard>
          </div>
          {planDataFiltered?.map((item, idx) => {
            return (
              <div key={idx} className="">
                <PlanCard
                  plan={item}
                  planType={planType}
                  setModalData={setModalData}
                  isMenuVisible={true}
                  key={item?._id}
                  currentPlan={subscription?.plan?._id}
                  isYearly={planDuration === "yearly"}
                />
              </div>
            );
          })}
        </div>
        {modalData && (
          <PlanInactiveModal
            setModalData={setModalData}
            modalData={modalData}
            planType={planType}
          />
        )}
      </div>
    </div>
  );
};

export default ViewPlans;