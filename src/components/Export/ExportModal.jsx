import { useSelector } from "react-redux";
import ExportWebinarAttendeesModal from "./ExportWebinarAttendeesModal";

/**
 * Backward-compatible wrapper around the shared export modal UI.
 */
const ExportModal = ({ modalName, tableName, handleExport, columns = [] }) => {
  const { modals } = useSelector((state) => state.modals);

  return (
    <ExportWebinarAttendeesModal
      modalName={modalName}
      open={Boolean(modals?.[modalName])}
      title="Export Excel Options"
      defaultColumns={columns}
      onSubmitExport={({ limit, columns: selectedColumns, includeFilter }) =>
        handleExport({ limit, columns: selectedColumns, includeFilter })
      }
      allowPresetsInSharedMode
      presetTableName={tableName}
    />
  );
};

export default ExportModal;
