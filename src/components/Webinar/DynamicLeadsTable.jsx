import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Trash2, Calendar, XCircle } from 'lucide-react';
import { formatDateAsNumber } from '../../utils/extra';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { useVirtualizer } from '@tanstack/react-virtual';

// Modern, micro-animated skeleton row loader for query cold starts
const TableRowSkeleton = ({ columnsCount }) => {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800/40">
      <td className="p-4 align-middle">
        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700/50 rounded" />
      </td>
      {Array.from({ length: columnsCount }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3" />
        </td>
      ))}
    </tr>
  );
};

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
  sortedAttendees = [],
  onSort,
  onResizeStart,
  onResizeDoubleClick,
  selectedRows = [],
  onToggleSelect,
  onToggleSelectAll,
  isLoading,
  leadTypeData = [],
}) => {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? '#f8fafc' : '#071028';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  
  const visibleColumns = useMemo(() => {
    return columns.filter(col => columnVisibility[col.key] !== false);
  }, [columns, columnVisibility]);

  const selectedIds = useMemo(() => new Set(selectedRows), [selectedRows]);

  // Build a fast O(1) lookup map for leadType colors
  const leadTypeColorMap = useMemo(() => {
    const map = {};
    (leadTypeData || []).forEach((lt) => {
      if (lt._id) map[String(lt._id)] = lt.color || null;
    });
    return map;
  }, [leadTypeData]);

  // Dynamic Scroll Parent binding ref
  const tableBodyRef = useRef(null);
  const [scrollContainer, setScrollContainer] = useState(null);

  useEffect(() => {
    if (tableBodyRef.current) {
      // Find the nearest scrollable shell wrapper (defined in WebinarAttendeesTableShell)
      const container = tableBodyRef.current.closest('.overflow-auto') || tableBodyRef.current.parentElement;
      setScrollContainer(container);
    }
  }, []);

  // Initialize Row Virtualizer using spacer rows pattern
  const rowVirtualizer = useVirtualizer({
    count: sortedAttendees?.length || 0,
    getScrollElement: () => scrollContainer,
    estimateSize: () => 53, // standard row height in pixels
    overscan: 12,           // keep 12 rows pre-rendered out of view for ultra-smooth scrolling
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const renderCellContent = (item, col, index) => {
    switch (col.key) {
      case 'serialNo': {
        const ltColor = item.leadType ? leadTypeColorMap[String(item.leadType)] : null;
        return (
          <span className="relative flex items-center pl-4">
            {ltColor && (
              <span
                className="absolute bottom-[-6px] left-0 top-[-6px] w-1 rounded-full opacity-90"
                style={{ backgroundColor: ltColor }}
                aria-hidden
              />
            )}
            {indexOfFirstItem + index + 1}
          </span>
        );
      }
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation(); // Stop row click navigation
                if (col.onViewClick) col.onViewClick(item);
              }}
              className="h-8 w-8 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10"
              title="View Contact"
            >
              <Eye className="w-4 h-4 text-purple-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation(); // Stop row click navigation
                if (col.onDeleteClick) col.onDeleteClick(item);
              }}
              className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              title={col.variant === 'cancel' ? "Cancel Request" : "Delete Contact"}
            >
              {col.variant === 'cancel' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-500" />
              )}
            </Button>
          </div>
        );
      case 'dateTime':
        return (
          <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#64748b] dark:text-[#94a3b8]">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{formatDateAsNumber(item[col.dataKey])}</span>
          </div>
        );
      case 'assignedTo':
        return item.isAssigned ? (item.assignedEmployee?.name || 'Assigned') : 'Not Assigned';
      case 'tags':
        if (!item.tags || item.tags.length === 0) return '-';
        return (
          <div className="flex items-center gap-1 whitespace-nowrap">
            {item.tags.slice(0, 2).map((tag, i) => (
              <span 
                key={i} 
                className="px-2 py-0.5 text-[10px] font-medium rounded-md truncate max-w-[80px]"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
                  color: isDark ? "#cbd5e1" : "#374151"
                }}
              >
                {tag.name || tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md shrink-0">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        );
      case 'pastWebinarDuration':
        return formatDuration(item[col.dataKey]);
      case 'registeredWebinars':
      case 'attendedWebinars':
        return item[col.dataKey] || 0;
      case 'enrollments':
        const enrollmentVal = item[col.dataKey];
        if (!enrollmentVal) return '-';
        if (Array.isArray(enrollmentVal)) {
          if (enrollmentVal.length === 0) return '-';
          const names = enrollmentVal.map(e => e.name || e).join(', ');
          return <div className="whitespace-nowrap overflow-hidden truncate max-w-[200px]" title={names}>{names}</div>;
        }
        return <div className="whitespace-nowrap">{String(enrollmentVal)}</div>;
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
            className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider sticky left-0 z-30 border-b border-slate-100 dark:border-slate-800"
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
              className="border-slate-300 dark:border-slate-700"
            />
          </th>
          {visibleColumns.map((col) => {
            const isActions = col.key === 'actions';
            return (
              <th
                key={col.key}
                className={`font-semibold text-xs uppercase tracking-wider text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 border-b border-slate-100 dark:border-slate-800 transition-colors select-none group relative ${
                  isActions ? 'text-center sticky right-0 z-30' : 'text-left'
                } ${col.sortable ? 'cursor-pointer' : ''}`}
                style={{
                  width: columnWidths[col.widthKey],
                  backgroundColor: isActions ? (isDark ? '#1e293b' : '#F9FAFB') : undefined,
                }}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <div
                  className={`p-4 flex items-center ${isActions ? 'justify-center' : 'gap-2'}`}
                  style={{ color: textMuted }}
                >
                  {col.label}
                  {col.sortable && (
                    <span className="ml-1">
                      {sortColumn === col.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
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
      
      <tbody ref={tableBodyRef} className="relative">
        {isLoading && (!sortedAttendees || sortedAttendees.length === 0) ? (
          Array.from({ length: 10 }).map((_, i) => (
            <TableRowSkeleton key={i} columnsCount={visibleColumns.length} />
          ))
        ) : sortedAttendees && sortedAttendees.length > 0 ? (
          <>
            {/* Top Virtual Spacer */}
            {paddingTop > 0 && (
              <tr style={{ height: `${paddingTop}px` }}>
                <td colSpan={visibleColumns.length + 1} style={{ padding: 0, border: 0 }} />
              </tr>
            )}

            {/* Rendered Virtual Rows */}
            {virtualRows.map((virtualRow) => {
              const item = sortedAttendees[virtualRow.index];
              const index = virtualRow.index;
              const rowId = item._id;
              const isSelected = Boolean(rowId && selectedIds.has(rowId));
              const selectedBg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#f0fdf4';
              const cellBg = isSelected ? selectedBg : undefined;
              const stickyEdgeBg = isSelected ? selectedBg : (isDark ? '#1e293b' : '#ffffff');

              const actionsColumn = visibleColumns.find(c => c.key === 'actions');
              const onViewClick = actionsColumn?.onViewClick;

              return (
                <tr
                  key={rowId || index}
                  data-index={index}
                  ref={rowVirtualizer.measureElement}
                  onClick={() => onViewClick && onViewClick(item)}
                  className={`group border-b border-slate-100 dark:border-slate-800/40 cursor-pointer transition-all duration-200 ${
                    isSelected ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                  style={{ 
                    backgroundColor: cellBg,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  <td
                    className="p-4 align-middle sticky left-0 z-10 transition-colors"
                    style={{ backgroundColor: stickyEdgeBg }}
                    onClick={(e) => e.stopPropagation()} // Stop row click navigation
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => rowId && onToggleSelect && onToggleSelect(rowId)}
                      className="border-slate-300 dark:border-slate-700"
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
                          isActions ? 'text-right sticky right-0 z-10 border-l border-slate-100 dark:border-slate-800/40' : ''
                        }`}
                        style={{ 
                          color: textColor,
                          backgroundColor: isActions ? stickyEdgeBg : undefined 
                        }}
                        title={typeof content === 'string' ? content : ''}
                        onClick={isActions ? (e) => e.stopPropagation() : undefined} // Stop row click navigation
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Bottom Virtual Spacer */}
            {paddingBottom > 0 && (
              <tr style={{ height: `${paddingBottom}px` }}>
                <td colSpan={visibleColumns.length + 1} style={{ padding: 0, border: 0 }} />
              </tr>
            )}
          </>
        ) : (
          <tr>
            <td
              colSpan={visibleColumns.length + 1}
              className="px-6 py-20 text-center"
            >
              <div className="flex flex-col items-center gap-3 opacity-40">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No attendees found.</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </>
  );
};
