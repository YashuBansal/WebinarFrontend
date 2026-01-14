import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import DataTable from "../../components/Table/DataTable";

import { useDispatch, useSelector } from "react-redux";
import { clientTableColumns } from "../../utils/columnData";
import { useNavigate, useSearchParams } from "react-router-dom";
const UpdateClientModal = lazy(() =>
  import("../../components/Client/UpdateClientModal")
);
const ActiveInactiveModal = lazy(() =>
  import("../../components/Client/ActiveInactiveModal")
);
const ExportModal = lazy(() => import("../../components/Export/ExportModal"));
const ClientFilterModal = lazy(() =>
  import("../../components/Client/ClientFilterModal")
);
import { openModal } from "../../features/slices/modalSlice";
import {
  getAllClients,
  hardDeleteData,
  softDeleteClient,
} from "../../features/actions/client";
import ClientCard from "../../components/Client/ClientCard";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { getPlansForDropdown } from "../../features/actions/pricePlan";
import {
  VisibilityIcon,
  PencilEditIcon,
  GreenLogoutIcon,
  UpdatePlanIcon,
  RedLogoutIcon,
  SoftDeleteIcon,
  HardDeleteIcon,
} from "../../components/SVGs";
import { clearClientData } from "../../features/slices/client";
import { exportClientExcel } from "../../features/actions/export-excel";
import { globalButton } from "../../utils/style";
const ConfirmDeleteModal = lazy(() =>
  import("../../components/ConfirmDeleteModal")
);

