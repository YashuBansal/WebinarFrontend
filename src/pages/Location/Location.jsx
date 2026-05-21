import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "@mui/material/Button";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { PencilEditIcon } from "../../components/SVGs";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import { openModal } from "../../features/slices/modalSlice";
import DataTable from "../../components/Table/DataTable";
import useRoles from "../../hooks/useRoles";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import {
  getLocationRequests,
  getLocations,
} from "../../features/actions/location";
import { locationTableColumns } from "../../utils/columnData";
import RequestApprovalDisapprovalModal from "./Modal/RequestApprovalDisapprovalModal";
import AddRequestLocation from "./Modal/AddRequestLocation";
import { resetLocationSuccess } from "../../features/slices/location";
import LocationModal from "./Modal/LocationModal";
import { globalButton } from "../../utils/style";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";

const Locations = () => {
  const [selectedModalName, setSelectedModalName] = useState(null);
  const location = useLocation();
  if (location.pathname === "/locations/requests") {
    var tableHeader = "Location Requests";
  } else {
    var tableHeader = "Locations";
  }
  // ----------------------- Constants -----------------------
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const roles = useRoles();

  const isSuperAdmin = roles.isSuperAdmin();
  const isEmployeeId = roles.isEmployeeId();

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(searchParams.get("page") || 1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addRequestModal, setAddRequestModal] = useState(false);
  const [locationData, setLocationData] = useState(null)

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const {
    locationsData,
    locationRequests,
    isLoading,
    pagination,
    isSuccess,
    isImporting,
  } = useSelector((state) => state.location);

  const { total = 0, totalPages = 1 } = pagination;
  const { userData } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log("page", location.pathname);
    if (location.pathname === "/locations/requests") {
      dispatch(
        getLocationRequests({
          page: page,
          limit: LIMIT,
        })
      );
    } else {
      dispatch(
        getLocations({
          page: page,
          limit: LIMIT,
        })
      );
    }
  }, [page, LIMIT, location]);

  useEffect(() => {
    if (isSuccess) {
      if (location.pathname === "/locations/requests") {
        dispatch(
          getLocationRequests({
            page: page,
            limit: LIMIT,
          })
        );
      } else {
        dispatch(
          getLocations({
            page: page,
            limit: LIMIT,
          })
        );
      }

      dispatch(resetLocationSuccess());
      setShowLocationModal(false);
      setAddRequestModal(false);
      setSelectedModalName(null);
      setLocationData(null);
    }
  }, [page, LIMIT, isSuccess]);

  useEffect(() => {
    setSearchParams({ page: page });
  }, [page]);

  // useEffect(() => {
  //   function onNotification(data) {
  //     if (
  //       (data.actionType === NotifActionType.LOCATION_REQUEST)
  //     )
  //       if (page === 1) {

  //         dispatch(

  //         );
  //       } else setPage(1);
  //   }
  //   socket.on("notification", onNotification);
  //   return () => {
  //     socket.off("notification", onNotification);
  //   };
  // }, [

  // ]);

  // ------------------- Action Icons -------------------
  const actionIcons = [
    ...(userData?.isActive && location.pathname === "/locations/requests" && !isEmployeeId
      ? [
          {
            icon: (item) =>
              !item?.deactivated &&
              (roles.isSuperAdmin(userData?.role)
                ? !item?.isVerified
                : !item?.isAdminVerified) && (
                <CheckBoxIcon className="text-green-500 group-hover:text-green-600" />
              ),
            tooltip: "Checkbox",

            onClick: (item) => {
              if (
                !item?.deactivated && roles.isSuperAdmin(userData?.role)
                  ? !item?.isVerified
                  : !item?.isAdminVerified
              ) {
                setSelectedModalName("requestApprovalModal");
                dispatch(
                  openModal({
                    modalName: "requestApprovalModal",
                    data: item,
                  })
                );
              }
            },
          },
          {
            icon: (item) =>
              !item?.deactivated &&
              (roles.isSuperAdmin(userData?.role)
                ? !item?.isVerified
                : !item?.isAdminVerified) && (
                <DisabledByDefaultIcon className="text-red-500 group-hover:text-red-600" />
              ),
            tooltip: "DisabledByDefault",
            onClick: (item) => {
              if (
                !item?.deactivated && roles.isSuperAdmin(userData?.role)
                  ? !item?.isVerified
                  : !item?.isAdminVerified
              ) {
                setSelectedModalName("requestDisapprovalModal");
                dispatch(
                  openModal({
                    modalName: "requestDisapprovalModal",
                    data: item,
                  })
                );
              }
            },
          },
        ]
      : isSuperAdmin
      ? [
        // additional Edit action icon for super admin
        {
          icon: (item) =>(<img src={PencilEditIcon} alt="Edit" className="min-h-6 h-6 w-6 min-w-6" />),
          tooltip: "Checkbox",

          onClick: (item) => {
            console.log(item);
            setLocationData(item);
            setAddRequestModal(true);

          },
        },
      ]
      : []),
  ];

  return (
    <HubSubpageShell showBack={false}>
      <div className="rounded-2xl border border-slate-200 bg-white px-2 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 sm:rounded-3xl sm:px-5">
        {/* Add location Button */}
        <div className="flex items-center justify-between gap-2 pb-4">
          <div className="flex gap-2">
            <Button variant="outlined" onClick={() => navigate("/locations")}>
              Locations
            </Button>

            <ComponentGuard
              conditions={[userData?.isActive]}
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/locations/requests")}
              >
                Requests
              </Button>
            </ComponentGuard>
          </div>

          <ComponentGuard conditions={[userData?.isActive]}>
            <div className="flex gap-2">
              <button
                className={globalButton}
                onClick={() => setAddRequestModal(() => !addRequestModal)}
              >
                {roles.SUPER_ADMIN === userData?.role ? "Add" : "Request"}{" "}
                Location
              </button>

              {isSuperAdmin && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setShowLocationModal(true)}
                >
                  Import
                </Button>
              )}
            </div>
          </ComponentGuard>
        </div>

        <DataTable
          tableHeader={tableHeader}
          tableUniqueKey="locationRequestsTable"
          tableData={{
            columns:
              location.pathname === "/locations/requests"
                ? locationTableColumns
                : locationTableColumns.filter(
                    (column) =>
                      ![
                        "employeeEmail",
                        "isAdminVerified",
                        "adminEmail",
                        "previousName",
                      ].includes(column.key)
                  ),
            rows:
              location.pathname === "/locations/requests"
                ? locationRequests
                : locationsData,
          }}
          actions={actionIcons}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          limit={LIMIT}
          isLoading={isLoading}
        />
      </div>

      <RequestApprovalDisapprovalModal modalName={selectedModalName} />
      {addRequestModal && (
        <AddRequestLocation
          setModal={setAddRequestModal}
          locationsData={locationData}
          isLoading={isLoading}
          title={
            userData?.role === roles.SUPER_ADMIN
              ? "Add Location"
              : "Request Location"
          }
        />
      )}
      {showLocationModal && (
        <LocationModal
          isLoading={isImporting}
          isSuccess={isSuccess}
          setShowLocationModal={setShowLocationModal}
        />
      )}
    </HubSubpageShell>
  );
};

export default Locations;
