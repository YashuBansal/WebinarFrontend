import React, { useMemo, useEffect } from 'react';
import { Handle, Position, useNodes, useEdges } from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import { updateNodeData, onNodesChange } from '../../features/slices/flowSlice';
import CustomSelect from './CustomSelect';

const OPERATOR_OPTIONS = [
  { value: 'exists', label: 'Exists' },
  { value: 'not_exists', label: "Doesn't Exist" },
  { value: 'equals', label: 'Is Equal To' },
  { value: 'not_equals', label: 'Is Not Equal To' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'smaller_than', label: 'Smaller Than' },
  { value: 'contains', label: 'Contains String' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_before', label: 'Is Before (Date/Time)' },
  { value: 'is_after', label: 'Is After (Date/Time)' },
];

/**
 * Utility to flatten a nested JSON object into dot-notated paths (e.g. attendee.email)
 * Safely handles null, undefined, arrays, and complex nested objects
 */
const flattenKeys = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const pre = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      acc.push(pre);
    } else if (Array.isArray(value)) {
      acc.push(pre);
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        acc.push(...flattenKeys(value[0], pre));
      }
    } else if (typeof value === 'object') {
      acc.push(...flattenKeys(value, pre));
    } else {
      acc.push(pre);
    }
    return acc;
  }, []);
};

