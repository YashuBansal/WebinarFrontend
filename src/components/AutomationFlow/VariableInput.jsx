import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const triggerFieldsMap = {
  webhook: {
    label: '1. Custom Webhook API',
    fields: [
      { key: '{{1.id}}', label: '1. Event ID' },
      { key: '{{1.topic}}', label: '1. Event Topic' },
      { key: '{{1.created_at}}', label: '1. Created At' },
      { key: '{{1.attendee.name}}', label: '1. Attendee Name' },
      { key: '{{1.attendee.email}}', label: '1. Attendee Email' },
      { key: '{{1.attendee.phone}}', label: '1. Attendee Phone' }
    ]
  },
  google_sheets: {
    label: '1. Google Sheets Trigger',
    fields: [
      { key: '{{1.spreadsheet_name}}', label: '1. Spreadsheet Name' },
      { key: '{{1.worksheet_name}}', label: '1. Worksheet Name' },
      { key: '{{1.row_index}}', label: '1. Row Index' },
      { key: '{{1.data.Name}}', label: '1. Row Data: Name' },
      { key: '{{1.data.Email}}', label: '1. Row Data: Email' },
      { key: '{{1.data.Phone}}', label: '1. Row Data: Phone' }
    ]
  },
  meta_leads: {
    label: '1. Meta Leads Ad',
    fields: [
      { key: '{{1.leadgen_id}}', label: '1. Leadgen ID' },
      { key: '{{1.form_id}}', label: '1. Form ID' },
      { key: '{{1.created_time}}', label: '1. Created Time' },
      { key: '{{1.full_name}}', label: '1. Lead Full Name' },
      { key: '{{1.email}}', label: '1. Lead Email' },
      { key: '{{1.phone_number}}', label: '1. Lead Phone Number' }
    ]
  },
  razorpay: {
    label: '1. Razorpay Callback',
    fields: [
      { key: '{{1.event}}', label: '1. Payment Event' },
      { key: '{{1.account_id}}', label: '1. Razorpay Account ID' },
      { key: '{{1.payload.payment.entity.id}}', label: '1. Payment ID' },
      { key: '{{1.payload.payment.entity.amount}}', label: '1. Paid Amount' },
      { key: '{{1.payload.payment.entity.currency}}', label: '1. Currency' },
      { key: '{{1.payload.payment.entity.email}}', label: '1. Customer Email' },
      { key: '{{1.payload.payment.entity.contact}}', label: '1. Customer Contact' }
    ]
  },
  incoming_whatsapp: {
    label: '1. Incoming WhatsApp Message',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.message}}', label: '1. Message Body' },
      { key: '{{1.timestamp}}', label: '1. Timestamp' }
    ]
  },
  whatsapp_incoming_message: {
    label: '1. Incoming WhatsApp Message',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.message}}', label: '1. Message Body' },
      { key: '{{1.timestamp}}', label: '1. Timestamp' }
    ]
  },
  whatsapp_keyword: {
    label: '1. WhatsApp Keyword Trigger',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.message}}', label: '1. Message Body' },
      { key: '{{1.matched_keyword}}', label: '1. Matched Keyword' }
    ]
  },
  whatsapp_keyword_trigger: {
    label: '1. WhatsApp Keyword Trigger',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.message}}', label: '1. Message Body' },
      { key: '{{1.matched_keyword}}', label: '1. Matched Keyword' }
    ]
  },
  whatsapp_keyword_match: {
    label: '1. WhatsApp Keyword Match',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.message}}', label: '1. Message Body' },
      { key: '{{1.matched_keyword}}', label: '1. Matched Keyword' }
    ]
  },
  whatsapp_template: {
    label: '1. WhatsApp Template Received',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.button_reply.id}}', label: '1. Button ID' },
      { key: '{{1.button_reply.title}}', label: '1. Button Title' }
    ]
  },
  whatsapp_template_buttons: {
    label: '1. WhatsApp Template Button Clicked',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.button_reply.id}}', label: '1. Button ID' },
      { key: '{{1.button_reply.title}}', label: '1. Button Title' }
    ]
  },
  whatsapp_button_clicked: {
    label: '1. WhatsApp Template Button Clicked',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.button_reply.id}}', label: '1. Button ID' },
      { key: '{{1.button_reply.title}}', label: '1. Button Title' }
    ]
  },
  whatsapp_template_received: {
    label: '1. WhatsApp Template Received',
    fields: [
      { key: '{{1.type}}', label: '1. Message Type' },
      { key: '{{1.from}}', label: '1. Sender Number' },
      { key: '{{1.button_reply.id}}', label: '1. Button ID' },
      { key: '{{1.button_reply.title}}', label: '1. Button Title' }
    ]
  },
  wlh_whatsapp: {
    label: '1. WLH WhatsApp Tracker',
    fields: [
      { key: '{{1.event}}', label: '1. Contact Event' },
      { key: '{{1.data.phone}}', label: '1. Contact Phone' },
      { key: '{{1.data.new_tag}}', label: '1. Added Tag Name' }
    ]
  },
  webinar_registration: {
    label: '1. Webinar Platform Link',
    fields: [
      { key: '{{1.payload.object.topic}}', label: '1. Webinar Title' },
      { key: '{{1.payload.object.registrant.first_name}}', label: '1. Registrant First Name' },
      { key: '{{1.payload.object.registrant.email}}', label: '1. Registrant Email' }
    ]
  }
};

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

