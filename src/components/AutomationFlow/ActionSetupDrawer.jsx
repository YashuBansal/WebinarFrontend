import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { instance } from '../../services/axiosInterceptor';
import VariableInput, { triggerFieldsMap } from './VariableInput';
import { WhatsAppTemplatePreviewCard } from '../../pages/WhatsApp/components/ui/whatsapp-template-preview-card';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Plug,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  Lock,
  Info,
  Database,
  CreditCard,
  Video,
  MessageSquare,
  Globe,
  Loader2,
  AlertTriangle,
  Mail,
  Plus,
  Play,
  Settings,
  Trash2,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Custom Dropdown selector matching premium Radix styles
 */
function PremiumSelector({ label, value, onChange, options, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer text-left shadow-inner"
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-[100%] left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 z-50"
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between rounded-lg cursor-pointer ${isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-505 shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Variable mapping helper button & dropdown simulator
 */
function VariableMapper({ onSelectVariable }) {
  const [isOpen, setIsOpen] = useState(false);

  const nodes = useSelector((state) => state.flow?.nodes || []);
  const triggerNode = nodes.find((n) => n.type === 'trigger');
  const triggerType = triggerNode?.data?.triggerType || 'webhook';

  const variables = useMemo(() => {
    const baseDetails = triggerFieldsMap[triggerType] || triggerFieldsMap.webhook;
    const captured = triggerNode?.data?.capturedResponse;
    if (captured) {
      try {
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
        const flatKeys = flattenKeys(captured);
        if (flatKeys.length > 0) {
          const dynamicFields = flatKeys.map(key => ({
            key: `{{1.${key}}}`,
            label: `1. ${key}`
          }));
          const existingKeys = new Set(baseDetails.fields.map(f => f.key));
          const uniqueDynamicFields = dynamicFields.filter(f => !existingKeys.has(f.key));
          return [...baseDetails.fields, ...uniqueDynamicFields];
        }
      } catch (err) {
        console.error("Error parsing capturedResponse in VariableMapper:", err);
      }
    }
    return baseDetails.fields;
  }, [triggerNode, triggerType]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-505 dark:text-slate-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 active:scale-95"
        title="Insert Variable"
      >
        <span className="font-mono text-[10px] font-bold">+ {`{x}`}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-[100%] mb-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 z-50 max-h-48 overflow-y-auto" style={{ zIndex: 1100 }}>
            <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
              Select Lead Variable
            </div>
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  onSelectVariable(v.key);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-[10px] text-slate-700 dark:text-slate-350 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors font-medium flex items-center justify-between cursor-pointer"
              >
                <span>{v.label}</span>
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-1 rounded">{v.key}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 1. WhatsApp Send Template Setup
 */
function WhatsAppSendSetup({
  template,
  setTemplate,
  variables,
  setVariables,
  whatsappPhone,
  setWhatsappPhone,
  isSession = false,
  approvedTemplatesList = [],
  sessionTemplatesList = []
}) {
  const templates = useMemo(() => {
    if (isSession) {
      if (sessionTemplatesList.length > 0) {
        return sessionTemplatesList.map(t => ({
          value: t.name || t.configuredTemplateName || t.templateName,
          label: t.name || t.configuredTemplateName || t.templateName
        }));
      }
      return [];
    } else {
      if (approvedTemplatesList.length > 0) {
        return approvedTemplatesList.map(t => ({
          value: t.name,
          label: t.name
        }));
      }
      return [];
    }
  }, [isSession, approvedTemplatesList, sessionTemplatesList]);

  // Dynamically configure variables based on selected template
  const requiredVars = useMemo(() => {
    if (!template) return [];

    if (isSession) {
      const selectedTpl = sessionTemplatesList.find(t => t.name === template || t.configuredTemplateName === template || t.templateName === template);
      if (selectedTpl) {
        const contentText = selectedTpl.content || '';
        const matches = contentText ? [...contentText.matchAll(/\{\{(\d+)\}\}/g)] : [];
        if (matches.length > 0) {
          const indices = Array.from(new Set(matches.map(m => parseInt(m[1], 10)))).sort((a, b) => a - b);
          return indices.map(idx => ({
            key: `var${idx}`,
            label: `Variable {{${idx}}}`,
            placeholder: `e.g. Map variable ${idx}`
          }));
        }
        if (Array.isArray(selectedTpl.variableMappings)) {
          return selectedTpl.variableMappings.map((v, index) => {
            const varName = v.variable || `${index + 1}`;
            return {
              key: `var${varName}`,
              label: `Variable {{${varName}}}`,
              placeholder: v.staticValue ? `Default: ${v.staticValue}` : `e.g. Map value`
            };
          });
        }
      }
    } else {
      const selectedTpl = approvedTemplatesList.find(t => t.name === template);
      if (selectedTpl && Array.isArray(selectedTpl.components)) {
        const bodyComp = selectedTpl.components.find(c => c.type === 'BODY');
        if (bodyComp) {
          const matches = bodyComp.text ? [...bodyComp.text.matchAll(/\{\{(\d+)\}\}/g)] : [];
          if (matches.length > 0) {
            const indices = Array.from(new Set(matches.map(m => parseInt(m[1], 10)))).sort((a, b) => a - b);
            return indices.map(idx => ({
              key: `var${idx}`,
              label: `Variable {{${idx}}}`,
              placeholder: `e.g. Map variable ${idx}`
            }));
          }
        }
      }
    }

    return [];
  }, [template, isSession, approvedTemplatesList, sessionTemplatesList]);

  const selectedTplObject = useMemo(() => {
    if (!template) return null;
    if (isSession) {
      const selected = sessionTemplatesList.find(t => t.name === template || t.configuredTemplateName === template || t.templateName === template);
      if (selected) {
        return {
          name: selected.name || selected.configuredTemplateName || selected.templateName,
          status: 'SESSION',
          category: 'SESSION',
          language: selected.language || 'en_US',
          components: selected.components && selected.components.length > 0
            ? selected.components
            : [{ type: 'BODY', text: selected.content || '' }]
        };
      }
    } else {
      const selected = approvedTemplatesList.find(t => t.name === template);
      if (selected) return selected;
    }
    return null;
  }, [template, isSession, approvedTemplatesList, sessionTemplatesList]);

  const previewVariableMappings = useMemo(() => {
    return Object.entries(variables || {}).map(([key, val]) => {
      const num = key.replace('var', '');
      return {
        variable: `{{${num}}}`,
        isDynamic: false,
        contactField: '',
        staticValue: val || `{{${num}}}`
      };
    });
  }, [variables]);

  const handleUpdateVar = (key, val) => {
    setVariables(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <VariableInput
          label="Recipient Phone Number"
          value={whatsappPhone}
          onChange={setWhatsappPhone}
          placeholder="Map the destination WhatsApp number with country code"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the destination WhatsApp number with country code
        </span>
      </div>

      <div className="w-full">
        <PremiumSelector
          label={isSession ? "Choose Session Template" : "Choose Approved Template"}
          value={template}
          onChange={setTemplate}
          options={templates}
        />
      </div>

      {template && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Left Column: Variable Mappings */}
          {requiredVars.length > 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5 h-fit">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center justify-between">
                <span>Template Variables Mapping</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">Dynamic Mode</span>
              </h4>

              {requiredVars.map((v) => (
                <div key={v.key} className="flex flex-col gap-1">
                  <VariableInput
                    label={v.label}
                    value={variables[v.key] || ''}
                    onChange={(val) => handleUpdateVar(v.key, val)}
                    placeholder={v.placeholder}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 h-fit">
              <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
                No variables required for this template.
              </span>
            </div>
          )}

          {/* Right Column: Premium iPhone Preview Card */}
          <div className="flex justify-center items-start">
            <WhatsAppTemplatePreviewCard
              template={selectedTplObject}
              variableMappings={previewVariableMappings}
              showVariableMappings={false}
              className="scale-90 origin-top"
            />
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * 2. Email Autoresponder
 */
function ConnectionBanner({ providerName }) {
  return (
    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 rounded-xl flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider">
          Connected to {providerName}
        </span>
      </div>
      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase">
        OAuth Active
      </span>
    </div>
  );
}

function WebinarConnectionBanner() {
  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
          Connected to Internal CRM Webinars
        </span>
      </div>
      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase">
        System Native
      </span>
    </div>
  );
}

function CrmRegisterWebinar({
  webinarId,
  setWebinarId,
  webinarFirstName,
  setWebinarFirstName,
  webinarLastName,
  setWebinarLastName,
  webinarEmail,
  setWebinarEmail,
  webinarPhone,
  setWebinarPhone,
  webinarsList = []
}) {
  const options = useMemo(() => {
    if (!webinarsList || webinarsList.length === 0) {
      return [
        { value: '', label: 'No webinars available' }
      ];
    }
    return webinarsList.map(w => ({
      value: w._id || w.id,
      label: w.webinarName || w.title || w.name
    }));
  }, [webinarsList]);

  return (
    <div className="space-y-4">
      <WebinarConnectionBanner />

      <PremiumSelector
        label="Select Target Webinar"
        value={webinarId}
        onChange={setWebinarId}
        options={options}
      />

      <div className="space-y-1">
        <VariableInput
          label="First Name"
          value={webinarFirstName}
          onChange={setWebinarFirstName}
          placeholder="Map the registrant's first name"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the registrant's first name
        </span>
      </div>

      <div className="space-y-1">
        <VariableInput
          label="Last Name"
          value={webinarLastName}
          onChange={setWebinarLastName}
          placeholder="Map the registrant's last name (Optional)"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the registrant's last name (Optional)
        </span>
      </div>

      <div className="space-y-1">
        <VariableInput
          label="Email Address"
          value={webinarEmail}
          onChange={setWebinarEmail}
          placeholder="Map the registrant's email address"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the registrant's email address
        </span>
      </div>

      <div className="space-y-1">
        <VariableInput
          label="Phone Number"
          value={webinarPhone}
          onChange={setWebinarPhone}
          placeholder="Map the registrant's phone number with country code"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the registrant's phone number with country code
        </span>
      </div>
    </div>
  );
}

function CrmRemoveWebinar({
  webinarId,
  setWebinarId,
  webinarEmail,
  setWebinarEmail,
  webinarsList = []
}) {
  const options = useMemo(() => {
    if (!webinarsList || webinarsList.length === 0) {
      return [
        { value: '', label: 'No webinars available' }
      ];
    }
    return webinarsList.map(w => ({
      value: w._id || w.id,
      label: w.webinarName || w.title || w.name
    }));
  }, [webinarsList]);

  return (
    <div className="space-y-4">
      <WebinarConnectionBanner />

      <PremiumSelector
        label="Select Target Webinar"
        value={webinarId}
        onChange={setWebinarId}
        options={options}
      />

      <div className="space-y-1">
        <VariableInput
          label="Email Address"
          value={webinarEmail}
          onChange={setWebinarEmail}
          placeholder="Map the email address of the registrant to remove"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the email address of the registrant to remove
        </span>
      </div>
    </div>
  );
}

function ConvertKitAddSubscriber({
  emailAddress,
  setEmailAddress,
  firstName,
  setFirstName,
  selectedList,
  setSelectedList
}) {
  const options = []; // Fetch lists dynamically if needed

  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="ConvertKit" />
      <div className="space-y-1">
        <VariableInput
          label="Email Address"
          value={emailAddress}
          onChange={setEmailAddress}
          placeholder="Map the email address of the lead"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the email address of the lead
        </span>
      </div>
      <div className="space-y-1">
        <VariableInput
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="Map the first name"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the first name
        </span>
      </div>
      <PremiumSelector
        label="Select Sequence / Form"
        value={selectedList || 'welcome_sequence'}
        onChange={setSelectedList}
        options={options}
      />
    </div>
  );
}

function ConvertKitAddTag({
  emailAddress,
  setEmailAddress,
  selectedTag,
  setSelectedTag
}) {
  const options = [
    { value: 'vip', label: 'VIP' },
    { value: 'webinar_attended', label: 'Webinar_Attended' }
  ];

  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="ConvertKit" />
      <VariableInput
        label="Email Address"
        value={emailAddress}
        onChange={setEmailAddress}
        placeholder="Map the email address of the lead"
      />
      <PremiumSelector
        label="Select Tag"
        value={selectedTag || 'vip'}
        onChange={setSelectedTag}
        options={options}
      />
    </div>
  );
}

function ActiveCampaignAddContact({
  emailAddress,
  setEmailAddress,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  selectedList,
  setSelectedList
}) {
  const options = [
    { value: 'master_contacts', label: 'Master Contacts' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' }
  ];

  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="ActiveCampaign" />
      <VariableInput
        label="Email Address"
        value={emailAddress}
        onChange={setEmailAddress}
        placeholder="Map the email address of the lead"
      />
      <VariableInput
        label="First Name"
        value={firstName}
        onChange={setFirstName}
        placeholder="Map the first name"
      />
      <VariableInput
        label="Last Name"
        value={lastName}
        onChange={setLastName}
        placeholder="Map the last name"
      />
      <PremiumSelector
        label="Select List"
        value={selectedList || 'master_contacts'}
        onChange={setSelectedList}
        options={options}
      />
    </div>
  );
}

function ActiveCampaignAddTag({
  emailAddress,
  setEmailAddress,
  selectedTag,
  setSelectedTag
}) {
  const options = [
    { value: 'customer', label: 'Customer' },
    { value: 'hot_lead', label: 'Hot Lead' }
  ];

  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="ActiveCampaign" />
      <VariableInput
        label="Email Address"
        value={emailAddress}
        onChange={setEmailAddress}
        placeholder="Map the email address of the lead"
      />
      <PremiumSelector
        label="Select Tag"
        value={selectedTag || 'customer'}
        onChange={setSelectedTag}
        options={options}
      />
    </div>
  );
}

function PabblyAddSubscriber({
  emailAddress,
  setEmailAddress,
  firstName,
  setFirstName,
  selectedList,
  setSelectedList
}) {
  const options = [
    { value: 'default_list', label: 'Default List' },
    { value: 'promo_2026', label: 'Promo 2026' }
  ];

  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="Pabbly" />
      <VariableInput
        label="Email Address"
        value={emailAddress}
        onChange={setEmailAddress}
        placeholder="Map the email address of the lead"
      />
      <VariableInput
        label="Full Name"
        value={firstName}
        onChange={setFirstName}
        placeholder="Map the full name"
      />
      <PremiumSelector
        label="Select List"
        value={selectedList || 'default_list'}
        onChange={setSelectedList}
        options={options}
      />
    </div>
  );
}

function PabblyAddTag({
  emailAddress,
  setEmailAddress,
  selectedTag,
  setSelectedTag
}) {
  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="Pabbly" />
      <div className="space-y-1">
        <VariableInput
          label="Email Address"
          value={emailAddress}
          onChange={setEmailAddress}
          placeholder="Map the subscriber's email address"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the subscriber's email address
        </span>
      </div>
      <div className="space-y-1">
        <VariableInput
          label="Tag Name"
          value={selectedTag}
          onChange={setSelectedTag}
          placeholder="Enter or map the tag to apply"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Enter or map the tag to apply
        </span>
      </div>
    </div>
  );
}

function AWeberAddSubscriber({
  emailAddress,
  setEmailAddress,
  firstName,
  setFirstName,
  selectedList,
  setSelectedList
}) {
  const options = [
    { value: 'main_newsletter', label: 'Main Newsletter' },
    { value: 'lead_magnet_optins', label: 'Lead Magnet Opt-ins' }
  ];

  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="AWeber" />
      <div className="space-y-1">
        <VariableInput
          label="Email Address"
          value={emailAddress}
          onChange={setEmailAddress}
          placeholder="Map the subscriber's email address"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the subscriber's email address
        </span>
      </div>
      <div className="space-y-1">
        <VariableInput
          label="Full Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="Map the subscriber's full name"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the subscriber's full name
        </span>
      </div>
      <PremiumSelector
        label="Select List"
        value={selectedList || 'main_newsletter'}
        onChange={setSelectedList}
        options={options}
      />
    </div>
  );
}

function AWeberAddTag({
  emailAddress,
  setEmailAddress,
  selectedTag,
  setSelectedTag
}) {
  return (
    <div className="space-y-4">
      <ConnectionBanner providerName="AWeber" />
      <div className="space-y-1">
        <VariableInput
          label="Email Address"
          value={emailAddress}
          onChange={setEmailAddress}
          placeholder="Map the email address of the existing subscriber"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the email address of the existing subscriber
        </span>
      </div>
      <div className="space-y-1">
        <VariableInput
          label="Tags to Add"
          value={selectedTag}
          onChange={setSelectedTag}
          placeholder="Enter comma-separated tags to apply, or map a tag variable"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Enter comma-separated tags to apply, or map a tag variable
        </span>
      </div>
    </div>
  );
}

/**
 * 3. Add Row to Google Sheet Setup
 */
function AddToGoogleSheetSetup({
  isConnected,
  onConnectToggle,
  spreadsheet,
  setSpreadsheet,
  worksheet,
  setWorksheet,
  columnMappings,
  setColumnMappings,
  isSpreadsheetMapped,
  setIsSpreadsheetMapped,
  isSheetMapped,
  setIsSheetMapped
}) {
  const spreadsheets = [
    { value: 'leads_2026', label: 'New Leads 2026' },
    { value: 'master_db', label: 'Master Database' }
  ];

  const worksheets = [
    { value: 'sheet1', label: 'Sheet1' },
    { value: 'sheet2', label: 'Sheet2' }
  ];

  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [fetchedColumns, setFetchedColumns] = useState([]);

  // Fetch columns mapping when worksheet changes
  useEffect(() => {
    if (!worksheet) {
      setFetchedColumns([]);
      return;
    }

    setIsLoadingColumns(true);
    const timer = setTimeout(() => {
      setIsLoadingColumns(false);
      // Simulate sheet columns
      if (worksheet === 'sheet2') {
        setFetchedColumns(["User Name", "Contact", "Email Address", "Registered At"]);
      } else {
        setFetchedColumns(["Name", "Email", "Number", "City", "Profession", "Timestamps"]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [worksheet]);

  const handleUpdateMapping = (colName, val) => {
    setColumnMappings(prev => ({
      ...prev,
      [colName]: val
    }));
  };

  return (
    <div className="space-y-4">
      {/* Auth Account block */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.5s3.81-8.5 8.503-8.5c2.098 0 4.01.763 5.498 2.019l3.07-3.07C18.232 1.205 15.397 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.88 0 12.24-4.837 12.24-12.24 0-.829-.077-1.457-.22-1.955H12.24z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Google Sheets Account</h4>
            <p className="text-[10px] text-slate-505 dark:text-slate-450 font-medium">
              {isConnected ? 'Connected as user@gmail.com' : 'Disconnected'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConnectToggle}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${isConnected
              ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 border border-rose-200 dark:border-rose-500/20'
              : 'bg-white hover:bg-slate-50 dark:bg-slate-855 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-250 dark:border-slate-750 shadow-sm'
            }`}
        >
          {isConnected ? 'Disconnect' : 'Connect Account'}
        </button>
      </div>

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Spreadsheet Block */}
            <div className="flex flex-col gap-1.5 w-full relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  Select Spreadsheet
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase text-[8px]">Map</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSpreadsheetMapped(!isSpreadsheetMapped);
                      setSpreadsheet('');
                    }}
                    className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center ${isSpreadsheetMapped ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                  >
                    <motion.div
                      layout
                      className="w-3 h-3 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>

              {isSpreadsheetMapped ? (
                <VariableInput
                  value={spreadsheet}
                  onChange={setSpreadsheet}
                  placeholder="Enter dynamic Spreadsheet ID e.g. {{1.spreadsheet_id}}"
                />
              ) : (
                <PremiumSelector
                  value={spreadsheet}
                  onChange={setSpreadsheet}
                  options={spreadsheets}
                />
              )}
            </div>

            {/* Worksheet Block */}
            <div className="flex flex-col gap-1.5 w-full relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  Select Worksheet
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase text-[8px]">Map</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSheetMapped(!isSheetMapped);
                      setWorksheet('');
                    }}
                    className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center ${isSheetMapped ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                  >
                    <motion.div
                      layout
                      className="w-3 h-3 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>

              {isSheetMapped ? (
                <VariableInput
                  value={worksheet}
                  onChange={setWorksheet}
                  placeholder="Enter dynamic Worksheet Name e.g. {{1.sheet_name}}"
                />
              ) : (
                <PremiumSelector
                  value={worksheet}
                  onChange={setWorksheet}
                  options={worksheets}
                />
              )}
            </div>
          </div>

          {/* Column Mapping Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase border-b border-slate-200 dark:border-slate-800 pb-1.5 flex justify-between items-center">
              <span>Column Mapping Configuration</span>
              <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">Pabbly Engine</span>
            </h4>

            {isLoadingColumns ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="text-[10px] font-medium">Fetching headers from sheet...</span>
              </div>
            ) : fetchedColumns.length > 0 ? (
              fetchedColumns.map((colName) => (
                <div key={colName} className="flex flex-col gap-1">
                  <VariableInput
                    label={colName}
                    value={columnMappings[colName] || ''}
                    onChange={(val) => handleUpdateMapping(colName, val)}
                    placeholder={`Enter value or map variable for ${colName}`}
                  />
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-slate-400 text-[10px] font-medium">
                No headers found. Select or map a worksheet to load column fields.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * 4. Send to Custom API Setup
 */
/**
 * Dynamic Key-Value Builder Component
 */
function KeyValueBuilder({
  label,
  list,
  setList,
  placeholderKey = "Key",
  placeholderValue = "Value",
  helpText
}) {
  const handleAddRow = () => {
    setList([...list, { key: '', value: '' }]);
  };

  const handleRemoveRow = (index) => {
    const newList = [...list];
    newList.splice(index, 1);
    if (newList.length === 0) {
      newList.push({ key: '', value: '' });
    }
    setList(newList);
  };

  const handleUpdateRow = (index, field, value) => {
    const newList = [...list];
    newList[index] = { ...newList[index], [field]: value };
    setList(newList);
  };

  return (
    <div className="p-4 bg-slate-55/40 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-inner">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {label}
        </label>
        <button
          type="button"
          onClick={handleAddRow}
          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold tracking-wide uppercase flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200/40 dark:border-emerald-500/20"
        >
          <Plus className="w-3 h-3" />
          Add Row
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {list.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <input
              type="text"
              value={row.key}
              onChange={(e) => handleUpdateRow(idx, 'key', e.target.value)}
              placeholder={placeholderKey}
              className="w-1/3 bg-white text-slate-850 dark:bg-slate-950 dark:text-slate-200 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
            />
            <div className="flex-1">
              <VariableInput
                value={row.value}
                onChange={(val) => handleUpdateRow(idx, 'value', val)}
                placeholder={placeholderValue}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveRow(idx)}
              className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-450 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {helpText && (
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block">
          💡 {helpText}
        </span>
      )}
    </div>
  );
}

/**
 * 4. Send to Custom API Setup
 */
function OutboundWebhookSetup({
  method,
  setMethod,
  endpoint,
  setEndpoint,
  payloadType,
  setPayloadType,
  headersList,
  setHeadersList,
  bodyList,
  setBodyList
}) {
  const methods = [
    { value: 'POST', label: 'POST' },
    { value: 'GET', label: 'GET' },
    { value: 'PUT', label: 'PUT' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'DELETE', label: 'DELETE' }
  ];

  const payloadTypes = [
    { value: 'JSON', label: 'JSON (application/json)' },
    { value: 'Form Data', label: 'Form Data (multipart/form-data)' },
    { value: 'Encoded', label: 'Form Query Encoded' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <PremiumSelector
            label="HTTP Method"
            value={method}
            onChange={setMethod}
            options={methods}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            API Endpoint Target URL
          </label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.mycrm.com/v1/leads"
            className="w-full bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
          <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">
            Enter the Webhook URL where you want to send the request.
          </span>
        </div>
      </div>

      <PremiumSelector
        label="Payload Type"
        value={payloadType}
        onChange={setPayloadType}
        options={payloadTypes}
      />

      <KeyValueBuilder
        label="Headers"
        list={headersList}
        setList={setHeadersList}
        placeholderKey="Header Name"
        placeholderValue="Header Value"
        helpText="Pass additional headers like Authorization tokens here."
      />

      {method !== 'GET' && (
        <KeyValueBuilder
          label="Set Data (Body Payload)"
          list={bodyList}
          setList={setBodyList}
          placeholderKey="Key"
          placeholderValue="Value or Variable Mapping"
          helpText="Build the body payload parameters dynamically. Value supports variables."
        />
      )}
    </div>
  );
}

/**
 * 5. Webinar Setup Component
 */
function WebinarSetup({ webinarId, setWebinarId, webinarsList }) {
  return (
    <div className="space-y-4">
      <PremiumSelector
        label="Select Webinar"
        value={webinarId}
        onChange={setWebinarId}
        options={[
          { value: '', label: 'Select a Webinar...' },
          ...webinarsList.map(w => ({ value: w._id, label: w.webinarName }))
        ]}
      />
    </div>
  );
}

/**
 * 6. WhatsApp List Setup Component
 */
function WhatsAppListSetup({ whatsappGroupId, setWhatsappGroupId, tagsList }) {
  return (
    <div className="space-y-4">
      <PremiumSelector
        label="Select WhatsApp Group / Broadcast List"
        value={whatsappGroupId}
        onChange={setWhatsappGroupId}
        options={[
          { value: '', label: 'Select WhatsApp Tag...' },
          ...tagsList.map(t => ({ value: t.name || t._id, label: t.name }))
        ]}
      />
    </div>
  );
}

/**
 * 6.5 WhatsApp Project Setup Component
 */
function WhatsAppProjectSetup({ projectId, setProjectId, projectsList }) {
  return (
    <div className="space-y-4">
      <PremiumSelector
        label="Select WhatsApp Project"
        value={projectId}
        onChange={setProjectId}
        options={[
          { value: '', label: 'Select a Project...' },
          ...projectsList.map(p => ({ value: p._id, label: p.projectName }))
        ]}
      />
    </div>
  );
}

function SequenceSetup({ sequenceId, setSequenceId, sequencesList }) {
  return (
    <div className="space-y-4">
      <PremiumSelector
        label="Select Sequence Campaign"
        value={sequenceId}
        onChange={setSequenceId}
        options={[
          { value: '', label: 'Select a Sequence...' },
          ...sequencesList.map(s => ({ value: s._id, label: s.name }))
        ]}
      />
    </div>
  );
}

/**
 * 8. Tag Setup Component
 */
function TagSetup({ tagName, setTagName, wlhTagAction, setWlhTagAction, tagsList, isWlhAction }) {
  return (
    <div className="space-y-4">
      {isWlhAction && (
        <PremiumSelector
          label="Operation Type"
          value={wlhTagAction}
          onChange={setWlhTagAction}
          options={[
            { value: 'add', label: 'Add Tag' },
            { value: 'remove', label: 'Remove Tag' }
          ]}
        />
      )}
      <PremiumSelector
        label="Tag Selection"
        value={tagName}
        onChange={setTagName}
        options={[
          { value: '', label: 'Select a Tag...' },
          ...tagsList.map(t => ({ value: t.name || t._id, label: t.name }))
        ]}
      />
    </div>
  );
}

/**
 * 9. WhatsApp Send Media Setup Component
 */
function WhatsAppSendMediaSetup({
  mediaUrl,
  setMediaUrl,
  whatsappPhone,
  setWhatsappPhone,
  whatsappCaption,
  setWhatsappCaption
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <VariableInput
          label="Recipient Phone Number"
          value={whatsappPhone}
          onChange={setWhatsappPhone}
          placeholder="Map the destination WhatsApp number with country code"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the destination WhatsApp number with country code
        </span>
      </div>
      <div className="space-y-1 flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
          Image / Video Asset URL
        </label>
        <input
          type="text"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://assets.mycrm.com/banner.mp4"
          className="w-full bg-slate-50 text-slate-855 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
        />
      </div>
      <div className="space-y-1">
        <VariableInput
          label="Caption (Optional)"
          value={whatsappCaption}
          onChange={setWhatsappCaption}
          placeholder="Enter text to accompany the media"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Enter text to accompany the media
        </span>
      </div>
    </div>
  );
}

/**
 * 10. WhatsApp Send Link Setup Component
 */
function WhatsAppSendLinkSetup({
  linkUrl,
  setLinkUrl,
  whatsappPhone,
  setWhatsappPhone,
  whatsappLinkText,
  setWhatsappLinkText
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <VariableInput
          label="Recipient Phone Number"
          value={whatsappPhone}
          onChange={setWhatsappPhone}
          placeholder="Map the destination WhatsApp number with country code"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          Map the destination WhatsApp number with country code
        </span>
      </div>
      <div className="space-y-1 flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
          Clickable URL Target
        </label>
        <input
          type="text"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://mywebinar.com/join/..."
          className="w-full bg-slate-50 text-slate-855 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
        />
      </div>
      <div className="space-y-1">
        <VariableInput
          label="Link Message Text"
          value={whatsappLinkText}
          onChange={setWhatsappLinkText}
          placeholder="The message body containing the link"
        />
        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
          The message body containing the link
        </span>
      </div>
    </div>
  );
}

/**
 * Core ActionSetupDrawer Component
 */
export default function ActionSetupDrawer({
  isOpen,
  onClose,
  nodeId,
  currentNodeData = {},
  onUpdate
}) {
  const { projectId: urlProjectId } = useParams();
  const [activeTab, setActiveTab] = useState('setup');
  const [isTesting, setIsTesting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const nodes = useSelector((state) => state.flow?.nodes || []);

  const activeActionType = useMemo(() => {
    return currentNodeData?.actionType || '';
  }, [currentNodeData?.actionType]);



  // Auth integrations toggle states (For Google account)
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);

  // Local state fields
  const [wabaAccount, setWabaAccount] = useState('support');
  const [template, setTemplate] = useState('');
  const [variables, setVariables] = useState({});

  const [provider, setProvider] = useState('convertkit');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Enterprise Email integration states
  const [emailAddress, setEmailAddress] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const [spreadsheet, setSpreadsheet] = useState('leads_2026');
  const [worksheet, setWorksheet] = useState('sheet1');
  const [columnMappings, setColumnMappings] = useState({});
  const [isSpreadsheetMapped, setIsSpreadsheetMapped] = useState(false);
  const [isSheetMapped, setIsSheetMapped] = useState(false);

  const [method, setMethod] = useState('POST');
  const [endpoint, setEndpoint] = useState('');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [reqBody, setReqBody] = useState('{\n  "name": "{{1.Name}}",\n  "email": "{{1.Email}}"\n}');
  const [payloadType, setPayloadType] = useState('JSON');
  const [headersList, setHeadersList] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [bodyList, setBodyList] = useState([{ key: '', value: '' }]);

  // New action states
  const [webinarId, setWebinarId] = useState('');
  const [webinarFirstName, setWebinarFirstName] = useState('');
  const [webinarLastName, setWebinarLastName] = useState('');
  const [webinarEmail, setWebinarEmail] = useState('');
  const [webinarPhone, setWebinarPhone] = useState('');
  const [whatsappGroupId, setWhatsappGroupId] = useState('');
  const [sequenceId, setSequenceId] = useState('');
  const [tagName, setTagName] = useState('');
  const [wlhTagAction, setWlhTagAction] = useState('add');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [projectId, setProjectId] = useState(urlProjectId || '');

  // WhatsApp refined payload states
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappCaption, setWhatsappCaption] = useState('');
  const [whatsappLinkText, setWhatsappLinkText] = useState('');
  const [whatsappName, setWhatsappName] = useState('');

  const [webinarsList, setWebinarsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [wabaTagsList, setWabaTagsList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [sequencesList, setSequencesList] = useState([]);
  const [approvedTemplatesList, setApprovedTemplatesList] = useState([]);
  const [sessionTemplatesList, setSessionTemplatesList] = useState([]);

  const projectOptions = useMemo(() => {
    return projectsList.map(p => ({
      value: p._id || p.id || '',
      label: p.projectName || p.name || 'Unnamed Project'
    }));
  }, [projectsList]);

  const isWhatsAppAction = useMemo(() => {
    return (
      activeActionType?.startsWith('whatsapp_') ||
      activeActionType?.includes('whatsapp') ||
      activeActionType?.includes('sequence') ||
      activeActionType === 'send_whatsapp_approved'
    );
  }, [activeActionType]);

  // Sync back local states on render if they exist in Redux
  useEffect(() => {
    if (currentNodeData) {
      setWabaAccount(currentNodeData.wabaAccount || 'support');
      setTemplate(currentNodeData.templateName || '');
      setVariables(currentNodeData.variables || {});
      setProvider(currentNodeData.autoresponder || 'convertkit');
      setRecipient(currentNodeData.recipient || '');
      setSubject(currentNodeData.subject || '');
      setEmailBody(currentNodeData.emailBody || '');

      // Hydrate Enterprise Email Integration states
      setEmailAddress(currentNodeData.emailAddress || currentNodeData.recipient || '');
      setFirstName(currentNodeData.firstName || '');
      setLastName(currentNodeData.lastName || '');
      setSelectedList(currentNodeData.selectedList || '');
      setSelectedTag(currentNodeData.selectedTag || '');
      setSpreadsheet(currentNodeData.spreadsheet || 'leads_2026');
      setWorksheet(currentNodeData.worksheet || 'sheet1');
      setColumnMappings(currentNodeData.columnMappings || {});
      setIsSpreadsheetMapped(currentNodeData.isSpreadsheetMapped || false);
      setIsSheetMapped(currentNodeData.isSheetMapped || false);
      setMethod(currentNodeData.apiMethod || 'POST');
      setEndpoint(currentNodeData.apiEndpoint || '');
      setHeaders(currentNodeData.headers || '{\n  "Content-Type": "application/json"\n}');
      setReqBody(currentNodeData.reqBody || '{\n  "name": "{{1.Name}}",\n  "email": "{{1.Email}}"\n}');

      setPayloadType(currentNodeData.payloadType || 'JSON');

      // Hydrate headersList
      let parsedHeaders = [];
      try {
        const rawHeaders = typeof currentNodeData.headers === 'string'
          ? JSON.parse(currentNodeData.headers)
          : currentNodeData.headers;
        if (rawHeaders && typeof rawHeaders === 'object') {
          parsedHeaders = Object.entries(rawHeaders).map(([k, v]) => ({ key: k, value: String(v) }));
        }
      } catch (e) { }
      if (parsedHeaders.length === 0) {
        if (Array.isArray(currentNodeData.headersList)) {
          parsedHeaders = currentNodeData.headersList;
        } else {
          parsedHeaders = [{ key: 'Content-Type', value: 'application/json' }];
        }
      }
      setHeadersList(parsedHeaders);

      // Hydrate bodyList
      let parsedBody = [];
      try {
        const rawBody = typeof currentNodeData.reqBody === 'string'
          ? JSON.parse(currentNodeData.reqBody)
          : currentNodeData.reqBody;
        if (rawBody && typeof rawBody === 'object') {
          parsedBody = Object.entries(rawBody).map(([k, v]) => ({ key: k, value: String(v) }));
        }
      } catch (e) { }
      if (parsedBody.length === 0) {
        if (Array.isArray(currentNodeData.bodyList)) {
          parsedBody = currentNodeData.bodyList;
        } else {
          parsedBody = [{ key: '', value: '' }];
        }
      }
      setBodyList(parsedBody);

      // New properties
      setWebinarId(currentNodeData.webinarId || '');
      setWebinarFirstName(currentNodeData.webinarFirstName || '');
      setWebinarLastName(currentNodeData.webinarLastName || '');
      setWebinarEmail(currentNodeData.webinarEmail || '');

      let resolvedWebinarPhone = currentNodeData.webinarPhone || '';
      if (!resolvedWebinarPhone) {
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (triggerNode) {
          const triggerType = triggerNode.data?.triggerType || '';
          if (triggerType === 'razorpay') {
            resolvedWebinarPhone = '{{1.payload.payment.entity.contact}}';
          } else if (triggerType === 'meta_leads') {
            resolvedWebinarPhone = '{{1.phone_number}}';
          } else if (triggerType === 'webinar_registration' || triggerType === 'contact_added_webinar') {
            resolvedWebinarPhone = '{{1.phone}}';
          } else {
            resolvedWebinarPhone = '{{1.from}}';
          }
        }
      }
      setWebinarPhone(resolvedWebinarPhone);

      setWhatsappGroupId(currentNodeData.whatsappGroupId || '');
      setSequenceId(currentNodeData.sequenceId || '');
      setTagName(currentNodeData.tagName || '');
      setWlhTagAction(currentNodeData.wlhTagAction || 'add');
      setMediaUrl(currentNodeData.mediaUrl || '');
      setLinkUrl(currentNodeData.linkUrl || '');
      setProjectId(currentNodeData.projectId || currentNodeData.whatsappProjectId || urlProjectId || '');

      let resolvedWhatsappPhone = currentNodeData.whatsappPhone || currentNodeData.recipientPhone || currentNodeData.phone || '';
      if (!resolvedWhatsappPhone) {
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (triggerNode) {
          const triggerType = triggerNode.data?.triggerType || '';
          if (triggerType === 'razorpay') {
            resolvedWhatsappPhone = '{{1.payload.payment.entity.contact}}';
          } else if (triggerType === 'meta_leads') {
            resolvedWhatsappPhone = '{{1.phone_number}}';
          } else if (triggerType === 'webinar_registration' || triggerType === 'contact_added_webinar') {
            resolvedWhatsappPhone = '{{1.phone}}';
          } else {
            resolvedWhatsappPhone = '{{1.from}}';
          }
        }
      }
      setWhatsappPhone(resolvedWhatsappPhone);

      setWhatsappCaption(currentNodeData.whatsappCaption || currentNodeData.caption || '');
      setWhatsappLinkText(currentNodeData.whatsappLinkText || currentNodeData.linkText || '');
      setWhatsappName(currentNodeData.whatsappName || currentNodeData.fullName || '');
      setTestCompleted(currentNodeData.payloadReceived || false);
    }
  }, [currentNodeData, isOpen, nodes]);

  // Load webinars, tags, and projects list from backend
  useEffect(() => {
    if (!isOpen) return;

    // Load webinars list
    instance.post('/webinar/data', { filters: {} }, { params: { page: 1, limit: 1000 } })
      .then(res => {
        const list = res?.data?.result || res?.data?.webinarPageData || [];
        setWebinarsList(list);
      })
      .catch(err => console.error("Error fetching webinars inside ActionSetupDrawer:", err));

    // Load tags list
    instance.get('tags')
      .then(res => {
        const responseData = res?.data || res;
        let list = [];
        if (Array.isArray(responseData)) {
          list = responseData;
        } else if (Array.isArray(responseData?.data)) {
          list = responseData.data;
        } else if (Array.isArray(responseData?.tags)) {
          list = responseData.tags;
        } else if (Array.isArray(responseData?.results)) {
          list = responseData.results;
        }
        setTagsList(list);
      })
      .catch(err => console.error("Error fetching tags inside ActionSetupDrawer:", err));

    // Load projects list
    instance.get('/projects', { params: { page: 1, limit: 1000 } })
      .then(res => {
        const list = res?.data?.results || res?.data?.result || res?.data || [];
        setProjectsList(list);
      })
      .catch(err => console.error("Error fetching projects inside ActionSetupDrawer:", err));
  }, [isOpen]);

  // Load project-specific WABA tags, sequences, and templates when projectId changes
  useEffect(() => {
    if (!isOpen || !projectId) {
      setWabaTagsList([]);
      setSequencesList([]);
      setApprovedTemplatesList([]);
      setSessionTemplatesList([]);
      return;
    }

    // Load WABA tags list for selected project
    instance.get('/waba-tags', { params: { projectId } })
      .then(res => {
        const responseData = res?.data || res;
        let list = [];
        if (Array.isArray(responseData)) {
          list = responseData;
        } else if (Array.isArray(responseData?.data)) {
          list = responseData.data;
        } else if (Array.isArray(responseData?.tags)) {
          list = responseData.tags;
        } else if (Array.isArray(responseData?.results)) {
          list = responseData.results;
        }
        setWabaTagsList(list);
      })
      .catch(err => console.error("Error fetching project WABA tags inside ActionSetupDrawer:", err));

    // Load sequences list for selected project
    instance.get('/whatsapp-program', { params: { projectId, page: 1, limit: 1000 } })
      .then(res => {
        const list = res?.data?.programs || res?.data?.result || res?.data || [];
        setSequencesList(list);
      })
      .catch(err => console.error("Error fetching project sequences inside ActionSetupDrawer:", err));

    // Load Meta WABA approved templates for selected project
    instance.get(`/waba-template/${projectId}`)
      .then(res => {
        const responseData = res?.data?.data || res?.data;
        let list = [];
        if (Array.isArray(responseData)) {
          list = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          list = responseData.data;
        } else if (responseData && Array.isArray(responseData.results)) {
          list = responseData.results;
        }
        setApprovedTemplatesList(list);
      })
      .catch(err => console.error("Error fetching project approved templates inside ActionSetupDrawer:", err));

    // Load WABA session templates (quick replies) for selected project
    instance.get(`/quick-replies/${projectId}`)
      .then(res => {
        const responseData = res?.data?.data || res?.data;
        let list = [];
        if (responseData) {
          if (Array.isArray(responseData.data)) {
            list = responseData.data;
          } else if (Array.isArray(responseData)) {
            list = responseData;
          } else if (Array.isArray(responseData.results)) {
            list = responseData.results;
          } else if (Array.isArray(responseData.result)) {
            list = responseData.result;
          }
        }
        setSessionTemplatesList(list);
      })
      .catch(err => console.error("Error fetching project session templates inside ActionSetupDrawer:", err));
  }, [isOpen, projectId]);

  // Action brand details mapping
  const actionDetails = useMemo(() => {
    switch (activeActionType) {
      case 'whatsapp_send_approved_template':
      case 'send_whatsapp_approved':
      case 'send_whatsapp':
      case 'whatsapp_send_session_template':
        return {
          title: 'WhatsApp message template',
          desc: 'Deliver template notifications directly to WhatsApp clients.',
          icon: <MessageSquare className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };
      case 'whatsapp_send_media':
        return {
          title: 'WhatsApp: Send Image/Video',
          desc: 'Send media files dynamically to contact via WhatsApp.',
          icon: <MessageSquare className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };
      case 'whatsapp_send_link':
        return {
          title: 'WhatsApp: Send Link',
          desc: 'Send clickable action URLs dynamically to contact.',
          icon: <MessageSquare className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };
      case 'crm_register_webinar':
      case 'add_to_webinar':
        return {
          title: 'Register Contact to Webinar',
          desc: 'Register contacts dynamically into your active webinars.',
          icon: <Video className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };

      case 'add_to_whatsapp':
        return {
          title: 'Add Contact to WhatsApp',
          desc: 'Add contacts to your WhatsApp broadcasts and group updates.',
          icon: <MessageSquare className="w-5 h-5 relative z-10 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };
      case 'add_to_sequence':
      case 'remove_from_sequence':
        return {
          title: 'CRM Sequence Campaign',
          desc: 'Add or remove contact execution paths in a sequence drip campaign.',
          icon: <Play className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };
      case 'add_tag_crm':
      case 'add_tag_whatsapp':
      case 'add_tag_email_autoresponder':
      case 'whatsapp_add_remove_wlh_tag':
      case 'whatsapp_add_remove_whatsapp_tag':
        return {
          title: 'Contact Tag Operation',
          desc: 'Apply or discard segment tags to contacts dynamically.',
          icon: <Settings className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'ck_add_subscriber':
        return {
          title: 'ConvertKit: Add/Update Subscriber',
          desc: 'Subscribe a new contact to a form or sequence in ConvertKit.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'ck_add_tag':
        return {
          title: 'ConvertKit: Add Tag',
          desc: 'Apply a segment tag to an existing contact in ConvertKit.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'ac_add_contact':
        return {
          title: 'ActiveCampaign: Add/Update Contact',
          desc: 'Create or update subscriber details inside ActiveCampaign.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'ac_add_tag':
        return {
          title: 'ActiveCampaign: Add Tag',
          desc: 'Attach an interest tag to a subscriber profile in ActiveCampaign.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'pabbly_add_subscriber':
        return {
          title: 'Pabbly: Add/Update Subscriber',
          desc: 'Dynamically register a subscriber to a Pabbly list.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'pabbly_add_tag':
        return {
          title: 'Pabbly: Add Tag',
          desc: 'Apply a segment tag to a contact profile in Pabbly.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'aweber_add_subscriber':
        return {
          title: 'AWeber: Add/Update Subscriber',
          desc: 'Subscribe a new contact or update their details in AWeber.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'aweber_add_tag':
        return {
          title: 'AWeber: Add Tag',
          desc: 'Apply segment tags to an existing subscriber in AWeber.',
          icon: <Mail className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'teal'
        };
      case 'add_to_google_sheet':
        return {
          title: 'Log Row to Google Sheet',
          desc: 'Write custom variables and CRM data directly into a spreadsheet.',
          icon: <Database className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'emerald'
        };
      case 'outbound_webhook':
      case 'send_to_api':
        return {
          title: 'Call Outbound REST API',
          desc: 'Send customized POST/GET requests to external servers.',
          icon: <Code className="w-5 h-5 relative z-10 animate-pulse" />,
          colorTheme: 'blue'
        };
      default:
        return {
          title: 'Select Action Operation',
          desc: 'Please choose an action type to configure its settings.',
          icon: <Settings className="w-5 h-5 relative z-10" />,
          colorTheme: 'slate'
        };
    }
  }, [activeActionType]);

  // Dynamic test simulation outputs
  const testResponse = useMemo(() => {
    switch (activeActionType) {
      case 'whatsapp_send_session_template':
        return {
          status: "success",
          message_id: "wamid.HBgLOTkxOTg3NjU0MzIxMBUUCzFDRkUzNUFGNEZDNzFCM0RFAA==",
          recipient_id: whatsappPhone || "Customer Lead",
          template_name: template || "session_support_reply"
        };
      case 'whatsapp_send_approved_template':
      case 'send_whatsapp_approved':
        return {
          status: "success",
          message_id: "wamid.HBgLOTkxOTg3NjU0MzIxMBUUCzFDRkUzNUFGNEZDNzFCM0RFAA==",
          recipient_id: whatsappPhone || "Customer Lead",
          template_name: template || "welcome_message"
        };
      case 'send_whatsapp':
        return {
          status: "success",
          message_id: "wamid.HBgLOTkxOTg3NjU0MzIxMBUUCzFDRkUzNUFGNEZDNzFCM0RFAA==",
          recipient_id: whatsappPhone || "Customer Lead",
          timestamp: Date.now()
        };
      case 'whatsapp_send_media':
        return {
          status: "success",
          message_id: "wamid.HBgLOTkxOTg3NjU0MzIxMBUUCzFDRkUzNUFGNEZDNzFCM0RFAA==",
          media_id: "media_waba_8830129",
          media_url: mediaUrl || "https://assets.mycrm.com/banner.mp4"
        };
      case 'whatsapp_send_link':
        return {
          status: "success",
          message_id: "wamid.HBgLOTkxOTg3NjU0MzIxMBUUCzFDRkUzNUFGNEZDNzFCM0RFAA==",
          sent_url: linkUrl || "https://mywebinar.com/join/..."
        };
      case 'whatsapp_add_remove_wlh_tag':
      case 'whatsapp_add_remove_whatsapp_tag':
        return {
          status: "success",
          tag_name: tagName || "VIP",
          operation: wlhTagAction || "add"
        };
      case 'ck_add_subscriber':
        return {
          status: "success",
          provider: "ConvertKit",
          operation: "add_update_subscriber",
          subscriber: {
            email: emailAddress || "lead@example.com",
            first_name: firstName || "John",
            list_sequence: selectedList || "welcome_sequence",
            state: "active"
          }
        };
      case 'ck_add_tag':
        return {
          status: "success",
          provider: "ConvertKit",
          operation: "add_tag",
          email: emailAddress || "lead@example.com",
          tag_applied: selectedTag || "VIP"
        };
      case 'ac_add_contact':
        return {
          status: "success",
          provider: "ActiveCampaign",
          operation: "add_update_contact",
          contact: {
            email: emailAddress || "lead@example.com",
            first_name: firstName || "John",
            last_name: lastName || "Doe",
            list_id: selectedList || "master_contacts"
          }
        };
      case 'ac_add_tag':
        return {
          status: "success",
          provider: "ActiveCampaign",
          operation: "add_tag",
          email: emailAddress || "lead@example.com",
          tag_name: selectedTag || "Customer"
        };
      case 'pabbly_add_subscriber':
        return {
          status: "success",
          provider: "Pabbly Email Marketing",
          operation: "add_update_subscriber",
          subscriber: {
            email: emailAddress || "lead@example.com",
            full_name: firstName || "John Doe",
            list: selectedList || "default_list"
          }
        };
      case 'pabbly_add_tag':
        return {
          status: "success",
          provider: "Pabbly Email Marketing",
          operation: "add_tag",
          email: emailAddress || "lead@example.com",
          tag_applied: selectedTag || "Webinar"
        };
      case 'aweber_add_subscriber':
        return {
          status: "success",
          provider: "AWeber",
          operation: "add_update_subscriber",
          subscriber: {
            email: emailAddress || "lead@example.com",
            full_name: firstName || "John Doe",
            list: selectedList || "main_newsletter",
            status: "subscribed"
          }
        };
      case 'aweber_add_tag':
        return {
          status: "success",
          provider: "AWeber",
          operation: "add_tag",
          email: emailAddress || "lead@example.com",
          tags_applied: selectedTag || "Webinar"
        };
      case 'crm_register_webinar':
      case 'add_to_webinar':
        return {
          status: "success",
          provider: "Internal CRM",
          operation: "register_webinar",
          webinar_id: webinarId || "saas_mastery",
          registrant: {
            first_name: webinarFirstName || "John",
            last_name: webinarLastName || "Doe",
            email: webinarEmail || "lead@example.com",
            phone: webinarPhone || "+1234567890"
          }
        };

      case 'add_to_google_sheet':
        return {
          status: "success",
          spreadsheet_id: "1whc2910faN290a1bc",
          worksheet: worksheet,
          inserted_row: 243,
          data_logged: columnMappings
        };
      case 'outbound_webhook':
      case 'send_to_api':
      default:
        return {
          status: "success",
          status_code: 200,
          response: {
            success: true,
            lead_id: "crm_lead_9921095"
          },
          headers_received: {
            "content-type": "application/json",
            "server": "nginx"
          }
        };
    }
  }, [activeActionType, template, provider, recipient, subject, worksheet, columnMappings, emailAddress, firstName, lastName, selectedList, selectedTag, webinarId, webinarFirstName, webinarLastName, webinarEmail, webinarPhone]);

  const extractTemplateInfo = (tpl) => {
    let body = '';
    let buttons = [];
    if (tpl && Array.isArray(tpl.components)) {
      const bodyComp = tpl.components.find(c => c.type === 'BODY');
      if (bodyComp) {
        body = bodyComp.text || '';
      }
      const buttonsComp = tpl.components.find(c => c.type === 'BUTTONS');
      if (buttonsComp && Array.isArray(buttonsComp.buttons)) {
        buttons = buttonsComp.buttons.map((btn, index) => ({
          id: btn.id || `btn_${index + 1}`,
          type: btn.type || 'QUICK_REPLY',
          text: btn.text || ''
        }));
      }
    }
    return { body, buttons };
  };

  const getSelectedTemplateInfo = () => {
    let tplBody = '';
    let tplButtons = [];
    const isSession = activeActionType === 'whatsapp_send_session_template';
    if (isSession) {
      const selectedSession = sessionTemplatesList.find(t => t.name === template || t.configuredTemplateName === template || t.templateName === template);
      if (selectedSession) {
        tplBody = selectedSession.content || '';
        if (Array.isArray(selectedSession.components)) {
          const bodyComp = selectedSession.components.find(c => c.type === 'BODY');
          if (bodyComp) {
            tplBody = bodyComp.text || selectedSession.content || '';
          }
          const buttonsComp = selectedSession.components.find(c => c.type === 'BUTTONS');
          if (buttonsComp && Array.isArray(buttonsComp.buttons)) {
            tplButtons = buttonsComp.buttons.map((btn, index) => ({
              id: btn.id || `btn_${index + 1}`,
              type: btn.type || 'QUICK_REPLY',
              text: btn.text || ''
            }));
          }
        } else {
          const metaTpl = approvedTemplatesList.find(t => t.name === selectedSession.templateName);
          if (metaTpl) {
            const info = extractTemplateInfo(metaTpl);
            if (info.body) tplBody = info.body;
            if (info.buttons && info.buttons.length > 0) tplButtons = info.buttons;
          }
        }
      }
    } else {
      const metaTpl = approvedTemplatesList.find(t => t.name === template);
      if (metaTpl) {
        const info = extractTemplateInfo(metaTpl);
        tplBody = info.body;
        tplButtons = info.buttons;
      }
    }
    return { tplBody, tplButtons };
  };

  const handleTestAction = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestCompleted(false);

    try {
      const compiledHeaders = {};
      headersList.forEach(row => {
        if (row.key.trim()) {
          compiledHeaders[row.key.trim()] = row.value;
        }
      });

      const compiledBody = {};
      bodyList.forEach(row => {
        if (row.key.trim()) {
          compiledBody[row.key.trim()] = row.value;
        }
      });

      const statePayload = {
        ...currentNodeData,
        actionType: activeActionType,
        wabaAccount,
        templateName: template,
        variables,
        // Email
        autoresponder: provider,
        recipient,
        subject,
        emailBody,
        emailAddress,
        firstName,
        lastName,
        selectedList,
        selectedTag,
        // Sheets
        spreadsheet,
        worksheet,
        columnMappings,
        isSpreadsheetMapped,
        isSheetMapped,
        mappedFields: columnMappings,
        // Outbound Custom API URL
        apiMethod: method,
        apiEndpoint: endpoint,
        payloadType,
        headers: JSON.stringify(compiledHeaders, null, 2),
        reqBody: JSON.stringify(compiledBody, null, 2),
        headersList,
        bodyList,
        // Webinar
        webinarId,
        webinarFirstName,
        webinarLastName,
        webinarEmail,
        webinarPhone,
        // WhatsApp Broadcast / Group list
        whatsappGroupId,
        // Sequences
        sequenceId,
        // Tags
        tagName,
        wlhTagAction,
        // Media & link assets
        mediaUrl,
        linkUrl,
        // WhatsApp Project assignment
        projectId,
        whatsappProjectId: projectId,
        // WhatsApp target settings
        whatsappPhone,
        whatsappCaption,
        whatsappLinkText,
        whatsappName,
        // Test result fields
        payloadReceived: true,
        isDynamic: true
      };

      const response = await instance.post('/flow-execution/test-action', { 
         nodeData: statePayload,
         testVariables: { email: 'test@example.com', phone: '1234567890', first_name: 'Test' } // TODO: Bind to dynamic user test context state when available
      });
      
      toast.success('Action executed successfully!', {
        description: `Backend execution succeeded for: ${actionDetails.title}`
      });


      if (onUpdate) {
        onUpdate({ ...statePayload, capturedResponse: response.data?.data || response.data });
      }

    } catch (error) {
      toast.error('Error testing action:', {
        description: error.message
      });
    } finally {
      setIsTesting(false);
      setTestCompleted(true);
      setIsAccordionOpen(true);
    }
  };

  // Render Setup body
  const renderSetupBody = () => {
    switch (activeActionType) {
      case 'whatsapp_send_approved_template':
      case 'send_whatsapp_approved':
      case 'send_whatsapp':
        return (
          <WhatsAppSendSetup
            template={template}
            setTemplate={setTemplate}
            variables={variables}
            setVariables={setVariables}
            whatsappPhone={whatsappPhone}
            setWhatsappPhone={setWhatsappPhone}
            isSession={false}
            approvedTemplatesList={approvedTemplatesList}
            sessionTemplatesList={sessionTemplatesList}
          />
        );
      case 'whatsapp_send_session_template':
        return (
          <WhatsAppSendSetup
            template={template}
            setTemplate={setTemplate}
            variables={variables}
            setVariables={setVariables}
            whatsappPhone={whatsappPhone}
            setWhatsappPhone={setWhatsappPhone}
            isSession={true}
            approvedTemplatesList={approvedTemplatesList}
            sessionTemplatesList={sessionTemplatesList}
          />
        );
      case 'whatsapp_send_media':
        return (
          <WhatsAppSendMediaSetup
            mediaUrl={mediaUrl}
            setMediaUrl={setMediaUrl}
            whatsappPhone={whatsappPhone}
            setWhatsappPhone={setWhatsappPhone}
            whatsappCaption={whatsappCaption}
            setWhatsappCaption={setWhatsappCaption}
          />
        );
      case 'whatsapp_send_link':
        return (
          <WhatsAppSendLinkSetup
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            whatsappPhone={whatsappPhone}
            setWhatsappPhone={setWhatsappPhone}
            whatsappLinkText={whatsappLinkText}
            setWhatsappLinkText={setWhatsappLinkText}
          />
        );
      case 'crm_register_webinar':
      case 'add_to_webinar':
        return (
          <CrmRegisterWebinar
            webinarId={webinarId}
            setWebinarId={setWebinarId}
            webinarFirstName={webinarFirstName}
            setWebinarFirstName={setWebinarFirstName}
            webinarLastName={webinarLastName}
            setWebinarLastName={setWebinarLastName}
            webinarEmail={webinarEmail}
            setWebinarEmail={setWebinarEmail}
            webinarPhone={webinarPhone}
            setWebinarPhone={setWebinarPhone}
            webinarsList={webinarsList}
          />
        );
      case 'crm_remove_webinar':
        return (
          <CrmRemoveWebinar
            webinarId={webinarId}
            setWebinarId={setWebinarId}
            webinarEmail={webinarEmail}
            setWebinarEmail={setWebinarEmail}
            webinarsList={webinarsList}
          />
        );
      case 'add_to_whatsapp':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <VariableInput
                label="Phone Number"
                value={whatsappPhone}
                onChange={setWhatsappPhone}
                placeholder="Map the contact's phone number"
              />
              <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
                Map the contact's phone number
              </span>
            </div>
            <div className="space-y-1">
              <VariableInput
                label="Full Name"
                value={whatsappName}
                onChange={setWhatsappName}
                placeholder="Map the contact's name"
              />
              <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium block ml-1">
                Map the contact's name
              </span>
            </div>
          </div>
        );
      case 'add_to_sequence':
      case 'remove_from_sequence':
        return (
          <SequenceSetup
            sequenceId={sequenceId}
            setSequenceId={setSequenceId}
            sequencesList={sequencesList}
          />
        );
      case 'add_tag_crm':
      case 'add_tag_email_autoresponder':
        return (
          <TagSetup
            tagName={tagName}
            setTagName={setTagName}
            tagsList={tagsList}
            isWlhAction={false}
          />
        );
      case 'add_tag_whatsapp':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <VariableInput
                label="Target Phone Number"
                value={whatsappPhone}
                onChange={setWhatsappPhone}
                placeholder="Map the target WhatsApp number"
              />
              <span className="text-[9px] text-slate-450 dark:text-slate-550 font-medium block ml-1">
                Map the target WhatsApp number
              </span>
            </div>
            <TagSetup
              tagName={tagName}
              setTagName={setTagName}
              tagsList={wabaTagsList}
              isWlhAction={false}
            />
          </div>
        );
      case 'whatsapp_add_remove_wlh_tag':
        return (
          <TagSetup
            tagName={tagName}
            setTagName={setTagName}
            wlhTagAction={wlhTagAction}
            setWlhTagAction={setWlhTagAction}
            tagsList={tagsList}
            isWlhAction={true}
          />
        );
      case 'whatsapp_add_remove_whatsapp_tag':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <VariableInput
                label="Target Phone Number"
                value={whatsappPhone}
                onChange={setWhatsappPhone}
                placeholder="Map the target WhatsApp number"
              />
              <span className="text-[9px] text-slate-450 dark:text-slate-550 font-medium block ml-1">
                Map the target WhatsApp number
              </span>
            </div>
            <TagSetup
              tagName={tagName}
              setTagName={setTagName}
              wlhTagAction={wlhTagAction}
              setWlhTagAction={setWlhTagAction}
              tagsList={wabaTagsList}
              isWlhAction={true}
            />
          </div>
        );
      case 'ck_add_subscriber':
        return (
          <ConvertKitAddSubscriber
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            firstName={firstName}
            setFirstName={setFirstName}
            selectedList={selectedList}
            setSelectedList={setSelectedList}
          />
        );
      case 'ck_add_tag':
        return (
          <ConvertKitAddTag
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        );
      case 'ac_add_contact':
        return (
          <ActiveCampaignAddContact
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            selectedList={selectedList}
            setSelectedList={setSelectedList}
          />
        );
      case 'ac_add_tag':
        return (
          <ActiveCampaignAddTag
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        );
      case 'pabbly_add_subscriber':
        return (
          <PabblyAddSubscriber
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            firstName={firstName}
            setFirstName={setFirstName}
            selectedList={selectedList}
            setSelectedList={setSelectedList}
          />
        );
      case 'pabbly_add_tag':
        return (
          <PabblyAddTag
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        );
      case 'aweber_add_subscriber':
        return (
          <AWeberAddSubscriber
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            firstName={firstName}
            setFirstName={setFirstName}
            selectedList={selectedList}
            setSelectedList={setSelectedList}
          />
        );
      case 'aweber_add_tag':
        return (
          <AWeberAddTag
            emailAddress={emailAddress}
            setEmailAddress={setEmailAddress}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        );
      case 'add_to_google_sheet':
        return (
          <AddToGoogleSheetSetup
            isConnected={isGoogleConnected}
            onConnectToggle={() => setIsGoogleConnected(!isGoogleConnected)}
            spreadsheet={spreadsheet}
            setSpreadsheet={setSpreadsheet}
            worksheet={worksheet}
            setWorksheet={setWorksheet}
            columnMappings={columnMappings}
            setColumnMappings={setColumnMappings}
            isSpreadsheetMapped={isSpreadsheetMapped}
            setIsSpreadsheetMapped={setIsSpreadsheetMapped}
            isSheetMapped={isSheetMapped}
            setIsSheetMapped={setIsSheetMapped}
          />
        );
      case 'outbound_webhook':
      case 'send_to_api':
        return (
          <OutboundWebhookSetup
            method={method}
            setMethod={setMethod}
            endpoint={endpoint}
            setEndpoint={setEndpoint}
            payloadType={payloadType}
            setPayloadType={setPayloadType}
            headersList={headersList}
            setHeadersList={setHeadersList}
            bodyList={bodyList}
            setBodyList={setBodyList}
          />
        );
      default:
        return (
          <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-855 dark:text-slate-200">No Configurable fields for this Action type</h4>
            <p className="text-[10px] text-slate-505 dark:text-slate-455 font-medium max-w-sm mx-auto">
              Please select an action type from the dropdown first.
            </p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 z-[999] backdrop-blur-sm"
          />

          {/* Drawer container body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[45%] min-w-[500px] max-w-[700px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[1000] overflow-hidden flex flex-col transition-colors duration-300"
          >
            {/* Header section */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-xl animate-pulse" />
                  {actionDetails.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {actionDetails.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {actionDetails.desc}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 border-b border-slate-150 dark:border-slate-800/80 flex bg-white dark:bg-slate-900">
              <button
                onClick={() => setActiveTab('setup')}
                className={`py-3.5 px-2 text-xs font-bold relative transition-colors cursor-pointer ${activeTab === 'setup'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-605 dark:text-slate-550 dark:hover:text-slate-300'
                  }`}
              >
                Action Configuration
                {activeTab === 'setup' && (
                  <motion.div
                    layoutId="activeActionTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 dark:bg-emerald-400"
                  />
                )}
              </button>

              <button
                disabled
                className="py-3.5 px-2 text-xs font-bold text-slate-300 dark:text-slate-700 flex items-center gap-1.5 cursor-not-allowed ml-6 relative group"
              >
                Connections
                <Lock className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  OAuth Accounts are managed globally
                </span>
              </button>
            </div>

            {/* Scrollable inputs wrapper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                {isWhatsAppAction && (
                  urlProjectId ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                        🔒 Linked to Current Project
                      </span>
                    </div>
                  ) : (
                    <div className="w-full">
                      <PremiumSelector
                        label="Select WhatsApp Project"
                        value={projectId}
                        onChange={(val) => {
                          setProjectId(val);
                          setTemplate('');
                          setVariables({});
                        }}
                        options={projectOptions}
                        placeholder="Select a Project..."
                      />
                    </div>
                  )
                )}
                {renderSetupBody()}
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              {/* Action Validation testing */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleTestAction}
                  disabled={isTesting}
                  className={`w-full py-3.5 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2.5 font-bold text-xs cursor-pointer ${isTesting
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                      : testCompleted
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:border-emerald-650'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-855 shadow-sm'
                    }`}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>Validating Action Setup & Sending Test Packet...</span>
                    </>
                  ) : testCompleted ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Test Action Executed Successfully</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Validate & Test Action</span>
                    </>
                  )}
                </button>

                {/* Collapsible response accordion */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/20">
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-955/65 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${testCompleted ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{testCompleted ? 'Response Payload Received' : 'No Test Response Collected'}</span>
                    </div>
                    {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isAccordionOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-200 dark:border-slate-850"
                      >
                        <div className="p-4 bg-slate-950 text-slate-300 font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed">
                          {testCompleted ? (
                            <pre className="whitespace-pre-wrap">
                              <code className="text-emerald-400">
                                {JSON.stringify(testResponse, null, 2)
                                  .replace(/(".*?"|__.*?__)/g, (m) => `<span class="text-emerald-300">${m}</span>`)
                                  .split('\n')
                                  .map((line, idx) => (
                                    <div
                                      key={idx}
                                      dangerouslySetInnerHTML={{
                                        __html: line
                                          .replace(/: ("[^"]*")/g, ': <span class="text-green-400">$1</span>')
                                          .replace(/: (\d+)/g, ': <span class="text-yellow-450">$1</span>')
                                          .replace(/: (true|false)/g, ': <span class="text-amber-500">$1</span>')
                                      }}
                                    />
                                  ))
                                }
                              </code>
                            </pre>
                          ) : (
                            <div className="text-center py-6 text-slate-500 font-medium">
                              Waiting for Action Test execution packet. Click "Validate & Test Action" to run.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-255 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const compiledHeaders = {};
                  headersList.forEach(row => {
                    if (row.key.trim()) {
                      compiledHeaders[row.key.trim()] = row.value;
                    }
                  });

                  const compiledBody = {};
                  bodyList.forEach(row => {
                    if (row.key.trim()) {
                      compiledBody[row.key.trim()] = row.value;
                    }
                  });

                  const { tplBody, tplButtons } = getSelectedTemplateInfo();

                  const statePayload = {
                    actionType: activeActionType,
                    // WhatsApp Template Details
                    wabaAccount,
                    templateName: template,
                    templateBody: tplBody,
                    templateButtons: tplButtons,
                    variables,
                    // Email
                    autoresponder: provider,
                    recipient,
                    subject,
                    emailBody,
                    emailAddress,
                    firstName,
                    lastName,
                    selectedList,
                    selectedTag,
                    // Sheets
                    spreadsheet,
                    worksheet,
                    columnMappings,
                    isSpreadsheetMapped,
                    isSheetMapped,
                    mappedFields: columnMappings,
                    // Outbound Custom API URL
                    apiMethod: method,
                    apiEndpoint: endpoint,
                    payloadType,
                    headers: JSON.stringify(compiledHeaders, null, 2),
                    reqBody: JSON.stringify(compiledBody, null, 2),
                    headersList,
                    bodyList,
                    // Webinar
                    webinarId,
                    webinarFirstName,
                    webinarLastName,
                    webinarEmail,
                    webinarPhone,
                    // WhatsApp Broadcast / Group list
                    whatsappGroupId,
                    // Sequences
                    sequenceId,
                    // Tags
                    tagName,
                    wlhTagAction,
                    // Media & link assets
                    mediaUrl,
                    linkUrl,
                    // WhatsApp Project assignment
                    projectId,
                    whatsappProjectId: projectId,
                    // WhatsApp target settings
                    whatsappPhone,
                    whatsappCaption,
                    whatsappLinkText,
                    whatsappName,
                    // Test result fields
                    payloadReceived: testCompleted || false,
                    capturedResponse: testCompleted ? testResponse : (currentNodeData.capturedResponse || null),
                    isDynamic: testCompleted || false
                  };
                  if (onUpdate) {
                    onUpdate(statePayload);
                  }
                  toast.success('Action configurations saved successfully!');
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Save Action Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