const TRIGGER_CONDITION_SCHEMA = {
  webhook: [],
  meta_leads: [
    { value: 'full_name', label: 'Full Name' },
    { value: 'email', label: 'Email Address' },
    { value: 'phone_number', label: 'Phone Number' },
    { value: 'lead_id', label: 'Facebook Lead ID' },
    { value: 'page_id', label: 'Facebook Page ID' },
    { value: 'form_id', label: 'Lead Form ID' },
  ],
  webinar_registration: [
    { value: 'webinar_name', label: 'Webinar Name' },
    { value: 'registered_at', label: 'Registration Time' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email Address' },
    { value: 'phone', label: 'Phone Number' },
  ],
  razorpay: [
    { value: 'payload.amount', label: 'Payment Amount' },
    { value: 'payload.status', label: 'Payment Status' },
    { value: 'payload.email', label: 'Payment Email' },
    { value: 'payload.contact', label: 'Payment Contact' },
    { value: 'payload.method', label: 'Payment Method' },
    { value: 'entity.id', label: 'Entity ID' },
  ],
  incoming_whatsapp: [
    { value: 'from', label: 'Phone Number' },
    { value: 'message', label: 'Text Body' },
    { value: 'type', label: 'Message Type' },
  ],
  whatsapp_keyword: [
    { value: 'from', label: 'Phone Number' },
    { value: 'message', label: 'Text Body' },
    { value: 'matched_keyword', label: 'Matched Keyword' },
  ],
  whatsapp_template_buttons: [
    { value: 'from', label: 'Phone Number' },
    { value: 'button_id', label: 'Button ID' },
    { value: 'button_title', label: 'Button Title' },
  ],
  wlh_whatsapp: [
    { value: 'contactSegment', label: 'Contact Segment' },
    { value: 'whatsappTagName', label: 'WhatsApp Tag Name' },
  ],
  google_sheets: [
    { value: 'row_index', label: 'Row Index' },
    { value: 'updated_column', label: 'Updated Column' },
  ],
};

const ACTION_OUTPUT_SCHEMA = {
  add_to_webinar: [
    { value: 'status', label: 'Status' },
    { value: 'registration_id', label: 'Registration ID' },
    { value: 'join_url', label: 'Join URL' },
    { value: 'webinar_id', label: 'Webinar ID' },
    { value: 'registered_at', label: 'Registered At' },
  ],
  add_to_whatsapp: [
    { value: 'status', label: 'Status' },
    { value: 'contact_id', label: 'Contact ID' },
    { value: 'phone', label: 'Phone' },
    { value: 'opt_in_status', label: 'Opt-in Status' },
  ],
  add_to_google_sheet: [
    { value: 'status', label: 'Status' },
    { value: 'row_index', label: 'Inserted Row Index' },
    { value: 'spreadsheet_id', label: 'Spreadsheet ID' },
    { value: 'updated_cells', label: 'Updated Cells Count' },
    { value: 'worksheet_name', label: 'Worksheet Name' },
  ],
  send_whatsapp: [
    { value: 'status', label: 'Send Status' },
    { value: 'message_id', label: 'Message ID' },
    { value: 'recipient_id', label: 'Recipient ID' },
    { value: 'timestamp', label: 'Sent Timestamp' },
  ],
  add_to_sequence: [
    { value: 'status', label: 'Status' },
    { value: 'sequence_id', label: 'Sequence ID' },
    { value: 'subscription_id', label: 'Subscription ID' },
    { value: 'added_at', label: 'Added At' },
  ],
  remove_from_sequence: [
    { value: 'status', label: 'Status' },
    { value: 'sequence_id', label: 'Sequence ID' },
    { value: 'removed_at', label: 'Removed At' },
  ],
  ck_add_subscriber: [
    { value: 'status', label: 'Status' },
    { value: 'subscriber.id', label: 'Subscriber ID' },
    { value: 'subscriber.first_name', label: 'First Name' },
    { value: 'subscriber.email_address', label: 'Email Address' },
    { value: 'subscriber.state', label: 'State' },
    { value: 'subscriber.created_at', label: 'Created At' },
  ],
  ck_add_tag: [
    { value: 'status', label: 'Status' },
    { value: 'tag_id', label: 'Tag ID' },
    { value: 'subscriber_id', label: 'Subscriber ID' },
  ],
  ac_add_contact: [
    { value: 'status', label: 'Status' },
    { value: 'contact.id', label: 'Contact ID' },
    { value: 'contact.email', label: 'Email' },
    { value: 'contact.first_name', label: 'First Name' },
    { value: 'contact.phone', label: 'Phone' },
    { value: 'contact.orgid', label: 'Org ID' },
  ],
  ac_add_tag: [
    { value: 'status', label: 'Status' },
    { value: 'tag_id', label: 'Tag ID' },
    { value: 'contact_id', label: 'Contact ID' },
  ],
  pabbly_add_subscriber: [
    { value: 'status', label: 'Status' },
    { value: 'subscriber.id', label: 'Subscriber ID' },
    { value: 'subscriber.email', label: 'Email' },
    { value: 'subscriber.status', label: 'Subscriber Status' },
  ],
  pabbly_add_tag: [
    { value: 'status', label: 'Status' },
    { value: 'tag.id', label: 'Tag ID' },
    { value: 'tag.name', label: 'Tag Name' },
  ],
  aweber_add_subscriber: [
    { value: 'status', label: 'Status' },
    { value: 'subscriber.id', label: 'Subscriber ID' },
    { value: 'subscriber.email', label: 'Email' },
    { value: 'subscriber.self_link', label: 'AWeber Resource Link' },
  ],
  aweber_add_tag: [
    { value: 'status', label: 'Status' },
    { value: 'tag', label: 'Added Tag' },
    { value: 'subscriber_id', label: 'Subscriber ID' },
  ],
  add_tag_crm: [
    { value: 'status', label: 'Status' },
    { value: 'tag_name', label: 'Tag Name' },
    { value: 'contact_id', label: 'CRM Contact ID' },
  ],
  add_tag_whatsapp: [
    { value: 'status', label: 'Status' },
    { value: 'tag_name', label: 'Tag Name' },
    { value: 'phone', label: 'WhatsApp Phone Number' },
  ],
  send_to_api: [
    { value: 'status_code', label: 'HTTP Status Code' },
    { value: 'response_body', label: 'Raw Response Body' },
    { value: 'headers.content_type', label: 'Response Content-Type' },
    { value: 'request_duration_ms', label: 'Duration (ms)' },
  ],
  whatsapp_send_session_template: [
    { value: 'status', label: 'Send Status' },
    { value: 'message_id', label: 'WhatsApp Message ID' },
    { value: 'recipient_id', label: 'Recipient ID' },
    { value: 'template_name', label: 'Template Name' },
  ],
  whatsapp_send_approved_template: [
    { value: 'status', label: 'Send Status' },
    { value: 'message_id', label: 'WhatsApp Message ID' },
    { value: 'recipient_id', label: 'Recipient ID' },
    { value: 'template_name', label: 'Template Name' },
  ],
  whatsapp_send_media: [
    { value: 'status', label: 'Send Status' },
    { value: 'message_id', label: 'WhatsApp Message ID' },
    { value: 'media_id', label: 'Media ID' },
    { value: 'media_url', label: 'Media URL' },
  ],
  whatsapp_send_link: [
    { value: 'status', label: 'Send Status' },
    { value: 'message_id', label: 'WhatsApp Message ID' },
    { value: 'sent_url', label: 'Redirect/Sent URL' },
  ],
  whatsapp_add_remove_wlh_tag: [
    { value: 'status', label: 'Operation Status' },
    { value: 'tag_name', label: 'Tag Name' },
    { value: 'operation', label: 'Operation Performed' },
  ],
  whatsapp_add_remove_whatsapp_tag: [
    { value: 'status', label: 'Operation Status' },
    { value: 'tag_name', label: 'Tag Name' },
    { value: 'operation', label: 'Operation Performed' },
  ],
};

export default function ConditionNode({ id, data, selected }) {
  const dispatch = useDispatch();
  const nodes = useNodes();
  const edges = useEdges();

  const incomingEdge = useMemo(() => {
    return edges.find((e) => e.target === id);
  }, [edges, id]);

  const hasIncomingConnection = !!incomingEdge;

  const parentNode = useMemo(() => {
    if (!incomingEdge) return null;
    return nodes.find((n) => n.id === incomingEdge.source);
  }, [nodes, incomingEdge]);

  const parentNodeType = useMemo(() => {
    if (!parentNode) return null;
    if (
      parentNode.type === 'trigger' ||
      parentNode.id === 'trigger' ||
      parentNode.id?.startsWith('trigger') ||
      parentNode.data?.triggerType
    ) {
      return 'trigger';
    }
    if (
      parentNode.type === 'action' ||
      parentNode.id?.startsWith('action') ||
      parentNode.data?.actionType
    ) {
      return 'action';
    }
    return null;
  }, [parentNode]);

  const { fieldOptions, isDynamic, triggerType } = useMemo(() => {
    if (!parentNode) {
      return { fieldOptions: [], isDynamic: false, triggerType: null };
    }

    // 1. Universal Dynamic Parsing: Parse captured response from the parent node if it exists
    const captured = parentNode.data?.capturedResponse;
    if (captured) {
      const keys = flattenKeys(captured);
      if (keys.length > 0) {
        return {
          fieldOptions: keys.map((key) => ({ value: key, label: key })),
          isDynamic: true,
          triggerType: parentNode.data?.triggerType || null,
        };
      }
    }

    // 2. Fallback to Schema based on whether parent is a Trigger or Action
    if (parentNodeType === 'trigger') {
      const rawType = parentNode.data?.triggerType || 'webhook';
      let normalizedType = rawType;
      if (normalizedType === 'contact_added_webinar') {
        normalizedType = 'webinar_registration';
      } else if (normalizedType === 'contact_added_wlh_whatsapp') {
        normalizedType = 'wlh_whatsapp';
      } else if (
        ['keyword_match', 'whatsapp_keyword_match', 'whatsapp_keyword_trigger'].includes(normalizedType)
      ) {
        normalizedType = 'whatsapp_keyword';
      } else if (['whatsapp_incoming_message'].includes(normalizedType)) {
        normalizedType = 'incoming_whatsapp';
      } else if (
        ['whatsapp_template', 'whatsapp_button_clicked', 'whatsapp_template_received'].includes(
          normalizedType
        )
      ) {
        normalizedType = 'whatsapp_template_buttons';
      }

      const schemaOptions = TRIGGER_CONDITION_SCHEMA[normalizedType] || [];
      return {
        fieldOptions: schemaOptions,
        isDynamic: false,
        triggerType: normalizedType,
      };
    } else if (parentNodeType === 'action') {
      const actionType = parentNode.data?.actionType || '';
      const schemaOptions = ACTION_OUTPUT_SCHEMA[actionType] || [
        { value: 'status', label: 'Action Status' },
        { value: 'response', label: 'Raw Response' },
      ];
      return {
        fieldOptions: schemaOptions,
        isDynamic: false,
        triggerType: null,
      };
    }

    return { fieldOptions: [], isDynamic: false, triggerType: null };
  }, [parentNode, parentNodeType]);

  const field = useMemo(() => {
    const isValValid = fieldOptions.some((opt) => opt.value === data.field);
    if (isValValid) return data.field;
    return fieldOptions[0] ? fieldOptions[0].value : '';
  }, [data.field, fieldOptions]);

  useEffect(() => {
    if (fieldOptions.length > 0) {
      const isValValid = fieldOptions.some((opt) => opt.value === data.field);
      if (!isValValid) {
        dispatch(
          updateNodeData({
            id,
            data: {
              ...data,
              field: fieldOptions[0].value,
            },
          })
        );
      }
    } else if (data.field) {
      dispatch(
        updateNodeData({
          id,
          data: {
            ...data,
            field: '',
          },
        })
      );
    }
  }, [fieldOptions, data.field, id, dispatch]);

  const operator = data.operator || 'equals';
  const value = data.value || '';

  const isUnaryOperator = operator === 'exists' || operator === 'not_exists';

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
      className={`min-w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 ${selected
          ? 'border-amber-500 shadow-amber-500/20 ring-1 ring-amber-400/30'
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

      {/* Header section with warning-themed branching aesthetics */}
      <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600/10 to-orange-600/5 dark:from-amber-600/20 dark:to-orange-600/10 border-b border-slate-100 dark:border-slate-800/80 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          {/* Glowing Warning Amber Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-inner">
            <div className="absolute inset-0 bg-amber-400/20 blur-sm rounded-lg" />
            <svg
              className="w-4 h-4 relative z-10 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
              Logic Evaluator
            </p>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Conditional Branching
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

      {/* Main card body/disconnected placeholder */}
      {!hasIncomingConnection ? (
        <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 text-amber-600 dark:text-amber-400/80 animate-pulse">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Disconnected Node
            </h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
              Connect this node to an upstream trigger or action node to evaluate conditions and route your workflow.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main card body with inputs */}
          <div className="p-4 flex flex-col gap-3.5">
            {/* Field Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                Variables Field
              </label>
              <CustomSelect
                value={field}
                onChange={(e) => updateField('field', e.target.value)}
                options={fieldOptions}
              />
              {!isDynamic && triggerType === 'webhook' && (
                <span className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold leading-normal mt-0.5">
                  🚨 Custom Webhooks have no default fields. Please capture a test response in the trigger first to map variables.
                </span>
              )}
              {!isDynamic && triggerType !== 'webhook' && parentNodeType === 'action' && (
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium leading-normal mt-0.5">
                  💡 Showing action output fields. Capture parent action response for live fields.
                </span>
              )}
              {!isDynamic && triggerType !== 'webhook' && parentNodeType === 'trigger' && (
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium leading-normal mt-0.5">
                  💡 Showing default fields. Capture a test response in the trigger to see live data fields.
                </span>
              )}
            </div>

            {/* Operator Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                Comparison Operator
              </label>
              <CustomSelect
                value={operator}
                onChange={(e) => updateField('operator', e.target.value)}
                options={OPERATOR_OPTIONS}
              />
            </div>

            {/* Target Value Input (conditional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                Target Value
              </label>
              <input
                type="text"
                value={value}
                disabled={isUnaryOperator}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder={isUnaryOperator ? 'Not required for operator' : 'e.g. 500 or active'}
                className="w-full bg-slate-50 text-slate-850 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all nodrag"
              />
            </div>
          </div>

          {/* branch output labels & handles */}
          <div className="relative flex justify-between px-4 pb-4 mt-1 border-t border-slate-100 dark:border-slate-800/40 pt-3">
            {/* Match / YES branch indicator */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-[9px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Match (True)
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id="match"
                style={{
                  left: '20%',
                  width: 10,
                  height: 10,
                  background: '#22c55e',
                  border: '2px solid #0f172a',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                }}
              />
            </div>

            {/* No Match / NO branch indicator */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                No Match (False)
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id="no_match"
                style={{
                  right: '20%',
                  left: 'auto',
                  width: 10,
                  height: 10,
                  background: '#f43f5e',
                  border: '2px solid #0f172a',
                  boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
