import React from 'react';
import { Handle, Position } from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import { updateNodeData, onNodesChange } from '../../features/slices/flowSlice';
import CustomSelect from './CustomSelect';

const TRIGGER_OPTIONS = [
  { value: 'webhook', label: 'Webhook' },
  { value: 'google_sheets', label: 'Google Sheets Trigger' },
  { value: 'meta_leads', label: 'Meta Leads Ad' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'webinar_registration', label: 'Contact Added To Webinar' },
  { value: 'wlh_whatsapp', label: 'Contact Added To WLH WhatsApp' },
  { value: 'whatsapp_keyword', label: 'WhatsApp Keyword Trigger' },
  { value: 'whatsapp_template', label: 'WhatsApp Template Received' },
  { value: 'whatsapp_template_buttons', label: 'WhatsApp Template Button Clicked' },
  { value: 'incoming_whatsapp', label: 'Incoming WhatsApp Message' },
];

export default function TriggerNode({ id, data, selected }) {
  const dispatch = useDispatch();
  const flowCategory = useSelector((state) => state.flow?.flowCategory || 'general');

  const filteredOptions = TRIGGER_OPTIONS.filter((opt) => {
    if (flowCategory === 'whatsapp') {
      return (
        opt.value === 'incoming_whatsapp' ||
        opt.value === 'keyword_match' ||
        opt.value.startsWith('whatsapp_')
      );
    } else {
      return (
        opt.value === 'webhook' ||
        opt.value === 'razorpay' ||
        opt.value === 'google_sheets' ||
        opt.value === 'meta_leads' ||
        opt.value === 'webinar_registration' ||
        opt.value === 'wlh_whatsapp'
      );
    }
  });

  const triggerType = React.useMemo(() => {
    const rawType = data?.triggerType || 'webhook';
    if (rawType === 'contact_added_webinar') return 'webinar_registration';
    if (rawType === 'contact_added_wlh_whatsapp') return 'wlh_whatsapp';
    return rawType;
  }, [data?.triggerType]);

  const handleChange = (e) => {
    dispatch(
      updateNodeData({
        id,
        data: {
          ...data,
          triggerType: e.target.value,
          capturedResponse: null,
          mockPayload: null,
          isDynamic: false,
        },
      })
    );
  };

  const handleOpenConfig = (e) => {
    e.stopPropagation();
    const event = new CustomEvent('open-trigger-drawer', { detail: { id, data } });
    window.dispatchEvent(event);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    handleOpenConfig(e);
  };

  const handleDeleteNode = (e) => {
    e.stopPropagation();
    dispatch(onNodesChange([{ type: 'remove', id }]));
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`min-w-[280px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 cursor-pointer ${selected
          ? 'border-blue-500 shadow-blue-500/20 ring-1 ring-blue-400/30'
          : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
    >
      {/* Header section with sleek blue accent */}
      <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 dark:from-blue-600/20 dark:to-indigo-600/10 border-b border-slate-100 dark:border-slate-800/80 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          {/* Futuristic Glowing Blue Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-inner">
            <div className="absolute inset-0 bg-blue-400/20 blur-sm rounded-lg" />
            <svg
              className="w-4 h-4 relative z-10 animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-blue-500 dark:text-blue-400 uppercase">
              Entry Trigger
            </p>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Webhook / Integration
            </h4>
          </div>
        </div>

        {/* Right side Actions (Status Tag & Delete Button) */}
        <div className="flex items-center gap-1.5 z-10">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-600 dark:text-blue-300 font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-ping" />
            Active
          </span>
          <button
            onClick={handleDeleteNode}
            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-450 rounded-lg cursor-pointer transition-colors nodrag"
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
      </div>

      {/* Main card body with custom dropdown selector */}
      <div className="p-4 flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
          Select Trigger Source
        </label>
        <CustomSelect
          value={triggerType}
          onChange={handleChange}
          options={filteredOptions}
        />

        {!(triggerType === 'keyword_match' || triggerType === 'whatsapp_keyword') && (
          <button
            onClick={handleOpenConfig}
            className="w-full mt-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-xl text-[10px] font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all nodrag cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configure Trigger
          </button>
        )}

        {(triggerType === 'keyword_match' || triggerType === 'whatsapp_keyword') && (
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[9px] font-bold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
              Keyword to Match
            </label>
            <input
              type="text"
              value={data.keyword || ''}
              onChange={(e) =>
                dispatch(
                  updateNodeData({
                    id,
                    data: {
                      ...data,
                      keyword: e.target.value,
                    },
                  })
                )
              }
              placeholder="e.g. price, promo, register"
              className="w-full bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all nodrag"
            />
          </div>
        )}
      </div>

      {/* React Flow Source Handle (Bottom Position) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 10,
          height: 10,
          background: '#3b82f6',
          border: '2px solid #0f172a',
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
        }}
      />
    </div>
  );
}
