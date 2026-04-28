import { useDispatch, useSelector } from "react-redux";
import { exportClientExcel } from "../../features/actions/export-excel";
import ExportWebinarAttendeesModal from "./ExportWebinarAttendeesModal";

const ExportClientExcelModal = ({ modalName, filters }) => {
  const defaultColumns = [
    { header: "Email", key: "email" },
    { header: "Company Name", key: "companyName" },
    { header: "User Name", key: "userName" },
    { header: "Phone", key: "phone" },
    { header: "Is Active", key: "isActive" },
    { header: "Plan Name", key: "planName" },
    { header: "Plan Start Date", key: "planStartDate" },
    { header: "Plan Expiry", key: "planExpiry" },
    { header: "Contacts Limit", key: "contactsLimit" },
    { header: "Total Employees", key: "totalEmployees" },
    { header: "Employee Sales Count", key: "employeeSalesCount" },
    {
      header: "Employee Reminder Count",
      key: "employeeReminderCount",
    },
    { header: "Toggle Limit", key: "toggleLimit" },
  ];
  const dispatch = useDispatch();
  const { modals } = useSelector((state) => state.modals);

  return (
    <ExportWebinarAttendeesModal
      modalName={modalName}
      open={Boolean(modals?.[modalName])}
      title="Export Excel Options"
      defaultColumns={defaultColumns}
      onSubmitExport={({ limit, columns, filters: exportFilters }) =>
        dispatch(
          exportClientExcel({
            limit,
            columns: columns.join(","),
            filters: exportFilters ?? filters ?? {},
          })
        )
      }
      presetTableName="Clients Table"
      allowPresetsInSharedMode
      filters={filters}
    />
  );
};

export default ExportClientExcelModal;
