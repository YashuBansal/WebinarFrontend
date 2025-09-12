import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getExternalPlanURI, getPricePlans } from "../../../features/actions/pricePlan";
import PlanCard from "./PlanCard";
import { getUserSubscription } from "../../../features/actions/auth";
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
  const { userData, subscription } = useSelector((state) => state.auth);
  const { planData, isPlanDeleted, isSuccess, isLoading } = useSelector(
    (state) => state.pricePlans
  );
  const dispatch = useDispatch();

  const [modalData, setModalData] = useState(null);
  const [planType, setPlanType] = useState("active");

  const planDataFiltered = useMemo(() => {
    if (!Array.isArray(planData) || !userData || !roles) return [];
    if (roles.isSuperAdmin(userData.role)) return planData;
    if (!subscription || !subscription.plan) return [];
    const plan = planData.find((plan) => plan._id === subscription.plan._id);
    if (!plan) return [];
    return [plan];
  }, [userData, planData, roles, subscription]);

  useEffect(() => {
    dispatch(getPricePlans({ isActive: planType }));
  }, [planType]);

  useEffect(() => {
    dispatch(getUserSubscription());
  }, []);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getPricePlans({ isActive: planType }));
      resetPricePlanSuccess();
    }
  }, [isSuccess]);

    const [planURI, setPlanURI] = useState("/");
  useEffect(() => {
    dispatch(getExternalPlanURI()).then((response) => {
      if (
        response?.meta?.requestStatus === "fulfilled" &&
        typeof response.payload === "string"
      ) {
        setPlanURI(response.payload);
      }
    });
  }, [dispatch]);

  return (
    <div className="py-14 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-screen-2xl">
        <BrowseHeader planURI={planURI}/>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg w-full">
        <div className="flex gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-700">Manage Plans</h2>
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