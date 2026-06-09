import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { instance } from '../../services/axiosInterceptor';
import { motion, AnimatePresence } from 'framer-motion';
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
  Key,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Custom Dropdown selector matching premium Radix styles
 */
function PremiumSelector({ label, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all cursor-pointer text-left shadow-inner"
      >
        <span className="truncate">{selectedOption?.label}</span>
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
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between rounded-lg cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
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
 * 1. Google Sheets Setup Component
 */
function GoogleSheetsSetup({ 
  isConnected, 
  onConnectToggle, 
  spreadsheet, 
  setSpreadsheet, 
  worksheet, 
  setWorksheet, 
  triggerColumn, 
  setTriggerColumn 
}) {
  const spreadsheets = []; // Fetch spreadsheets dynamically if needed
  const worksheets = []; // Fetch worksheets dynamically if needed

  return (
    <div className="space-y-4">
      {/* Auth block */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.5s3.81-8.5 8.503-8.5c2.098 0 4.01.763 5.498 2.019l3.07-3.07C18.232 1.205 15.397 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.88 0 12.24-4.837 12.24-12.24 0-.829-.077-1.457-.22-1.955H12.24z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Google Sheets Account</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">
              {isConnected ? 'Connected as user@gmail.com' : 'Disconnected'}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onConnectToggle}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
            isConnected
              ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
              : 'bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-250 dark:border-slate-750 shadow-sm'
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
            <PremiumSelector 
              label="Select Spreadsheet" 
              value={spreadsheet} 
              onChange={setSpreadsheet} 
              options={spreadsheets} 
            />
            <PremiumSelector 
              label="Select Worksheet" 
              value={worksheet} 
              onChange={setWorksheet} 
              options={worksheets} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
              Trigger Column
            </label>
            <input
              type="text"
              value={triggerColumn}
              onChange={(e) => setTriggerColumn(e.target.value)}
              placeholder="e.g. Email or C"
              className="w-full bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
              💡 The workflow will trigger when this specific column is updated. e.g., 'Email' or 'C'
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * 2. Meta Leads Ad Setup Component
 */
function MetaLeadsSetup({ 
  isConnected, 
  onConnectToggle, 
  facebookPage, 
  setFacebookPage, 
  leadForm, 
  setLeadForm 
}) {
  const pages = []; // Fetch Meta pages dynamically if needed
  const forms = []; // Fetch Lead Forms dynamically if needed

  return (
    <div className="space-y-4">
      {/* Auth block */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Facebook Leads Integration</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-455 font-medium">
              {isConnected ? 'Connected as WLH Marketing Manager' : 'Disconnected'}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onConnectToggle}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
            isConnected
              ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent shadow-blue-500/10'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect Facebook'}
        </button>
      </div>

      {isConnected && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <PremiumSelector 
              label="Select Facebook Page" 
              value={facebookPage} 
              onChange={setFacebookPage} 
              options={pages} 
            />
            <PremiumSelector 
              label="Select Lead Gen Form" 
              value={leadForm} 
              onChange={setLeadForm} 
              options={forms} 
            />
          </div>

          {/* New Instruction Alert Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3.5 rounded-xl flex flex-col gap-2 text-xs text-blue-755 dark:text-blue-300">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>To test this trigger, use the official Meta testing tool to generate a dummy lead.</span>
            </div>
            <a 
              href="https://developers.facebook.com/tools/lead-ads-testing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline pl-6 inline-flex items-center gap-1"
            >
              Open Lead Ads Testing Tool
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <span>Ensure your Facebook account has <strong>Admin access</strong> to the selected page and form.</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * 3. Razorpay Setup Component
 */
function RazorpaySetup({ 
  webhookUrl, 
  copied, 
  onCopy, 
  razorpayEvent, 
  setRazorpayEvent 
}) {
  const events = [
    { value: 'payment.captured', label: 'Payment Captured (payment.captured)' },
    { value: 'payment.failed', label: 'Payment Failed (payment.failed)' },
    { value: 'order.paid', label: 'Order Paid (order.paid)' },
    { value: 'subscription.charged', label: 'Subscription Charged (subscription.charged)' }
  ];

  return (
    <div className="space-y-4">
      <PremiumSelector 
        label="Select Payment Event" 
        value={razorpayEvent} 
        onChange={setRazorpayEvent} 
        options={events} 
      />

      {/* Webhook Endpoint displays */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            Razorpay Webhook Endpoint URL
          </label>
          <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Ready to Catch
          </span>
        </div>
        
        <div className="relative flex items-center w-full">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full bg-slate-50 text-slate-700 dark:bg-slate-950/80 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-12 py-3 text-xs font-mono select-all focus:outline-none transition-all shadow-inner"
          />
          <button
            onClick={onCopy}
            className={`absolute right-2 p-2 rounded-lg transition-all ${
              copied 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Premium Alert Box (Instructional Note) */}
      <div className="bg-yellow-50 dark:bg-yellow-950/10 border border-yellow-200 dark:border-yellow-900/40 p-4 rounded-xl flex gap-2.5 text-xs text-yellow-850 dark:text-yellow-300">
        <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Important Note:</strong> Log in to your Razorpay Dashboard, go to <strong>Settings &gt; Webhooks</strong>, and click 'Add New Webhook'. Paste the above URL and strictly select the exact same events you chose above. No secret key is required.
        </span>
      </div>
    </div>
  );
}

/**
 * 4. Contact Added To Webinar Setup Component
 */
function WebinarRegistrationSetup({ 
  activeWebinar, 
  setActiveWebinar,
  webinarsList = []
}) {
  const webinars = useMemo(() => {
    if (!webinarsList || webinarsList.length === 0) {
      return [
        { value: 'all_webinars', label: 'All Webinars' },
        { value: 'saas_mastery', label: 'SaaS Mastery Masterclass' },
        { value: 'sales_automation', label: 'High-Ticket Sales Automation' }
      ];
    }
    const list = webinarsList.map(w => ({
      value: w._id || w.id,
      label: w.webinarName || w.title || w.name
    }));
    return [
      { value: 'all_webinars', label: 'All Webinars' },
      ...list
    ];
  }, [webinarsList]);

  return (
    <div className="space-y-4">
      <PremiumSelector 
        label="Select CRM Webinar" 
        value={activeWebinar || 'all_webinars'} 
        onChange={setActiveWebinar} 
        options={webinars} 
      />
    </div>
  );
}

/**
 * 5. Contact Added To WLH WhatsApp Setup Component
 */
function WLHWhatsAppSetup({ 
  contactSegment, 
  setContactSegment, 
  triggerCondition, 
  setTriggerCondition,
  whatsappTagName,
  setWhatsappTagName,
  tagsList = [],
  segmentsList = []
}) {
  const segments = useMemo(() => {
    if (!segmentsList || segmentsList.length === 0) {
      return [
        { value: 'all_leads', label: 'All Leads' },
        { value: 'vip_customers', label: 'VIP Customers' },
        { value: 'unpaid_users', label: 'Unpaid Users' }
      ];
    }
    const list = segmentsList.map(s => {
      const name = typeof s === 'string' ? s : s.name || s.label || s.title || '';
      const id = typeof s === 'string' ? s : s._id || s.id || name;
      return { value: id, label: name };
    });
    return [
      { value: 'all_leads', label: 'All Leads' },
      ...list
    ];
  }, [segmentsList]);

  const conditions = [
    { value: 'tag_added', label: 'When Tag is Added' },
    { value: 'opted_in', label: 'When Opted-In' }
  ];

  const tags = useMemo(() => {
    if (!tagsList || tagsList.length === 0) {
      return [
        { value: 'vip_opt_in', label: 'VIP Opt-in (vip_opt_in)' },
        { value: 'saas_pro_customer', label: 'SaaS Pro Customer (saas_pro_customer)' },
        { value: 'lead_magnet', label: 'Lead Magnet (lead_magnet)' }
      ];
    }
    return tagsList.map(t => {
      const name = typeof t === 'string' ? t : t.name || t.tagName || t.value || '';
      return { value: name, label: name };
    });
  }, [tagsList]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <PremiumSelector 
          label="Select Contact Segment" 
          value={contactSegment} 
          onChange={setContactSegment} 
          options={segments} 
        />
        <PremiumSelector 
          label="Trigger Condition" 
          value={triggerCondition} 
          onChange={setTriggerCondition} 
          options={conditions} 
        />
      </div>

      {triggerCondition === 'tag_added' && (
        <div className="grid grid-cols-1 gap-4">
          <PremiumSelector 
            label="Select Trigger Tag" 
            value={whatsappTagName || (tags[0] ? tags[0].value : '')} 
            onChange={setWhatsappTagName} 
            options={tags} 
          />
        </div>
      )}
    </div>
  );
}

/**
 * 5.1 Incoming WhatsApp Message Setup
 */
function IncomingWhatsAppSetup() {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-xl flex gap-2.5 text-xs text-emerald-850 dark:text-emerald-300">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          This trigger automatically catches any incoming text message sent to your connected WhatsApp Business API number.
        </span>
      </div>
    </div>
  );
}

/**
 * 5.2 WhatsApp Keyword Match Setup
 */
function WhatsAppKeywordMatchSetup({ keyword, setKeyword, matchCondition, setMatchCondition }) {
  const matchOptions = [
    { value: 'exact', label: 'Exact Match' },
    { value: 'contains', label: 'Contains' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            Trigger Keyword(s)
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="START, OFFER, HELP"
            className="w-full bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
          <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">
            Enter comma-separated keywords e.g., 'START, OFFER, HELP'
          </span>
        </div>

        <PremiumSelector
          label="Match Condition"
          value={matchCondition}
          onChange={setMatchCondition}
          options={matchOptions}
        />
      </div>
    </div>
  );
}

/**
 * 5.3 WhatsApp Template Button Clicked Setup
 */
function WhatsAppTemplateButtonsSetup({ templateName, setTemplateName, buttonPayload, setButtonPayload }) {
  const templateOptions = [
    { value: 'welcome_menu', label: 'welcome_menu' },
    { value: 'abandoned_cart', label: 'abandoned_cart' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <PremiumSelector
          label="Select Template"
          value={templateName}
          onChange={setTemplateName}
          options={templateOptions}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            Button Payload / Text
          </label>
          <input
            type="text"
            value={buttonPayload}
            onChange={(e) => setButtonPayload(e.target.value)}
            placeholder="Talk to Agent"
            className="w-full bg-slate-50 text-slate-800 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
          <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">
            Enter the exact button payload or text expected, e.g., 'Talk to Agent'
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. Default Webhook Setup Component
 */
function WebhookSetupBody({ webhookUrl, copied, onCopy }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          Your Webhook Endpoint URL
        </label>
        <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Listening Live
        </span>
      </div>
      
      <div className="relative flex items-center w-full">
        <input
          type="text"
          readOnly
          value={webhookUrl}
          className="w-full bg-slate-50 text-slate-700 dark:bg-slate-950/80 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-12 py-3 text-xs font-mono select-all focus:outline-none transition-all shadow-inner"
        />
        <button
          onClick={onCopy}
          className={`absolute right-2 p-2 rounded-lg transition-all ${
            copied 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Main TriggerSetupDrawer Container Component
 */
export default function TriggerSetupDrawer({ 
  isOpen, 
  onClose, 
  nodeId, 
  currentNodeData = {}, 
  onUpdate 
}) {
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'connections'
  const [responseFormat, setResponseFormat] = useState('simple'); // 'simple' | 'advance' | 'raw'
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [payloadReceived, setPayloadReceived] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract / Map Trigger Type
  const triggerType = useMemo(() => {
    const rawType = currentNodeData?.triggerType;
    if (!rawType) return 'webhook';
    // Align potential aliases (e.g. contact_added_webinar -> webinar_registration)
    if (rawType === 'contact_added_webinar') return 'webinar_registration';
    if (rawType === 'contact_added_wlh_whatsapp') return 'wlh_whatsapp';
    
    const validTypes = [
      'google_sheets', 'meta_leads', 'razorpay', 'webinar_registration', 'wlh_whatsapp', 'webhook',
      'incoming_whatsapp', 'whatsapp_incoming_message',
      'whatsapp_keyword', 'keyword_match', 'whatsapp_keyword_match', 'whatsapp_keyword_trigger',
      'whatsapp_template', 'whatsapp_template_buttons', 'whatsapp_button_clicked', 'whatsapp_template_received'
    ];
    if (!validTypes.includes(rawType)) {
      return 'webhook';
    }
    return rawType;
  }, [currentNodeData?.triggerType]);

  // Auth integrations toggle states (For Google / Facebook leads)
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [isMetaConnected, setIsMetaConnected] = useState(false);

  // Subcomponent Setup fields (local state back-synced on click Save)
  const [spreadsheet, setSpreadsheet] = useState('leads_2026');
  const [worksheet, setWorksheet] = useState('sheet1');
  const [triggerColumn, setTriggerColumn] = useState('Email');
  const [facebookPage, setFacebookPage] = useState('wlh_official');
  const [leadForm, setLeadForm] = useState('diwali_offer');
  const [razorpayEvent, setRazorpayEvent] = useState('payment.captured');
  const [webhookSecret, setWebhookSecret] = useState('secret_wh_key_99120a');
  const [webinarPlatform, setWebinarPlatform] = useState('zoom');
  const [activeWebinar, setActiveWebinar] = useState('saas_mastery');
  const [webinarsList, setWebinarsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [segmentsList, setSegmentsList] = useState([]);
  const [whatsappTagName, setWhatsappTagName] = useState('');
  const [contactSegment, setContactSegment] = useState('vip_customers');

  // Load webinars, tags, and segments list from backend
  useEffect(() => {
    if (!isOpen) return;

    instance.post('/webinar/data', { filters: {} }, { params: { page: 1, limit: 1000 } })
      .then(res => {
        const list = res?.data?.result || res?.data?.webinarPageData || [];
        setWebinarsList(list);
      })
      .catch(err => console.error("Error fetching webinars inside TriggerSetupDrawer:", err));

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
      .catch(err => console.error("Error fetching tags inside TriggerSetupDrawer:", err));

    instance.get('custom-lead-type')
      .then(res => {
        const responseData = res?.data || res;
        let list = [];
        if (Array.isArray(responseData)) {
          list = responseData;
        } else if (Array.isArray(responseData?.data)) {
          list = responseData.data;
        } else if (Array.isArray(responseData?.result)) {
          list = responseData.result;
        } else if (Array.isArray(responseData?.results)) {
          list = responseData.results;
        }
        setSegmentsList(list);
      })
      .catch(err => console.error("Error fetching custom lead types inside TriggerSetupDrawer:", err));
  }, [isOpen]);

  const [triggerCondition, setTriggerCondition] = useState('tag_added');

  // Sync back local states on render if they exist in Redux/currentNodeData
  useEffect(() => {
    if (currentNodeData) {
      setSpreadsheet(currentNodeData.spreadsheet || 'leads_2026');
      setWorksheet(currentNodeData.worksheet || 'sheet1');
      setTriggerColumn(currentNodeData.triggerColumn || 'Email');
      setFacebookPage(currentNodeData.facebookPage || 'wlh_official');
      setLeadForm(currentNodeData.leadForm || 'diwali_offer');
      setRazorpayEvent(currentNodeData.razorpayEvent || 'payment.captured');
      setWebhookSecret(currentNodeData.webhookSecret || 'secret_wh_key_99120a');
      setWebinarPlatform(currentNodeData.webinarPlatform || 'zoom');
      setActiveWebinar(currentNodeData.activeWebinar || 'saas_mastery');
      setContactSegment(currentNodeData.contactSegment || 'vip_customers');
      setTriggerCondition(currentNodeData.triggerCondition || 'tag_added');
      setWhatsappKeyword(currentNodeData.whatsappKeyword || 'START');
      setWhatsappMatchCondition(currentNodeData.whatsappMatchCondition || 'exact');
      setWhatsappTemplateName(currentNodeData.whatsappTemplateName || 'welcome_menu');
      setWhatsappButtonPayload(currentNodeData.whatsappButtonPayload || 'Talk to Agent');
      setWhatsappTagName(currentNodeData.whatsappTagName || '');
      setPayloadReceived(!!currentNodeData.capturedResponse);
    }
  }, [currentNodeData, isOpen]);
  
  // WhatsApp Triggers State
  const [whatsappKeyword, setWhatsappKeyword] = useState('START');
  const [whatsappMatchCondition, setWhatsappMatchCondition] = useState('exact');
  const [whatsappTemplateName, setWhatsappTemplateName] = useState('welcome_menu');
  const [whatsappButtonPayload, setWhatsappButtonPayload] = useState('Talk to Agent');

  // Trigger meta info mapping
  const triggerDetails = useMemo(() => {
    switch (triggerType) {
      case 'google_sheets':
        return {
          title: 'Google Sheets Trigger',
          desc: 'Trigger workflow sequences on new row additions or column updates.',
          icon: <Database className="w-5 h-5 relative z-10" />,
          colorTheme: 'emerald'
        };
      case 'meta_leads':
        return {
          title: 'Meta Leads Ad Integration',
          desc: 'Capture instant lead metadata directly from Facebook Ad forms.',
          icon: (
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          ),
          colorTheme: 'blue'
        };
      case 'razorpay':
        return {
          title: 'Razorpay Payment Callback',
          desc: 'Trigger automated emails/sequences on live checkout events.',
          icon: <CreditCard className="w-5 h-5 relative z-10" />,
          colorTheme: 'blue'
        };
      case 'webinar_registration':
      case 'contact_added_webinar':
        return {
          title: 'New Webinar Registration',
          desc: 'Triggers automatically when a new lead registers for a webinar inside your CRM.',
          icon: <Video className="w-5 h-5 relative z-10" />,
          colorTheme: 'purple'
        };
      case 'wlh_whatsapp':
      case 'contact_added_wlh_whatsapp':
        return {
          title: 'WLH WhatsApp Segment Tracker',
          desc: 'Evaluate leads when tagged or segmented inside your CRM dashboard.',
          icon: <MessageSquare className="w-5 h-5 relative z-10" />,
          colorTheme: 'indigo'
        };
      case 'incoming_whatsapp':
      case 'whatsapp_incoming_message':
        return {
          title: 'Incoming WhatsApp Message',
          desc: 'Trigger on receiving any WhatsApp message.',
          icon: <MessageSquare className="w-5 h-5 relative z-10" />,
          colorTheme: 'emerald'
        };
      case 'whatsapp_keyword':
      case 'keyword_match':
      case 'whatsapp_keyword_match':
      case 'whatsapp_keyword_trigger':
        return {
          title: 'WhatsApp Keyword Match',
          desc: 'Trigger on receiving a specific keyword message.',
          icon: <Key className="w-5 h-5 relative z-10" />,
          colorTheme: 'emerald'
        };
      case 'whatsapp_template':
      case 'whatsapp_template_buttons':
      case 'whatsapp_button_clicked':
      case 'whatsapp_template_received':
        return {
          title: 'WhatsApp Template Button Clicked',
          desc: 'Trigger when user clicks a button in templates.',
          icon: <MessageSquare className="w-5 h-5 relative z-10" />,
          colorTheme: 'emerald'
        };
      case 'webhook':
      default:
        return {
          title: 'Custom Webhook API',
          desc: 'Listen for real-time external JSON payloads at a unique endpoint.',
          icon: <Terminal className="w-5 h-5 relative z-10" />,
          colorTheme: 'blue'
        };
    }
  }, [triggerType]);

  // Generate Webhook URL
  const params = useParams();
  const projectIdStr = params.projectId || 'workspace_xyz';
  const flowIdStr = params.automationId || params.flowId || nodeId || 'flow_abc';
  const webhookUrl = triggerType === 'razorpay'
    ? `https://api.yourdomain.com/v1/webhooks/razorpay/catch/${projectIdStr}/${flowIdStr}`
    : `https://api.yourdomain.com/v1/webhooks/catch/${projectIdStr}/${flowIdStr}`;

  // Handle URL clipboard copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success(triggerType === 'razorpay' ? 'Razorpay Webhook URL copied!' : 'Trigger Webhook URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy Webhook URL.');
    }
  };

  // Simulate Webhook / trigger response capture
  const handleCaptureResponse = () => {
    if (isCapturing) return;
    
    const isMeta = triggerType === 'meta_leads';
    const totalSeconds = isMeta ? 5 : 4;
    
    setIsCapturing(true);
    setCountdown(totalSeconds);
    setPayloadReceived(false);

    // Countdown simulation
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Complete simulation
    setTimeout(() => {
      setIsCapturing(false);
      setPayloadReceived(true);
      setIsAccordionOpen(true);
      
      let responseData = dummyPayloads[responseFormat];
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          // Keep string as fallback if it fails parsing
        }
      }

      if (onUpdate) {
        onUpdate({
          ...currentNodeData,
          triggerType,
          responseFormat,
          spreadsheet,
          worksheet,
          triggerColumn,
          facebookPage,
          leadForm,
          razorpayEvent,
          webhookSecret,
          webinarPlatform,
          activeWebinar,
          contactSegment,
          triggerCondition,
          whatsappKeyword,
          whatsappMatchCondition,
          whatsappTemplateName,
          whatsappButtonPayload,
          whatsappTagName,
          payloadReceived: true,
          capturedResponse: responseData,
          isDynamic: true
        });
      }

      toast.success(isMeta ? 'Mock lead captured successfully!' : 'Test trigger capture successful!', {
        description: isMeta 
          ? 'Facebook Lead Ads generated test data fetched successfully.' 
          : `Successfully fetched and formatted response for trigger type: ${triggerType}`,
      });
    }, totalSeconds * 1000);
  };

  // Switch Case rendering logic for different trigger bodies
  const renderTriggerBody = () => {
    switch (triggerType) {
      case 'google_sheets':
        return (
          <GoogleSheetsSetup 
            isConnected={isGoogleConnected}
            onConnectToggle={() => setIsGoogleConnected(!isGoogleConnected)}
            spreadsheet={spreadsheet}
            setSpreadsheet={setSpreadsheet}
            worksheet={worksheet}
            setWorksheet={setWorksheet}
            triggerColumn={triggerColumn}
            setTriggerColumn={setTriggerColumn}
          />
        );
      case 'meta_leads':
        return (
          <MetaLeadsSetup 
            isConnected={isMetaConnected}
            onConnectToggle={() => setIsMetaConnected(!isMetaConnected)}
            facebookPage={facebookPage}
            setFacebookPage={setFacebookPage}
            leadForm={leadForm}
            setLeadForm={setLeadForm}
          />
        );
      case 'razorpay':
        return (
          <RazorpaySetup 
            webhookUrl={webhookUrl}
            copied={copied}
            onCopy={handleCopy}
            razorpayEvent={razorpayEvent}
            setRazorpayEvent={setRazorpayEvent}
          />
        );
      case 'webinar_registration':
      case 'contact_added_webinar':
        return (
          <WebinarRegistrationSetup 
            activeWebinar={activeWebinar}
            setActiveWebinar={setActiveWebinar}
            webinarsList={webinarsList}
          />
        );
      case 'wlh_whatsapp':
      case 'contact_added_wlh_whatsapp':
        return (
          <WLHWhatsAppSetup 
            contactSegment={contactSegment}
            setContactSegment={setContactSegment}
            triggerCondition={triggerCondition}
            setTriggerCondition={setTriggerCondition}
            whatsappTagName={whatsappTagName}
            setWhatsappTagName={setWhatsappTagName}
            tagsList={tagsList}
            segmentsList={segmentsList}
          />
        );
      case 'incoming_whatsapp':
      case 'whatsapp_incoming_message':
        return (
          <IncomingWhatsAppSetup />
        );
      case 'whatsapp_keyword':
      case 'keyword_match':
      case 'whatsapp_keyword_match':
      case 'whatsapp_keyword_trigger':
        return (
          <WhatsAppKeywordMatchSetup 
            keyword={whatsappKeyword}
            setKeyword={setWhatsappKeyword}
            matchCondition={whatsappMatchCondition}
            setMatchCondition={setWhatsappMatchCondition}
          />
        );
      case 'whatsapp_template':
      case 'whatsapp_template_buttons':
      case 'whatsapp_button_clicked':
      case 'whatsapp_template_received':
        return (
          <WhatsAppTemplateButtonsSetup 
            templateName={whatsappTemplateName}
            setTemplateName={setWhatsappTemplateName}
            buttonPayload={whatsappButtonPayload}
            setButtonPayload={setWhatsappButtonPayload}
          />
        );
      case 'webhook':
      default:
        return (
          <WebhookSetupBody 
            webhookUrl={webhookUrl}
            copied={copied}
            onCopy={handleCopy}
          />
        );
    }
  };

  // Dummy JSON payloads corresponding to different triggers and formats
  const dummyPayloads = useMemo(() => {
    const rawPayloads = {
      webhook: {
        simple: {
          status: "success",
          event: "webinar_registered",
          timestamp: "2026-06-01T16:32:21Z",
          attendee: {
            id: "att_89231",
            name: "Jane Doe",
            email: "jane.doe@example.com",
            phone: "+15550199"
          }
        },
        advance: {
          status: "success",
          event: "webinar_registered",
          webhook_id: `wh_${nodeId || '12345'}`,
          timestamp: "2026-06-01T16:32:21Z",
          client_metadata: {
            ip_address: "192.168.1.55",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            referrer: "https://webinar.yourdomain.com/join-free"
          },
          attendee: {
            id: "att_89231",
            name: "Jane Doe",
            email: "jane.doe@example.com",
            phone: "+15550199",
            company: "Acme Enterprise Corp",
            job_title: "Senior SaaS Engineer"
          }
        },
        raw: `{
  "headers": {
    "content-type": "application/json",
    "x-webhook-signature": "sha256=9e82c818a7c29377488baee319bc3",
    "user-agent": "WebhookTrigger/v2.1"
  },
  "body": {
    "id": "event_01H12B9D9G8",
    "topic": "webinar.registration.create",
    "created_at": 1780331541
  }
}`
      },
      google_sheets: {
        simple: {
          status: "success",
          source: "google_sheets",
          spreadsheet_name: "New Leads 2026",
          worksheet_name: "Sheet1",
          row_index: 242,
          triggered_by_column: "Email",
          data: {
            Name: "John Doe",
            Email: "john.doe@gmail.com",
            Phone: "+919876543210"
          }
        },
        advance: {
          status: "success",
          source: "google_sheets",
          spreadsheet_name: "New Leads 2026",
          worksheet_name: "Sheet1",
          row_index: 242,
          triggered_by_column: "Email",
          client_metadata: {
            sheet_id: "1whc2910faN290a1bc",
            last_synced_row: 241,
            import_type: "cron_job"
          },
          data: {
            Name: "John Doe",
            Email: "john.doe@gmail.com",
            Phone: "+919876543210",
            City: "Mumbai",
            SignupDate: "2026-06-01"
          }
        },
        raw: `{
  "spreadsheetId": "1whc2910faN290a1bc",
  "range": "Sheet1!A242:E242",
  "majorDimension": "ROWS",
  "values": [
    ["John Doe", "john.doe@gmail.com", "+919876543210", "Mumbai", "2026-06-01"]
  ]
}`
      },
      meta_leads: {
        simple: {
          form_id: "123456789012345",
          page_id: "987654321098765",
          leadgen_id: "444555666777",
          created_time: 1717415400,
          field_data: [
            { name: "full_name", values: ["Yash Bansal"] },
            { name: "email", values: ["test@example.com"] },
            { name: "phone_number", values: ["+919876543210"] }
          ]
        },
        advance: {
          form_id: "123456789012345",
          page_id: "987654321098765",
          leadgen_id: "444555666777",
          created_time: 1717415400,
          field_data: [
            { name: "full_name", values: ["Yash Bansal"] },
            { name: "email", values: ["test@example.com"] },
            { name: "phone_number", values: ["+919876543210"] }
          ]
        },
        raw: `{
  "form_id": "123456789012345",
  "page_id": "987654321098765",
  "leadgen_id": "444555666777",
  "created_time": 1717415400,
  "field_data": [
    {
      "name": "full_name",
      "values": [
        "Yash Bansal"
      ]
    },
    {
      "name": "email",
      "values": [
        "test@example.com"
      ]
    },
    {
      "name": "phone_number",
      "values": [
        "+919876543210"
      ]
    }
  ]
}`
      },
      razorpay: {
        simple: {
          entity: "event",
          account_id: "acc_123456789",
          event: "payment.captured",
          payload: {
            payment: {
              entity: {
                id: "pay_XYZ123",
                amount: 49900,
                currency: "INR",
                status: "captured",
                email: "test@example.com",
                contact: "+919876543210"
              }
            }
          }
        },
        advance: {
          entity: "event",
          account_id: "acc_123456789",
          event: "payment.captured",
          payload: {
            payment: {
              entity: {
                id: "pay_XYZ123",
                amount: 49900,
                currency: "INR",
                status: "captured",
                email: "test@example.com",
                contact: "+919876543210"
              }
            }
          }
        },
        raw: `{
  "entity": "event",
  "account_id": "acc_123456789",
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_XYZ123",
        "amount": 49900,
        "currency": "INR",
        "status": "captured",
        "email": "test@example.com",
        "contact": "+919876543210"
      }
    }
  }
}`
      },
      webinar_registration: {
        simple: {
          event: "webinar_registration",
          webinar_name: "SaaS Mastery Masterclass",
          contact: {
            first_name: "Rahul",
            last_name: "Sharma",
            email: "rahul.test@example.com",
            phone: "+919876543210"
          },
          registered_at: 1717415400
        },
        advance: {
          event: "webinar_registration",
          webinar_name: "SaaS Mastery Masterclass",
          contact: {
            first_name: "Rahul",
            last_name: "Sharma",
            email: "rahul.test@example.com",
            phone: "+919876543210"
          },
          registered_at: 1717415400
        },
        raw: `{
  "event": "webinar_registration",
  "webinar_name": "SaaS Mastery Masterclass",
  "contact": {
    "first_name": "Rahul",
    "last_name": "Sharma",
    "email": "rahul.test@example.com",
    "phone": "+919876543210"
  },
  "registered_at": 1717415400
}`
      },
      wlh_whatsapp: {
        simple: {
          status: "success",
          source: "wlh_whatsapp",
          segment: "VIP Customers",
          trigger_condition: "When tag is added",
          contact: {
            first_name: "Vikram",
            phone: "+919111111111"
          }
        },
        advance: {
          status: "success",
          source: "wlh_whatsapp",
          segment: "VIP Customers",
          trigger_condition: "When tag is added",
          contact: {
            id: "c_290123",
            first_name: "Vikram",
            last_name: "Singh",
            phone: "+919111111111",
            tags_added: ["vip_opt_in", "saas_pro_customer"],
            opt_in_status: true,
            last_interaction: "2026-06-01T16:40:00Z"
          }
        },
        raw: `{
  "event": "contact.tag_added",
  "timestamp": 1780331541,
  "data": {
    "contact_id": "c_290123",
    "phone": "+919111111111",
    "new_tag": "saas_pro_customer",
    "updated_by": "automation_rules"
  }
}`
      },
      incoming_whatsapp: {
        simple: {
          type: "text",
          from: "+919876543210",
          message: "Hi, I need help with my order",
          timestamp: 1717415400
        },
        advance: {
          type: "text",
          from: "+919876543210",
          message: "Hi, I need help with my order",
          timestamp: 1717415400
        },
        raw: `{
  "type": "text",
  "from": "+919876543210",
  "message": "Hi, I need help with my order",
  "timestamp": 1717415400
}`
      },
      whatsapp_incoming_message: {
        simple: {
          type: "text",
          from: "+919876543210",
          message: "Hi, I need help with my order",
          timestamp: 1717415400
        },
        advance: {
          type: "text",
          from: "+919876543210",
          message: "Hi, I need help with my order",
          timestamp: 1717415400
        },
        raw: `{
  "type": "text",
  "from": "+919876543210",
  "message": "Hi, I need help with my order",
  "timestamp": 1717415400
}`
      },
      whatsapp_keyword: {
        simple: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        advance: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        raw: `{
  "type": "text",
  "from": "+919876543210",
  "message": "START",
  "matched_keyword": "START"
}`
      },
      keyword_match: {
        simple: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        advance: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        raw: `{
  "type": "text",
  "from": "+919876543210",
  "message": "START",
  "matched_keyword": "START"
}`
      },
      whatsapp_keyword_match: {
        simple: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        advance: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        raw: `{
  "type": "text",
  "from": "+919876543210",
  "message": "START",
  "matched_keyword": "START"
}`
      },
      whatsapp_keyword_trigger: {
        simple: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        advance: {
          type: "text",
          from: "+919876543210",
          message: "START",
          matched_keyword: "START"
        },
        raw: `{
  "type": "text",
  "from": "+919876543210",
  "message": "START",
  "matched_keyword": "START"
}`
      },
      whatsapp_template: {
        simple: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        advance: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        raw: `{
  "type": "interactive",
  "interactive_type": "button_reply",
  "from": "+919876543210",
  "button_reply": {
    "id": "btn_agent",
    "title": "Talk to Agent"
  }
}`
      },
      whatsapp_template_buttons: {
        simple: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        advance: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        raw: `{
  "type": "interactive",
  "interactive_type": "button_reply",
  "from": "+919876543210",
  "button_reply": {
    "id": "btn_agent",
    "title": "Talk to Agent"
  }
}`
      },
      whatsapp_button_clicked: {
        simple: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        advance: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        raw: `{
  "type": "interactive",
  "interactive_type": "button_reply",
  "from": "+919876543210",
  "button_reply": {
    "id": "btn_agent",
    "title": "Talk to Agent"
  }
}`
      },
      whatsapp_template_received: {
        simple: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        advance: {
          type: "interactive",
          interactive_type: "button_reply",
          from: "+919876543210",
          button_reply: {
            id: "btn_agent",
            title: "Talk to Agent"
          }
        },
        raw: `{
  "type": "interactive",
  "interactive_type": "button_reply",
  "from": "+919876543210",
  "button_reply": {
    "id": "btn_agent",
    "title": "Talk to Agent"
  }
}`
      }
    };

    const mappedType = triggerType.startsWith('webinar_') ? 'webinar_registration' :
                       triggerType.startsWith('wlh_') ? 'wlh_whatsapp' :
                       triggerType;
                       
    return rawPayloads[mappedType] || rawPayloads.webhook;
  }, [triggerType, nodeId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Semi-Transparent Backdrop Overlay with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 z-[999] backdrop-blur-sm"
          />

          {/* Right Slide-out Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[45%] min-w-[500px] max-w-[700px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[1000] overflow-hidden flex flex-col transition-colors duration-300"
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-3">
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400`}>
                  <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-xl animate-pulse" />
                  {triggerDetails.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {triggerDetails.title}
                  </h3>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400 font-medium">
                    {triggerDetails.desc}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 active:scale-95"
                title="Close Config Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 border-b border-slate-150 dark:border-slate-800/80 flex bg-white dark:bg-slate-900">
              <button
                onClick={() => setActiveTab('setup')}
                className={`py-3.5 px-2 text-xs font-bold relative transition-colors cursor-pointer ${
                  activeTab === 'setup'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-605 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                Trigger Setup
                {activeTab === 'setup' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"
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
                  Connections are automatically managed
                </span>
              </button>
            </div>

            {/* Main Drawer Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Dynamic trigger event render body */}
              <div className="space-y-4">
                {renderTriggerBody()}
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              {/* Response Capture Area */}
              <div className="space-y-4">
                {triggerType !== 'webinar_registration' && triggerType !== 'contact_added_webinar' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 tracking-wide uppercase">
                        Response Format
                      </label>
                      <span className="text-[9px] text-blue-500 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Dynamic Test
                      </span>
                    </div>
                    
                    {/* Segmented Pill Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 rounded-xl p-1 w-full border border-slate-200/50 dark:border-slate-850">
                      {['simple', 'advance', 'raw'].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setResponseFormat(fmt)}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                            responseFormat === fmt
                              ? 'bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-750/30'
                              : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capture Webhook/Trigger Response Button */}
                <button
                  type="button"
                  onClick={handleCaptureResponse}
                  disabled={isCapturing}
                  className={`w-full py-3.5 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2.5 font-bold text-xs relative overflow-hidden cursor-pointer ${
                    isCapturing
                      ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                      : payloadReceived
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:border-emerald-600'
                      : 'border-slate-300 dark:border-slate-700 text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-855 shadow-sm'
                  }`}
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>
                        {triggerType === 'meta_leads'
                          ? `Waiting for Lead Submission... (${countdown}s)`
                          : triggerType === 'razorpay'
                          ? `Waiting for Razorpay Webhook... (${countdown}s)`
                          : triggerType === 'webinar_registration' || triggerType === 'contact_added_webinar'
                          ? `Waiting for Test Registration... (${countdown}s)`
                          : `Waiting for Webhook Response... (${countdown}s)`}
                      </span>
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all w-full origin-left" 
                        style={{ 
                          animation: triggerType === 'meta_leads' 
                            ? 'progressBar 5s linear forwards' 
                            : 'progressBar 4s linear forwards',
                          animationDuration: triggerType === 'meta_leads' ? '5000ms' : '4000ms'
                        }} 
                      />
                    </>
                  ) : payloadReceived ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>
                        {triggerType === 'meta_leads'
                          ? 'Lead Captured - Recapture Test Lead'
                          : triggerType === 'webinar_registration' || triggerType === 'contact_added_webinar'
                          ? 'Registration Captured - Recapture Test Registration'
                          : 'Response Captured - Recapture Webhook Response'}
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        {triggerType === 'meta_leads'
                          ? 'Capture Test Lead'
                          : triggerType === 'webinar_registration' || triggerType === 'contact_added_webinar'
                          ? 'Capture Test Registration'
                          : 'Capture Webhook Response'}
                      </span>
                    </>
                  )}
                </button>

                {/* Collapsible Accordion: Response Payload */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all bg-white dark:bg-slate-950/20">
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-955/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${payloadReceived ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{payloadReceived ? 'Response Received' : 'No Response Payload'}</span>
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
                        <div className="p-4 bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto">
                          {payloadReceived ? (
                            <pre className="whitespace-pre-wrap">
                              {responseFormat === 'raw' ? (
                                dummyPayloads.raw
                              ) : (
                                <code className="text-emerald-400">
                                  {JSON.stringify(dummyPayloads[responseFormat], null, 2)
                                    .replace(/(".*?"|__.*?__)/g, (m) => `<span class="text-blue-400">${m}</span>`)
                                    .split('\n')
                                    .map((line, idx) => (
                                      <div 
                                        key={idx} 
                                        dangerouslySetInnerHTML={{ 
                                          __html: line
                                            .replace(/: ("[^"]*")/g, ': <span class="text-green-400">$1</span>')
                                            .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
                                            .replace(/: (true|false)/g, ': <span class="text-amber-500">$1</span>')
                                        }} 
                                      />
                                    ))
                                  }
                                </code>
                              )}
                            </pre>
                          ) : (
                            <div className="text-center py-6 text-slate-500 font-medium">
                              Waiting for trigger trigger... Hit the test button above to capture a sample JSON structure.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-250 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const statePayload = {
                    triggerType,
                    responseFormat,
                    // Sheets
                    spreadsheet,
                    worksheet,
                    triggerColumn,
                    // Meta
                    facebookPage,
                    leadForm,
                    // Razorpay
                    razorpayEvent,
                    webhookSecret,
                    // Webinar
                    webinarPlatform,
                    activeWebinar,
                    // WhatsApp
                    contactSegment,
                    triggerCondition,
                    whatsappKeyword,
                    whatsappMatchCondition,
                    whatsappTemplateName,
                    whatsappButtonPayload,
                    whatsappTagName,
                    // Dynamic Webhook Response Payload
                    payloadReceived,
                    capturedResponse: payloadReceived ? dummyPayloads[responseFormat] : currentNodeData.capturedResponse || null
                  };
                  if (onUpdate) {
                    onUpdate(statePayload);
                  }
                  toast.success('Configuration saved successfully!');
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
