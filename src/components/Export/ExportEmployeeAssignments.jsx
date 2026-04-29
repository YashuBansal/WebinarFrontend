import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { exportEmployeeAssignmentsExcel } from "../../features/actions/export-excel";
import { attendeeTableColumns } from "../../utils/columnData";
import useUserSubscription from "../../hooks/useUserSubscription";
import ExportWebinarAttendeesModal from "./ExportWebinarAttendeesModal";

const ExportEmployeeAssignments = ({
  id,
  modalName,
  filters,
  webinarId,
  validCall,
  assignmentStatus,
  validCallFlag,
  employeeName,
  sort,
}) => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state) => state.modals);

  const { data: subscription } = useUserSubscription();
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const defaultColumns = useMemo(() => {
    const notAllowed = ["isAssigned", "enrollments", "registeredCount", "attendedCount"];
    const availableColumns = attendeeTableColumns.filter((col) => {
      const isDownloadable = col.key in tableConfig ? tableConfig[col.key].downloadable : true;
      return isDownloadable && !notAllowed.includes(col.key);
    });
    if (
      tableConfig.leadType?.downloadable &&
      !availableColumns.some((col) => col.key === "leadType")
    ) {
      availableColumns.push({
        header: "LeadType",
        key: "leadType",
        width: 20,
      });
    }
    return availableColumns;
  }, [tableConfig]);

  return (
    <ExportWebinarAttendeesModal
      modalName={modalName}
      open={Boolean(modals?.[modalName])}
      title="Export Excel Options"
      defaultColumns={defaultColumns}
      filters={filters}
      presetTableName="Employee Assignments Export"
      allowPresetsInSharedMode
      onSubmitExport={({ limit, columns, filters: exportFilters }) =>
        dispatch(
          exportEmployeeAssignmentsExcel({
            id,
            limit,
            filters: exportFilters ?? {},
            webinarId,
            validCall,
            assignmentStatus,
            sort,
            validCallFlag,
            columns,
            employee: employeeName,
          })
        )
      }
    />
  );
};

export default ExportEmployeeAssignments;
