import React, { useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateAsNumber } from '../../utils/extra';
import { motion } from 'framer-motion';
import { Checkbox } from '../ui/checkbox';
import { Button } from '@mui/material';

export const DynamicLeadsTable = ({
  columns,
  attendees,
  columnWidths,
  columnVisibility,
  sortColumn,
  sortDirection,
  resizingColumn,
  theme,
  indexOfFirstItem,
  sortedAttendees,
  onSort,
  onResizeStart,
  onResizeDoubleClick,
  selectedRows = [],
  onToggleSelect,
  onToggleSelectAll,
}) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? '#f8fafc' : '#071028';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  
  const visibleColumns = columns.filter(col => columnVisibility[col.key] !== false);
  const selectedIds = useMemo(() => new Set(selectedRows), [selectedRows]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const renderCellContent = (item, col, index) => {
    switch (col.key) {
      case 'serialNo':
        return indexOfFirstItem + index + 1;
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="text"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (col.onViewClick) col.onViewClick(item);
              }}
              className="!min-w-0 !p-2"
              title="View Contact"
            >
              <Eye className="w-4 h-4 text-purple-500" />
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (col.onDeleteClick) col.onDeleteClick(item);
              }}
              className="!min-w-0 !p-2"
              title="Delete Contact"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        );
      case 'dateTime':
        return (
          <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#64748b]">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDateAsNumber(item[col.dataKey])}</span>
          </div>
        );
      case 'assignedTo':
        return item.isAssigned ? (item.assignedEmployee?.name || 'Assigned') : 'Not Assigned';
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {item.tags && item.tags.length > 0 ? item.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded-md whitespace-nowrap">
                {tag.name || tag}
              </span>
            )) : '-'}
          </div>
        );
      case 'pastWebinarDuration':
        return formatDuration(item[col.dataKey]);
      case 'registeredWebinars':
      case 'attendedWebinars':
        return item[col.dataKey] || 0;
      default:
        const val = item[col.dataKey];
        return val !== undefined && val !== null ? String(val) : '-';
    }
  };

  return (
    <>
      <thead className="sticky top-0 z-20">
        <tr style={{ backgroundColor: isDark ? '#1e293b' : '#F9FAFB' }}>
          <th
            className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider sticky left-0 z-30"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#F9FAFB',
              color: textMuted,
              width: 52,
              minWidth: 52,
            }}
          >
            <Checkbox
              checked={
                sortedAttendees?.length > 0 &&
                sortedAttendees.every((r) => r._id && selectedIds.has(r._id))
              }
              onCheckedChange={(c) =>
                onToggleSelectAll && onToggleSelectAll(Boolean(c), sortedAttendees.map(r => r._id))
              }
              className="border-slate-300"
            />
          </th>
          {visibleColumns.map((col) => {
            const isActions = col.key === 'actions';
            return (
              <th
                key={col.key}
                className={`p-4 font-semibold text-xs uppercase tracking-wider text-gray-500 hover:bg-black/5 transition-colors select-none group relative ${
                  isActions ? 'text-center sticky right-0 z-30' : 'text-left'
                }`}
                style={{
                  width: columnWidths[col.widthKey],
                  backgroundColor: isActions ? (isDark ? '#1e293b' : '#F9FAFB') : undefined,
                }}
              >
                <div
                  className={`flex items-center ${isActions ? 'justify-center' : 'gap-2'} ${col.sortable ? 'cursor-pointer' : ''}`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  {col.label}
                  {col.sortable && (
                    <span className="ml-1">
                      {sortColumn === col.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </span>
                  )}
                </div>
                {!isActions && (
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => onResizeStart && onResizeStart(e, col.widthKey)}
                    onDoubleClick={() => onResizeDoubleClick && onResizeDoubleClick(col.widthKey)}
                  />
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedAttendees && sortedAttendees.length > 0 ? (
          sortedAttendees.map((item, index) => {
            const rowId = item._id;
            const isSelected = Boolean(rowId && selectedIds.has(rowId));
            const selectedBg = isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4';
            const cellBg = isSelected ? selectedBg : undefined;
            const stickyEdgeBg = isSelected ? selectedBg : (isDark ? '#1e293b' : '#ffffff');

            return (
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                key={rowId || index}
                className={`group border-b transition-all duration-200 ${
                  isSelected ? '' : 'hover:bg-black/5'
                }`}
                style={{ 
                  backgroundColor: cellBg,
                  borderColor: 'rgba(0,0,0,0.05)'
                }}
              >
                <td
                  className="p-4 align-middle sticky left-0 z-10 transition-colors"
                  style={{ backgroundColor: stickyEdgeBg }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => rowId && onToggleSelect && onToggleSelect(rowId)}
                    className="border-slate-300"
                  />
                </td>
                {visibleColumns.map((col) => {
                  const content = renderCellContent(item, col, index);
                  const isSpecialCol = ['registeredWebinars', 'attendedWebinars', 'pastWebinarDuration'].includes(col.key);
                  let textColor = textMuted;
                  let isBold = false;
                  
                  if (col.key === 'serialNo') {
                      textColor = textMuted;
                      isBold = true;
                  } else if (col.key === 'firstName' || col.key === 'lastName' || col.key === 'email') {
                      textColor = textPrimary;
                      isBold = true;
                  } else if (col.key === 'attendedWebinars') {
                      textColor = Number(item[col.dataKey] || 0) > 0 ? "#22B573" : textMuted;
                      isBold = true;
                  } else if (isSpecialCol) {
                      textColor = textPrimary;
                      isBold = true;
                  }

                  const isActions = col.key === 'actions';

                  return (
                    <td
                      key={col.key}
                      className={`p-4 text-sm transition-colors ${isBold ? 'font-bold' : 'font-medium'} ${
                        isActions ? 'text-right sticky right-0 z-10' : ''
                      }`}
                      style={{ 
                        color: textColor,
                        backgroundColor: isActions ? stickyEdgeBg : undefined 
                      }}
                      title={typeof content === 'string' ? content : ''}
                    >
                      {content}
                    </td>
                  );
                })}
              </motion.tr>
            );
          })
        ) : (
          <tr>
            <td
              colSpan={visibleColumns.length + 1}
              className="px-6 py-20 text-center"
            >
               <div className="flex flex-col items-center gap-3 opacity-40">
                  <p className="text-sm font-medium">No attendees found.</p>
               </div>
            </td>
          </tr>
        )}
      </tbody>
    </>
  );
};
