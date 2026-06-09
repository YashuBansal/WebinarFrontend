import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import { useDispatch } from 'react-redux';
import { onEdgesChange } from '../../features/slices/flowSlice';

/**
 * Modern custom React Flow connection edge that renders a sleek "Delete" button 
 * in the center of the path for quick edge removal.
 */
export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const dispatch = useDispatch();

  // 1. Calculate standard bezier path and coordinates of the center point
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 2. Click handler to delete the edge from the Redux state
  const onDeleteClick = (e) => {
    e.stopPropagation();
    dispatch(onEdgesChange([{ type: 'remove', id }]));
  };

  return (
    <>
      {/* Standard visual connection path */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {/* HTML floating label overlay at the exact center coordinates of the curve */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all', // Override default pointer-events: none in EdgeLabelRenderer
          }}
          className="nodrag nopan z-30"
        >
          {/* Rounded "X" Delete Button */}
          <button
            type="button"
            onClick={onDeleteClick}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200 active:scale-90 cursor-pointer pointer-events-auto"
            title="Delete Connection"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
