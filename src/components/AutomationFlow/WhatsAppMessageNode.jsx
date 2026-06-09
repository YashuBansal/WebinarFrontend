import React, { useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import { updateNodeData, onNodesChange } from '../../features/slices/flowSlice';
import CustomSelect from './CustomSelect';

const ACTION_TYPE_OPTIONS = [
  // Core CRM & Webinar Actions
  { value: 'add_to_webinar', label: 'Add Contact to Webinar' },
  { value: 'add_to_whatsapp', label: 'Add Contact to WhatsApp' },
  { value: 'add_to_google_sheet', label: 'Add Data to Google Sheet' },
  { value: 'send_whatsapp', label: 'Send WhatsApp Message' },
  { value: 'add_to_sequence', label: 'Add Contact to Sequence' },
  { value: 'remove_from_sequence', label: 'Remove Contact from Sequence' },
  { value: 'ck_add_subscriber', label: 'ConvertKit: Add/Update Subscriber' },
  { value: 'ck_add_tag', label: 'ConvertKit: Add Tag' },
  { value: 'ac_add_contact', label: 'ActiveCampaign: Add/Update Contact' },
  { value: 'ac_add_tag', label: 'ActiveCampaign: Add Tag' },
  { value: 'pabbly_add_subscriber', label: 'Pabbly: Add/Update Subscriber' },
  { value: 'pabbly_add_tag', label: 'Pabbly: Add Tag' },
  { value: 'aweber_add_subscriber', label: 'AWeber: Add/Update Subscriber' },
  { value: 'aweber_add_tag', label: 'AWeber: Add Tag' },
  { value: 'add_tag_crm', label: 'Add Tag to Contact in CRM' },
  { value: 'add_tag_whatsapp', label: 'Add Tag to Contact in WhatsApp' },
  { value: 'send_to_api', label: 'Send Data to API' },
  // WhatsApp Specific Actions
  { value: 'whatsapp_send_session_template', label: 'WhatsApp: Send Session Template' },
  { value: 'whatsapp_send_approved_template', label: 'WhatsApp: Send Approved Template' },
  { value: 'whatsapp_send_media', label: 'WhatsApp: Send Image/Video' },
  { value: 'whatsapp_send_link', label: 'WhatsApp: Send Link' },
  { value: 'whatsapp_add_remove_wlh_tag', label: 'WhatsApp: Add/Remove WLH Tag' },
  { value: 'whatsapp_add_remove_whatsapp_tag', label: 'WhatsApp: Add/Remove WhatsApp Tag' },
];

export default function WhatsAppMessageNode({ id, data, selected }) {
  const dispatch = useDispatch();
  const flowCategory = useSelector((state) => state.flow?.flowCategory || 'general');

  const filteredOptions = ACTION_TYPE_OPTIONS.filter((opt) => {
    if (flowCategory === 'whatsapp') {
      return opt.value.startsWith('whatsapp_');
    } else {
      return (
        (!opt.value.startsWith('whatsapp_') && !opt.value.includes('whatsapp')) ||
        opt.value === 'send_whatsapp' ||
        opt.value === 'add_to_whatsapp' ||
        opt.value === 'add_tag_whatsapp'
      );
    }
  });

  const actionType = data.actionType || (flowCategory === 'whatsapp' ? 'whatsapp_send_session_template' : 'add_to_webinar');
  const isConfigurable = !!actionType;

  const templateName = data.templateName || '';
  const templateBody = data.templateBody || '';
  const templateButtons = data.templateButtons || [];

  const updateField = (key, val) => {
    const additionalWipes = key === 'actionType' ? {
      capturedResponse: null,
      payloadReceived: false,
      isDynamic: false,
      templateName: '',
      templateBody: '',
      templateButtons: []
    } : {};

    dispatch(
      updateNodeData({
        id,
        data: {
          ...data,
          [key]: val,
          ...additionalWipes
        },
      })
    );
  };

  const handleOpenConfig = (e) => {
    e.stopPropagation();
    if (!isConfigurable) return;
    const event = new CustomEvent('open-action-drawer', { detail: { id, data } });
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
      className={`min-w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 ${
        isConfigurable ? 'cursor-pointer' : 'cursor-default'
      } ${selected
        ? 'border-emerald-500 shadow-emerald-500/20 ring-1 ring-emerald-400/30'
        : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700'
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

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Sequence Action
            </p>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              API Service Execution
            </h4>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDeleteNode}
          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-455 rounded-lg cursor-pointer transition-colors nodrag z-10"
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
        {/* Action Type Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
            Action Operation
          </label>
          <CustomSelect
            value={actionType}
            onChange={(e) => updateField('actionType', e.target.value)}
            options={filteredOptions}
          />
        </div>

        {/* Dynamic WhatsApp Preview Block embedded inside standard node body */}
        {(actionType === 'whatsapp_send_session_template' || 
          actionType === 'whatsapp_send_approved_template' || 
          actionType === 'send_whatsapp_approved' || 
          actionType === 'send_whatsapp') && (
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 relative text-left">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide">
                {templateName || "WhatsApp Message"} Preview
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 break-words whitespace-pre-line leading-relaxed">
              {templateBody ? (templateBody.length > 120 ? templateBody.substring(0, 120) + "..." : templateBody) : "No template configured yet. Configure settings to preview."}
            </p>
          </div>
        )}

        {/* Buttons / Actions / Interactive Flow Branching */}
        {templateButtons.length > 0 && (
          <div className="flex flex-col gap-2 relative mt-1">
            {templateButtons.map((btn, index) => (
              <div
                key={btn.id || index}
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm nodrag"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                    Button
                  </span>
                  <span className="truncate max-w-[150px]">{btn.text}</span>
                </div>
                {/* Individual Source Handle for this button */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={btn.id || `btn_${index + 1}`}
                  style={{
                    top: '50%',
                    right: -10,
                    width: 10,
                    height: 10,
                    background: '#10b981',
                    border: '2px solid #0f172a',
                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {isConfigurable && (
          <button
            type="button"
            onClick={handleOpenConfig}
            className="w-full mt-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-500/20 rounded-xl text-[10px] font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all nodrag cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 animate-pulse"
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
            Configure Action
          </button>
        )}
      </div>

      {(!templateButtons || templateButtons.length === 0) && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default_output"
          style={{
            width: 10,
            height: 10,
            background: '#10b981',
            border: '2px solid #0f172a',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          }}
        />
      )}
    </div>
  );
}
