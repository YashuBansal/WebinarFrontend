import React from 'react';
import { Handle, Position } from 'reactflow';
import { useDispatch } from 'react-redux';
import { updateNodeData, onNodesChange } from '../../features/slices/flowSlice';
import CustomSelect from './CustomSelect';

const DELAY_TYPE_OPTIONS = [
  { value: 'delay_for', label: 'Delay For (Duration)' },
  { value: 'wait_until', label: 'Wait Until (Date/Time)' },
];

const UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

export default function DelayNode({ id, data, selected }) {
  const dispatch = useDispatch();

  const delayType = data.delayType || 'delay_for';
  const amount = data.amount ?? 5;
  const unit = data.unit || 'minutes';
  const waitUntil = data.waitUntil || '';

  const updateField = (key, val) => {
    dispatch(
      updateNodeData({
        id,
        data: {
          ...data,
          [key]: val,
        },
      })
    );
  };

  const handleDeleteNode = (e) => {
    e.stopPropagation();
    dispatch(onNodesChange([{ type: 'remove', id }]));
  };

  return (
    <div
      className={`min-w-[300px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 ${
        selected
          ? 'border-purple-500 shadow-purple-500/20 ring-1 ring-purple-400/30'
          : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Handle - Incoming Connection */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 10,
          height: 10,
          background: '#94a3b8',
          border: '2px solid #0f172a',
          boxShadow: '0 0 6px rgba(148, 163, 184, 0.5)',
        }}
      />

      {/* Header section with sleek purple themed typography */}
      <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/10 to-pink-600/5 dark:from-purple-600/20 dark:to-pink-600/10 border-b border-slate-100 dark:border-slate-800/80 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          {/* Glowing Purple Clock Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 shadow-inner">
            <div className="absolute inset-0 bg-purple-400/20 blur-sm rounded-lg" />
            <svg
              className="w-4 h-4 relative z-10 animate-spin-slow"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-purple-600 dark:text-purple-400 uppercase">
              Timer Controller
            </p>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Delay Node Modifier
            </h4>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDeleteNode}
          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-450 rounded-lg cursor-pointer transition-colors nodrag z-10"
          title="Delete Node"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Main card body with inputs */}
      <div className="p-4 flex flex-col gap-3.5">
        {/* Delay Type Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            Delay Logic Type
          </label>
          <CustomSelect
            value={delayType}
            onChange={(e) => updateField('delayType', e.target.value)}
            options={DELAY_TYPE_OPTIONS}
          />
        </div>

        {/* Conditional Duration Controls */}
        {delayType === 'delay_for' ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Amount input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 dark:text-slate-400 tracking-wide uppercase">
                Duration
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => updateField('amount', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-all nodrag"
              />
            </div>
            {/* Unit Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 dark:text-slate-400 tracking-wide uppercase">
                Time Unit
              </label>
              <CustomSelect
                value={unit}
                onChange={(e) => updateField('unit', e.target.value)}
                options={UNIT_OPTIONS}
              />
            </div>
          </div>
        ) : (
          /* Absolute DateTime Selector */
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              Schedule Until
            </label>
            <input
              type="datetime-local"
              value={waitUntil}
              onChange={(e) => updateField('waitUntil', e.target.value)}
              className="w-full bg-slate-50 text-slate-850 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-all cursor-text nodrag"
            />
          </div>
        )}
      </div>

      {/* Bottom Handle - Outgoing Connection */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 10,
          height: 10,
          background: '#a855f7',
          border: '2px solid #0f172a',
          boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
        }}
      />
    </div>
  );
}
