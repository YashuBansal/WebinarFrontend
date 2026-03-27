import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { Box, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { setTableMasked } from "../../features/slices/tableSlice";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import useRoles from "../../hooks/useRoles";
import {
  Addon,
  API,
  Billing,
  Dropdown,
  LandingPageIcon,
  LeadTypeIcon,
  LocationIcon,
  Plan,
  ProductLevelIcon,
  SidebarLinksIcon,
  Tags,
} from "./SVGs";
import { clearOTPGenerated } from "../../features/slices/auth";
import useUserSubscription from "../../hooks/useUserSubscription";

const ViewSettings = () => {
  const roles = useRoles();
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { isTablesMasked } = useSelector((state) => state.table);
  const { isLoading, isSuccess } = useSelector((state) => state.auth);

  const { data: subscription } = useUserSubscription();
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const isCustomStatusEnabled = tableConfig?.isCustomOptionsAllowed || false;

  const settingsLinks = [
    {
      to: "/locations",
      name: "Location",
      icon: <img src={LocationIcon} alt="Location" className="w-10 h-10" />,
      allowedRoles: [roles.SUPER_ADMIN],
    },
    {
      to: "/plans",
      name: "Plans",
      icon: <img src={Plan} alt="Plan" className="w-10 h-10" />,
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
    },
    {
      to: "/addons",
      name: "Manage Addons",
      icon: <img src={Addon} alt="Addon" className="w-10 h-10" />,
      allowedRoles: [roles.SUPER_ADMIN],
    },
    {
      to: "/addons/buy",
      name: "Buy Addons",
      icon: <img src={Addon} alt="Addon" className="w-10 h-10" />,
      allowedRoles: [roles.ADMIN],
    },
    {
      to: "/tags",
      name: "Tags",
      icon: <img src={Tags} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.ADMIN],
    },
    {
      to: "/billing-history",
      name: "Billing History",
      icon: <img src={Billing} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.ADMIN],
    },
    {
      to: "/pabblyToken",
      name: "External API Token",
      icon: <img src={API} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
    },
    {
      to: "/settings/custom-status",
      name: `${roles.isSuperAdmin() ? "Default" : "Custom"} Options`,
      icon: <img src={Dropdown} alt="Tags" className="w-10 h-10" />,
      conditions: [isCustomStatusEnabled || roles.isSuperAdmin()],
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
    },
    {
      to: "/lead-type",
      name: "Lead Types",
      icon: <img src={LeadTypeIcon} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.ADMIN],
    },
    {
      to: "/product-level",
      name: "Product Level",
      icon: <img src={ProductLevelIcon} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.ADMIN],
    },
    {
      to: "/sidebarLinks",
      name: "Sidebar Links",
      icon: <img src={SidebarLinksIcon} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.SUPER_ADMIN],
    },
    {
      to: "/update-landing-page",
      name: "Landing Page",
      icon: <img src={LandingPageIcon} alt="Tags" className="w-10 h-10" />,
      allowedRoles: [roles.SUPER_ADMIN],
    },
  ];

  const handleMaskedTablesChange = (event) => {
    dispatch(setTableMasked(event.target.checked));
  };

  const addUserActivityLog = (link, type) => {
    logUserActivity({
      action: "navigate",
      detailItem: link,
      navigateType: type,
    });
  };

  useEffect(() => {
    if (isSuccess) {
      dispatch(clearOTPGenerated());
    }
  }, [isSuccess]);

  return (
    <Box className="mt-10 text-center">
      <Typography variant="h4" className="font-bold">
        SETTINGS
      </Typography>
      {/* Tailwind Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 my-10 md:mx-10 px-5">
        {/* Render links dynamically */}
        {settingsLinks.map(
          ({ to, name, icon, allowedRoles, conditions = [] }, index) => (
            <ComponentGuard
              key={index}
              allowedRoles={allowedRoles}
              conditions={conditions}
            >
              <Link
                to={to}
                onClick={() => addUserActivityLog(to, "page")}
                className={`flex items-center justify-center gap-3 font-bold text-xl rounded-lg bg-white h-20 w-full cursor-pointer hover:bg-neutral-200 text-green-600 shadow-lg`}
              >
                {icon}
                <Typography>{name}</Typography>
              </Link>
            </ComponentGuard>
          )
        )}

        {/* Masked Tables Option */}
        <div className="flex items-center justify-center gap-3 font-bold text-xl rounded-lg bg-white h-20 w-full cursor-pointer text-green-700 shadow-lg">
          <FormControlLabel
            control={
              <Checkbox
                checked={isTablesMasked}
                onChange={handleMaskedTablesChange}
                color="primary"
              />
            }
            label={<Typography>Masked Tables</Typography>}
          />
        </div>
      </div>
    </Box>
  );
};

export default ViewSettings;