export default function VariableInput({ value = '', onChange, label, placeholder }) {
  const editorRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Retrieve active trigger node type from Redux
  const nodes = useSelector((state) => state.flow?.nodes || []);
  const triggerNode = nodes.find((n) => n.type === 'trigger');
  const triggerType = triggerNode?.data?.triggerType || 'webhook';

  // Compute current trigger details dynamically including capturedResponse
  const currentTriggerDetails = React.useMemo(() => {
    const baseDetails = triggerFieldsMap[triggerType] || triggerFieldsMap.webhook;
    const captured = triggerNode?.data?.capturedResponse;
    if (captured) {
      try {
        const flatKeys = flattenKeys(captured);
        if (flatKeys.length > 0) {
          const dynamicFields = flatKeys.map(key => ({
            key: `{{1.${key}}}`,
            label: `1. ${key}`
          }));
          
          const existingKeys = new Set(baseDetails.fields.map(f => f.key));
          const uniqueDynamicFields = dynamicFields.filter(f => !existingKeys.has(f.key));
          
          return {
            label: `${baseDetails.label} (Captured Payload)`,
            fields: [...baseDetails.fields, ...uniqueDynamicFields]
          };
        }
      } catch (err) {
        console.error("Error parsing capturedResponse in VariableInput:", err);
      }
    }
    return baseDetails;
  }, [triggerNode, triggerType]);

  // Sync value from parent to contentEditable
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const expectedHtml = templateToHtml(value, currentTriggerDetails);
      if (htmlToTemplate(currentHtml) !== value) {
        editorRef.current.innerHTML = expectedHtml;
      }
    }
  }, [value, currentTriggerDetails]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const template = htmlToTemplate(html);
      onChange(template);
    }
  };

  const insertVariable = (key, labelText) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      const pillHtml = `<span class="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded px-1.5 py-0.5 mx-0.5 inline-block font-medium text-[10px] select-none" contenteditable="false" data-val="${key}">${labelText}</span>&nbsp;`;
      
      // Use selection API to insert at cursor
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Ensure range is inside editor
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          const el = document.createElement("div");
          el.innerHTML = pillHtml;
          const frag = document.createDocumentFragment();
          let node;
          while ((node = el.firstChild)) {
            frag.appendChild(node);
          }
          range.insertNode(frag);
          // Move cursor after inserted node
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current.innerHTML += pillHtml;
        }
      } else {
        editorRef.current.innerHTML += pillHtml;
      }
      
      handleInput();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="flex gap-2 items-stretch">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          placeholder={placeholder}
          className="flex-1 bg-white text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-inner min-h-[40px] empty:before:content-[attr(placeholder)] empty:before:text-slate-400 empty:before:font-normal focus:ring-1 focus:ring-emerald-500 overflow-y-auto leading-relaxed"
        />
        
        {/* Insert Variable Helper Dropdown */}
        <div className="relative flex">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
          >
            <span className="font-mono text-[10px] font-bold">+ {`{x}`}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-[100%] mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 z-50 max-h-48 overflow-y-auto"
                >
                  <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                    Insert Data from Previous Steps
                  </div>
                  
                  {/* Category Header */}
                  <div className="px-2 py-1 text-[8px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider bg-blue-50/40 dark:bg-blue-900/10 rounded">
                    {currentTriggerDetails.label}
                  </div>
 
                  {currentTriggerDetails.fields.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => {
                        insertVariable(v.key, v.label);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-[10px] text-slate-700 dark:text-slate-355 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors font-medium flex items-center justify-between cursor-pointer"
                    >
                      <span>{v.label}</span>
                      <span className="font-mono text-[9px] text-slate-450 dark:text-slate-500 bg-slate-50 dark:bg-slate-955 px-1 rounded">{v.key}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Helper parsing functions
function templateToHtml(templateStr, currentTriggerDetails) {
  if (!templateStr) return '';
  
  let html = templateStr;

  // Replace matches of format {{1.xxx}} with blue pills
  html = html.replace(/\{\{(1\.[a-zA-Z0-9_.]+)\}\}/g, (match, p1) => {
    const fieldObj = currentTriggerDetails?.fields?.find(f => f.key === match);
    const label = fieldObj ? fieldObj.label : `1. ${p1.substring(2)}`;
    return `<span class="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded px-1.5 py-0.5 mx-0.5 inline-block font-medium text-[10px] select-none" contenteditable="false" data-val="${match}">${label}</span>`;
  });

  return html;
}

function htmlToTemplate(html) {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const spans = tempDiv.querySelectorAll('span[data-val]');
  spans.forEach(span => {
    const val = span.getAttribute('data-val');
    span.replaceWith(document.createTextNode(val));
  });
  
  let text = tempDiv.textContent || tempDiv.innerText || '';
  return text.replace(/\u00a0/g, ' ');
}