const Clients = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ----------------------- ModalNames for Redux -----------------------
  const updateClientModalname = "UpdateClientModal";
  const updateClientStatusModalName = "UpdateClientStatusModal";
  const exportExcelModalName = "ExportClientExcel";
  const clientFilterModalName = "ClientFilterModal";
  const tableHeader = "Clients Table";

  const { modals } = useSelector((state) => state.modals);
  const openClientFilterModal = modals[clientFilterModalName] ? true : false;
  const openExportExcelModal = modals[exportExcelModalName] ? true : false;
  const openClientStatusModal = modals[updateClientStatusModalName]
    ? true
    : false;
  const openUpdateClientModal = modals[updateClientModalname] ? true : false;

  const [openDeleteModal, setDeleteModal] = useState(null);

  // ----------------------- Constants -----------------------
  const actionIcons = useMemo(
    () => [
      {
        icon: () => (
          <img
            src={VisibilityIcon}
            alt="Visibility"
            className="min-h-6 min-w-6 h-6 w-6"
          />
        ),
        tooltip: "View Client Info",
        type: "client-link",
      },
      {
        icon: (item) => (
          <img
            src={UpdatePlanIcon}
            alt="Update Plan"
            className="min-h-6 min-w-6 h-6 w-6"
          />
        ),
        tooltip: "Update Plan",
        onClick: (item) => {
          navigate(`/client/plan/${item?._id}`);
        },
      },
      {
        icon: () => (
          <img
            src={PencilEditIcon}
            alt="Edit"
            className="min-h-6 min-w-6 h-6 w-6"
          />
        ),
        tooltip: "Edit Client",
        onClick: (item) => {
          dispatch(openModal({ modalName: updateClientModalname, data: item }));
        },
      },
      {
        icon: (item) => (
          <img
            src={item?.isActive ? GreenLogoutIcon : RedLogoutIcon}
            alt="Toggle Status"
            className="min-h-6 min-w-6 h-6 w-6"
          />
        ),
        tooltip: "Toggle Status",
        onClick: (item) => {
          dispatch(
            openModal({
              modalName: updateClientStatusModalName,
              data: item,
            })
          );
        },
      },
      {
        icon: (item) => (
          <img
            src={SoftDeleteIcon}
            alt="Soft Delete"
            className="min-h-6 min-w-6 h-6 w-6"
          />
        ),
        tooltip: "Soft Delete",
        onClick: (item) => {
          setDeleteModal({
            type: "Soft",
            clientId: item._id,
          });
        },
      },
      {
        icon: (item) => (
          <img
            src={HardDeleteIcon}
            alt="Permanent Delete"
            className="min-h-6 min-w-6 h-6 w-6"
          />
        ),
        tooltip: "Permanent Delete",
        onClick: (item) => {
          dispatch(
            setDeleteModal({
              type: "Permanent",
              clientId: item._id,
            })
          );
        },
      },
    ],
    []
  );

  const {
    clientsData = [],
    isLoading,
    isUpdating,
    totalPages,
    isSuccess,
  } = useSelector((state) => state.client);
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ isActive: "active" });
  const [page, setPage] = useState(searchParams.get("page") || 1);

  const tableData = useMemo(() => {
    return {
      columns: clientTableColumns,
      rows: clientsData,
    };
  }, [clientsData]);

  // ----------------------- Functions -----------------------
  const ClientCards = (
    <div className=" gap-4 md:hidden grid  grid-cols-1">
      {clientsData.map((item, idx) => (
        <ClientCard key={idx} actions={actionIcons} item={item} />
      ))}
    </div>
  );

  // ----------------------- useEffects -----------------------

  useEffect(() => {
    dispatch(getAllClients({ page: page, limit: LIMIT, filters: filters }));
  }, [page, filters, LIMIT]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getAllClients({ page: page, limit: LIMIT, filters: filters }));
      setDeleteModal(null);
    }
  }, [isSuccess]);

  useEffect(() => {
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);

    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  useEffect(() => {
    dispatch(getPlansForDropdown());
    return () => {
      dispatch(clearClientData());
    };
  }, []);

  return (
    <div className="w-full pt-14 sm:px-5">
      <div className="flex justify-end mb-5">
        <button
          className={globalButton}
          onClick={() => navigate("/add-client")}
        >
          Add Client
        </button>
      </div>

      <DataTable
        tableHeader={tableHeader}
        tableUniqueKey="clientsListingTable"
        filters={filters}
        setFilters={setFilters}
        ClientCards={ClientCards}
        tableData={tableData}
        actions={actionIcons}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={LIMIT}
        filterModalName={clientFilterModalName}
        exportModalName={exportExcelModalName}
        isLoading={isLoading}
      />
      {openUpdateClientModal && (
        <Suspense fallback={<ModalFallback />}>
          <UpdateClientModal modalName={updateClientModalname} />
        </Suspense>
      )}

      {openClientStatusModal && (
        <Suspense fallback={<ModalFallback />}>
          <ActiveInactiveModal modalName={updateClientStatusModalName} />
        </Suspense>
      )}

      {openExportExcelModal && (
        <Suspense fallback={<ModalFallback />}>
          <ExportModal
            modalName={exportExcelModalName}
            columns={clientTableColumns}
            tableName={tableHeader}
            handleExport={({ limit, columns, includeFilter }) => {
              console.log("Exporting with filters:", columns, filters);
              dispatch(
                exportClientExcel({
                  limit,
                  columns: columns.join(","),
                  filters: includeFilter ? filters : {},
                })
              );
            }}
          />
        </Suspense>
      )}

      {openClientFilterModal && (
        <Suspense fallback={<ModalFallback />}>
          <ClientFilterModal
            setFilters={(filters) => {
              setFilters(filters);
              setPage(1);
            }}
            filters={filters}
            modalName={clientFilterModalName}
          />
        </Suspense>
      )}

      {openDeleteModal && (
        <Suspense fallback={<ModalFallback />}>
          <ConfirmDeleteModal
            setModal={setDeleteModal}
            triggerDelete={() => {
              if (openDeleteModal?.type === "Soft") {
                dispatch(softDeleteClient(openDeleteModal?.clientId));
              }

              else if (openDeleteModal?.type === "Permanent") {
                dispatch(hardDeleteData(openDeleteModal?.clientId));
              }
            }}
            isLoading={isUpdating}
            title={`Please confirm ${openDeleteModal?.type} deletion by entering the number below:`}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Clients;
