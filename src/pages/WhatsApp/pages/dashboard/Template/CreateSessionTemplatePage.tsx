import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useQuickReplies } from '../../../hooks/useQuickReplies';
import {
  Zap,
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Info,
  LayoutGrid,
  MessageSquare,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Type,
  X,
  Link as LinkIcon,
  Phone,
  Paperclip,
  CheckCircle,
  Copy,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { WhatsAppTemplatePreviewCard } from '../../../components/ui/whatsapp-template-preview-card';
import { FileUploader } from '../../../components/ui/FileUploader';
import { toastUtils } from '@/lib/utils';
import { Checkbox } from '../../../components/ui/checkbox';

interface InteractiveAction {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  title: string;
  value?: string;
}

type InteractiveType = 'none' | 'call_to_actions' | 'quick_replies' | 'all';

export default function CreateSessionTemplatePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Basic Info
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('en_US');

  // Header
  const [headerFormat, setHeaderFormat] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerHandle, setHeaderHandle] = useState<string | null>(null);
  const [useGenericSample, setUseGenericSample] = useState(false);

  // Footer
  const [footerText, setFooterText] = useState('');

  // Buttons
  const [interactiveType, setInteractiveType] = useState<InteractiveType>('none');
  const [interactiveActions, setInteractiveActions] = useState<InteractiveAction[]>([]);
  const { createQuickReply, isCreating } = useQuickReplies(projectId || '');

  const languages = [
    { value: 'en_US', label: 'English (US)' },
    { value: 'en_GB', label: 'English (UK)' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'hi', label: 'Hindi' },
  ];

  const addInteractiveAction = (type: InteractiveAction['type']) => {
    // WhatsApp session message limits: max 3 quick replies OR 2 call to actions
    if (type === 'QUICK_REPLY') {
      const qrCount = interactiveActions.filter(a => a.type === 'QUICK_REPLY').length;
      if (qrCount >= 3) {
        toastUtils.error('Maximum 3 Quick Reply buttons allowed');
        return;
      }
    } else {
      const ctaCount = interactiveActions.filter(a => a.type !== 'QUICK_REPLY').length;
      if (ctaCount >= 2) {
        toastUtils.error('Maximum 2 Call to Action buttons allowed');
        return;
      }
    }

    const newAction: InteractiveAction = {
      id: Date.now().toString(),
      type,
      title: '',
      value: ''
    };
    setInteractiveActions([...interactiveActions, newAction]);

    // Auto switch type if it was none
    if (interactiveType === 'none') {
      setInteractiveType(type === 'QUICK_REPLY' ? 'quick_replies' : 'call_to_actions');
    }
  };

  const updateInteractiveAction = (id: string, field: keyof InteractiveAction, value: string) => {
    setInteractiveActions(interactiveActions.map(action =>
      action.id === id ? { ...action, [field]: value } : action
    ));
  };

  const removeInteractiveAction = (id: string) => {
    setInteractiveActions(interactiveActions.filter(action => action.id !== id));
  };

  const getActionCount = (type: InteractiveAction['type']) => {
    return interactiveActions.filter(a => a.type === type).length;
  };

  const getActionIcon = (type: InteractiveAction['type']) => {
    switch (type) {
      case 'QUICK_REPLY': return <Plus className="w-4 h-4" />;
      case 'URL': return <LinkIcon className="w-4 h-4" />;
      case 'PHONE_NUMBER': return <Phone className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim() || !projectId) return;

    // Construct components array
    const components: any[] = [];

    if (headerFormat !== 'NONE') {
      const header: any = { type: 'HEADER', format: headerFormat };
      if (headerFormat === 'TEXT') header.text = headerText;
      else if (headerHandle) header.header_handle = headerHandle;
      components.push(header);
    }

    components.push({ type: 'BODY', text: content });

    if (footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText });
    }

    if (interactiveType !== 'none' && interactiveActions.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: interactiveActions.map(a => ({
          type: a.type,
          text: a.title,
          url: a.type === 'URL' ? a.value : undefined,
          phone_number: a.type === 'PHONE_NUMBER' ? a.value : undefined
        }))
      });
    }

    try {
      await createQuickReply({
        projectId,
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        content: content.trim(),
        language,
        components
      } as any);
      navigate(`/whatsapp/dashboard/${projectId}/templates`);
    } catch (error: any) {
      console.error('Failed to create session template:', error);
      const msg = typeof error === 'string' ? error : (error?.response?.data?.message || error?.message || 'Failed to create session template');
      toastUtils.error(msg);
    }
  };

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-900/60 shadow-sm dark:border-slate-700/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <RouterLink
                to={`/whatsapp/dashboard/${projectId}/templates`}
                className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </RouterLink>
              <div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
                  <Zap className="h-3 w-3" />
                  Advanced Session Template
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
                  Design Advanced Quick Reply
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                  Design rich messages with media and buttons. <span className="text-amber-600 dark:text-amber-400 font-bold">Instantly Active.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 px-6 rounded-xl border-slate-200 dark:border-slate-700/30 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="session-template-form"
              disabled={isCreating || !name.trim() || !content.trim()}
              className="h-11 px-8 rounded-xl flex items-center gap-2 text-white font-bold text-sm shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 bg-amber-500 hover:bg-amber-600 border-none"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto pb-12">
        <form id="session-template-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid gap-6">
              {/* Template Name - Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[20px] p-6 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</span>
                    <p className="text-[9px] text-slate-400 mt-0.5">Unique identifier for this session template</p>
                  </div>
                </div>
                <Input
                  placeholder="e.g. support_response_v1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-base"
                />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Template Language */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[20px] p-6 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                      <Type className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Language</span>
                  </div>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-11 px-4 py-2 border border-slate-200 dark:border-slate-700/30 rounded-xl bg-slate-50/50 dark:bg-slate-900/60 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm outline-none appearance-none"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Header Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[20px] p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                  <Paperclip className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Header Type</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'NONE', icon: X, label: 'NONE' },
                  { id: 'TEXT', icon: Type, label: 'TEXT' },
                  { id: 'IMAGE', icon: ImageIcon, label: 'IMAGE' },
                  { id: 'VIDEO', icon: Video, label: 'VIDEO' },
                  { id: 'DOCUMENT', icon: FileText, label: 'DOC' },
                ].map((format) => {
                  const isSelected = headerFormat === format.id;
                  return (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => setHeaderFormat(format.id as any)}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all
                        ${isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm'
                          : 'border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 text-slate-400 hover:border-slate-200 hover:bg-slate-100/50'}
                      `}
                    >
                      <format.icon className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{format.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {headerFormat === 'TEXT' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800"
                  >
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Header Text</Label>
                    <Input
                      placeholder="Enter header text here"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      maxLength={60}
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm"
                    />
                  </motion.div>
                )}

                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
                  >
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Media Assets</Label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all">
                      <Checkbox
                        checked={useGenericSample}
                        onCheckedChange={(checked) => setUseGenericSample(checked as boolean)}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Use generic sample handle</span>
                    </label>

                    {!useGenericSample && (
                      <div className="p-4 border-2 border-dashed border-slate-100 dark:border-slate-700/30 rounded-2xl bg-slate-50/30 dark:bg-slate-900/20">
                        <FileUploader
                          onFileSelect={() => { }}
                          onUploadSuccess={(res: any) => {
                            setHeaderHandle(res.data.headerHandle);
                            toastUtils.success('Sample file uploaded!');
                          }}
                          onUploadError={(err: string) => toastUtils.error(err)}
                          accept={headerFormat === 'IMAGE' ? 'image/*' : headerFormat === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx'}
                          maxSize={headerFormat === 'IMAGE' ? 2 : 16}
                          uploadEndpoint={`/whatsapp/templates/${projectId}/upload-sample-media`}
                          uploadFieldName="file"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Template Body */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[20px] p-6 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const markers = content.match(/\{\{\d+\}\}/g) || [];
                      const nextIndex = markers.length + 1;
                      setContent(content + `{{${nextIndex}}}`);
                    }}
                    className="h-7 px-3 text-[10px] font-bold border-slate-200 dark:border-slate-700/30 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-lg transition-all"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    ADD VARIABLE
                  </Button>
                  <div className="text-[10px] font-black text-slate-400 tabular-nums">
                    {content.length} / 4096
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Type your session message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[200px] px-4 py-3 border border-slate-200 dark:border-slate-700/30 rounded-xl bg-slate-50/50 dark:bg-slate-900/60 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm resize-none leading-relaxed"
                maxLength={4096}
              />
              <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                  Use <span className="font-bold">*bold*</span>, <span className="font-bold">_italic_</span>, and <span className="font-bold">{"{{1}}"}</span> for variables.
                </p>
              </div>
            </motion.div>

            {/* Template Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[20px] p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                  <Info className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Footer Text (Optional)</span>
              </div>
              <Input
                placeholder="Enter footer text..."
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                maxLength={60}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm"
              />
            </motion.div>

            {/* Interactive Actions - MATCHED UI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[20px] p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interactive Actions</span>
              </div>

              <div className="space-y-6">
                {/* Radio Selection Pill */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700/30 rounded-2xl w-full">
                  {['none', 'call_to_actions', 'quick_replies'].map((option) => {
                    const isActive = interactiveType === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setInteractiveType(option as any);
                          if (option === 'none') setInteractiveActions([]);
                        }}
                        className={`
                          flex-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                          ${isActive ? 'bg-white dark:bg-slate-800/80 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700/30' : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        {option.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>

                {/* Add Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'QUICK_REPLY', label: 'Reply', icon: Plus },
                    { id: 'URL', label: 'Link', icon: LinkIcon },
                    { id: 'PHONE_NUMBER', label: 'Call', icon: Phone },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => addInteractiveAction(btn.id as any)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 text-slate-400 hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-600 transition-all"
                    >
                      <btn.icon className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase tracking-tight">{btn.label}</span>
                      <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[8px] font-black">
                        {getActionCount(btn.id as any)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Actions List */}
                <div className="space-y-4">
                  {interactiveActions.map((action) => (
                    <div key={action.id} className="relative group/action bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 rounded-2xl p-4 transition-all hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400">
                            {getActionIcon(action.type)}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {action.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInteractiveAction(action.id)}
                          className="h-7 w-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <Input
                          placeholder="Button Label (e.g. Chat with Us)"
                          value={action.title}
                          onChange={(e) => updateInteractiveAction(action.id, 'title', e.target.value)}
                          maxLength={25}
                          className="h-10 rounded-xl border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-900/60 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm"
                        />
                        {(action.type === 'URL' || action.type === 'PHONE_NUMBER') && (
                          <Input
                            placeholder={action.type === 'URL' ? 'https://example.com' : '+91 98765 43210'}
                            value={action.value || ''}
                            onChange={(e) => updateInteractiveAction(action.id, 'value', e.target.value)}
                            className="h-10 rounded-xl border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-800/50 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Limitation Warning */}
              <AnimatePresence>
                {((headerFormat === 'TEXT' && headerText.trim()) || footerText.trim()) && interactiveActions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">WhatsApp Limitation</h4>
                        <p className="text-xs text-amber-600 dark:text-amber-300/80 font-medium leading-relaxed">
                          WhatsApp requires at least one button to display a <span className="font-bold">Text Header</span> or <span className="font-bold">Footer</span>.
                          A default <span className="font-bold underline">"OK"</span> button will be added automatically to preserve the card layout.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-5 sticky top-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-amber-500/10 rounded-[32px] p-8 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Appearance</span>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mt-0.5">Real-time Preview</h2>
                </div>
              </div>

              {/* Constructing Mock Template for Session Preview */}
              {(() => {
                const mockTemplate = {
                  name: name || 'session_template',
                  language: 'en_US',
                  components: [
                    ...(headerFormat !== 'NONE' ? [{
                      type: 'HEADER' as const,
                      format: headerFormat,
                      text: headerFormat === 'TEXT' ? headerText : undefined
                    }] : []),
                    {
                      type: 'BODY' as const,
                      text: content || 'Your session message will appear here...'
                    },
                    ...(footerText ? [{
                      type: 'FOOTER' as const,
                      text: footerText
                    }] : []),
                    ...(interactiveType !== 'none' && interactiveActions.length > 0 ? [{
                      type: 'BUTTONS' as const,
                      buttons: interactiveActions.map(a => ({
                        type: a.type,
                        text: a.title || `${a.type.replace(/_/g, ' ')} Button`,
                        url: a.value,
                        phone_number: a.value
                      }))
                    }] : ((((headerFormat === 'TEXT' && headerText) || footerText) && interactiveActions.length === 0) ? [{
                      type: 'BUTTONS' as const,
                      buttons: [{ type: 'QUICK_REPLY', text: 'OK' }]
                    }] : []))
                  ]
                };

                return (
                  <WhatsAppTemplatePreviewCard
                    template={mockTemplate as any}
                    variableMappings={[]}
                    showSampleContact={true}
                    showVariableMappings={false}
                    className="w-full"
                  />
                );
              })()}

              <div className="mt-8 flex items-start gap-4 p-5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[24px]">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  <strong>Premium Session:</strong> These messages support full interactive features. They are stored locally and sent as direct API messages.
                </p>
              </div>
            </motion.div>
          </div>
        </form>
      </main>
    </div>
  );
}
