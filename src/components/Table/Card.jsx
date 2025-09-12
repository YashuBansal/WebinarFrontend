import { memo } from "react";
import { formatDateAsNumber } from "../../utils/extra";

// A small, consistent component for "Not Available"
const NotAvailable = () => <span className="italic text-red-400">N/A</span>;

const Card = ({
  row,
  index,
  columns,
  actions = [], // Default to empty array for safety
  page,
  limit,
  cellRendererProps,
}) => {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-500">
            {/* Logic is fine, but now relies on explicit props */}
            #{(page - 1) * limit + index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <button
              // Use a more stable key if possible, e.g., action.name
              key={action.tooltip || action.name}
              className="rounded-full p-1.5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(row);
              }}
              title={action.tooltip}
              disabled={action.disabled}
            >
              {action.icon(row)}
            </button>
          ))}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="space-y-3">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex items-center justify-between rounded-lg border border-gray-200/60 bg-gray-50/80 p-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                {col.header}
              </p>
              <div className="text-right text-sm text-gray-800">
                <CellRenderer column={col} row={row} {...cellRendererProps} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;

const CellRenderer = memo(({ column, row, isTablesMasked }) => {
  const value = row?.[column.key];

  switch (column.type) {
    case "chip": {
      const filteredChips = Array.isArray(value)
        ? value.filter((chip) => chip)
        : [];
      if (filteredChips.length === 0) return <NotAvailable />;
      return (
        <div
          title={filteredChips.join(", ")}
          className="flex flex-wrap gap-1 md:flex-nowrap"
        >
          {filteredChips.slice(0, 2).map((chip, idx) => (
            <span
              key={idx}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
            >
              {chip}
            </span>
          ))}
          {filteredChips.length > 2 && (
            <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
              +{filteredChips.length - 2}
            </span>
          )}
        </div>
      );
    }
    case "Date": {
      if (value === null || value === undefined || value === "") {
        return <span className="italic text-gray-400">Not Set</span>;
      }
      const date = formatDateAsNumber(value);
      return date || <span className="italic text-gray-400">Not Set</span>;
    }
    default:
      // A more precise check for empty values
      if (value === undefined || value === null || value === "") {
        return column.default ?? <NotAvailable />;
      }
      return String(value); // Safely render any value
  }
});