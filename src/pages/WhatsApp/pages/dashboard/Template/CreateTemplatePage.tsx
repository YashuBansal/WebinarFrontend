import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  Plus,
  Phone,
  Link,
  Copy,
  Image,
  Video,
  FileText,
  Loader2,
  ArrowLeft,
  LayoutGrid,
  MessageSquare,
  AlertCircle,
  X,
  Type,
  Paperclip,
  CheckCircle,
  Info,
  Eye
} from 'lucide-react';
import { useCreateTemplate } from '@/hooks/useTemplates';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { templateFormSchema, type TemplateFormData, type TemplateCategory } from '@/schemas/templateSchema';
import { useProjectContext } from '@/context/ProjectContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { toastUtils } from '@/lib/utils';
import { FileUploader } from '@/components/ui/FileUploader';
import { Badge } from '@/components/ui/badge';
import type { AxiosError } from 'axios';

interface InteractiveAction {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP';
  title: string;
  value?: string;
  otp_type?: 'ZERO_TAP' | 'COPY_CODE';
}

interface ParsedTemplateError {
  source: 'app' | 'meta' | 'unknown';
  message: string;
  code?: string | number;
  details?: any;
}

export default function CreateTemplatePage() {
  const { selectedProject } = useProjectContext();
  const createTemplateMutation = useCreateTemplate();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      category: 'UTILITY',
      language: 'en_US',
      name: '',
      headerFormat: undefined,
      format: '',
      header: '',
      headerHandle: '',
      footer: '',
      interactiveType: 'none',
      interactiveActions: [],
    },
  });

  const watchedFormat = watch('format');
  const watchedHeaderFormat = watch('headerFormat');
  const watchedInteractiveActions = watch('interactiveActions') || [];
  const [characterCount, setCharacterCount] = useState(0);
  const [sampleValues, setSampleValues] = useState<string[]>([]);

  // Media upload state
  const [headerHandle, setHeaderHandle] = useState<string | null>(null);
  const [useGenericSample, setUseGenericSample] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [appErrorMessage, setAppErrorMessage] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<ParsedTemplateError | null>(null);

  const categories: TemplateCategory[] = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
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
  const headerFormats = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];

  // Update character count when format changes
  React.useEffect(() => {
    setCharacterCount(watchedFormat?.length || 0);
  }, [watchedFormat]);

  // Extract variables from template format and update sample values
  React.useEffect(() => {
    if (watchedFormat) {
      const variables = extractVariablesFromText(watchedFormat);
      setSampleValues(new Array(variables.length).fill(''));
    } else {
      setSampleValues([]);
    }
  }, [watchedFormat]);

  // Function to extract variable placeholders from template text
  const extractVariablesFromText = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  // Function to replace variables with sample values for preview
  const replaceVariablesWithSamples = (text: string, samples: string[]): string => {
    let result = text;
    samples.forEach((sample, index) => {
      const placeholder = `{{${index + 1}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), sample || placeholder);
    });
    return result;
  };

  const parseTemplateError = (error: unknown): ParsedTemplateError => {
    const axiosError = error as AxiosError<any>;
    const data: any = axiosError?.response?.data;
    console.log('Parsed template error:', data);

    const source: ParsedTemplateError['source'] =
      data?.source === 'meta'
        ? 'meta'
        : data?.source === 'app'
          ? 'app'
          : 'unknown';

    const message =
      data?.message ||
      data?.error?.message ||
      axiosError?.message ||
      'Something went wrong while creating the template.';

    const code =
      data?.code ??
      data?.error?.code ??
      data?.error?.error_subcode ??
      axiosError?.response?.status;

    const details = data?.details ?? data?.error ?? data;

    return { source, message, code, details };
  };

  const addInteractiveAction = (type: InteractiveAction['type']) => {
    const newAction: InteractiveAction = {
      id: Date.now().toString(),
      type,
      title: '',
      value: '',
      ...(type === 'OTP' && { otp_type: 'COPY_CODE' })
    };
    const currentActions = watchedInteractiveActions;
    setValue('interactiveActions', [...currentActions, newAction]);
  };

  const updateInteractiveAction = (id: string, field: keyof InteractiveAction, value: string) => {
    const currentActions = watchedInteractiveActions;
    const updatedActions = currentActions.map(action =>
      action.id === id ? { ...action, [field]: value } : action
    );
    setValue('interactiveActions', updatedActions);
  };

  const removeInteractiveAction = (id: string) => {
    const currentActions = watchedInteractiveActions;
    const filteredActions = currentActions.filter(action => action.id !== id);
    setValue('interactiveActions', filteredActions);
  };

  const handleSampleValueChange = (index: number, value: string) => {
    const newSampleValues = [...sampleValues];
    newSampleValues[index] = value;
    setSampleValues(newSampleValues);
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!selectedProject?._id) {
      toastUtils.error('Please select a project first');
      return;
    }

    // Clear previous error banners
    setAppErrorMessage(null);
    setMetaError(null);

    // Validate sample values for variables
    const variables = extractVariablesFromText(data.format);
    if (variables.length > 0) {
      const missingSampleValues = sampleValues.some((value, index) =>
        index < variables.length && (!value || value.trim() === '')
      );

      if (missingSampleValues) {
        toastUtils.error('Please provide sample values for all template variables ({{1}}, {{2}}, etc.)');
        return;
      }
    }

    // Validate header format requirements only if header format is selected and content is provided
    if (data.headerFormat === 'TEXT' && data.header && data.header.trim() !== '') {
      // Header text is provided, validate it
      if (data.header.length > 60) {
        toastUtils.error('Header text must not exceed 60 characters');
        return;
      }
    }

    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(data.headerFormat || '')) {
      const currentHeaderHandle = useGenericSample ? getGenericSampleHandle() : headerHandle;
      if (currentHeaderHandle) {
        // Media sample is provided, validate it
        // Additional validation can be added here if needed
      }
    }

    try {
      // Transform form data to API format
      const components: any[] = [];

      // Add header component only if header format is selected AND has content
      if (data.headerFormat) {
        let shouldAddHeader = false;
        const headerComponent: any = {
          type: 'HEADER',
          format: data.headerFormat,
        };

        if (data.headerFormat === 'TEXT' && data.header && data.header.trim() !== '') {
          headerComponent.text = data.header;
          shouldAddHeader = true;
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(data.headerFormat)) {
          const currentHeaderHandle = useGenericSample ? getGenericSampleHandle() : headerHandle;
          if (currentHeaderHandle) {
            headerComponent.example = {
              header_handle: [currentHeaderHandle]
            };
            shouldAddHeader = true;
          }
        } else if (data.headerFormat === 'LOCATION') {
          // LOCATION format doesn't need additional properties but can be added
          shouldAddHeader = true;
        }

        if (shouldAddHeader) {
          components.push(headerComponent);
        }
      }

      // Add body component
      components.push({
        type: 'BODY',
        text: data.format,
        ...(sampleValues.length > 0 && {
          example: {
            body_text: [sampleValues]
          }
        })
      });

      // Add footer if provided
      if (data.footer && data.footer.trim() !== '') {
        components.push({
          type: 'FOOTER',
          text: data.footer,
        });
      }

      // Add buttons if interactive actions exist and have titles
      if (data.interactiveActions && data.interactiveActions.length > 0) {
        const validActions = data.interactiveActions.filter(action => action.title && action.title.trim() !== '');

        if (validActions.length > 0) {
          const buttons = validActions.map(action => {
            const button: any = {
              type: action.type,
              text: action.title,
            };

            if (action.type === 'URL' && action.value) {
              button.url = action.value;
            } else if (action.type === 'PHONE_NUMBER' && action.value) {
              button.phone_number = action.value;
            } else if (action.type === 'OTP' && action.otp_type) {
              button.otp_type = action.otp_type;
            }

            return button;
          });

          components.push({
            type: 'BUTTONS',
            buttons,
          });
        }
      }

      const createTemplatePayload = {
        name: data.name,
        category: data.category,
        language: data.language,
        components,
      };

      console.log('Submitting template:', createTemplatePayload);

      await createTemplateMutation.mutateAsync({
        projectId: selectedProject._id,
        payload: createTemplatePayload,
        navigate: navigate,
      });
    } catch (error) {
      console.error('Failed to create template from page submit:', error);
      const parsed = parseTemplateError(error);

      if (parsed.source === 'meta') {
        setMetaError(parsed);
        setAppErrorMessage(null);
      } else {
        setAppErrorMessage(parsed.message);
        setMetaError(null);
      }
    }
  };

  const getActionCount = (type: InteractiveAction['type']) => {
    return watchedInteractiveActions.filter(action => action.type === type).length;
  };

  const getActionIcon = (type: InteractiveAction['type']) => {
    switch (type) {
      case 'QUICK_REPLY': return <Plus className="w-4 h-4 bg-white dark:bg-slate-900/60 shadow-sm" />;
      case 'URL': return <Link className="w-4 h-4" />;
      case 'PHONE_NUMBER': return <Phone className="w-4 h-4" />;
      case 'OTP': return <Copy className="w-4 h-4" />;
    }
  };

  // Media upload handlers
  const handleFileSelect = () => {
    setUploadError('');
  };

  const handleUploadSuccess = (result: any) => {
    setHeaderHandle(result.data.headerHandle);
    toastUtils.success('Sample file uploaded successfully!');
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    toastUtils.error(error);
  };

  const getFileAcceptTypes = () => {
    switch (watchedHeaderFormat) {
      case 'IMAGE':
        return 'image/jpeg,image/png,image/jpg';
      case 'VIDEO':
        return 'video/mp4,video/3gpp';
      case 'DOCUMENT':
        return 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return '*';
    }
  };

  const getMaxFileSize = () => {
    switch (watchedHeaderFormat) {
      case 'IMAGE':
        return 2; // 2MB
      case 'VIDEO':
      case 'DOCUMENT':
        return 16; // 16MB
      default:
        return 16;
    }
  };

  // Generic sample handles (you can replace these with actual handles from your Meta account)
  const getGenericSampleHandle = () => {
    switch (watchedHeaderFormat) {
      case 'IMAGE':
        return 'generic_image_handle'; // Replace with actual handle
      case 'VIDEO':
        return 'generic_video_handle'; // Replace with actual handle
      case 'DOCUMENT':
        return 'generic_document_handle'; // Replace with actual handle
      default:
        return null;
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
                to={`/whatsapp/dashboard/${selectedProject?._id}/templates`}
                className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </RouterLink>
              <div>
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
                  <Plus className="h-3 w-3" />
                  New Template
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
                  Create Template
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                  Design and submit a new message template for <span className="text-slate-900 dark:text-white font-bold">{selectedProject?.projectName}</span>
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
              form="template-form"
              type="submit"
              disabled={isSubmitting || createTemplateMutation.isPending}
              className="h-11 px-8 rounded-xl flex items-center gap-2 text-white font-bold text-sm shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: "#22B573" }}
            >
              {isSubmitting || createTemplateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit Template
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto pb-12">
        <form id="template-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Template Category */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</span>
                </div>
                <div className="relative">
                  <select
                    {...register('category')}
                    className="w-full h-11 px-4 py-2 border border-slate-200 dark:border-slate-700/30 rounded-xl bg-slate-50/50 dark:bg-slate-900/60 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.category && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">{errors.category.message}</p>
                )}
              </motion.div>

              {/* Template Language */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                    <Type className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Language</span>
                </div>
                <div className="relative">
                  <select
                    {...register('language')}
                    className="w-full h-11 px-4 py-2 border border-slate-200 dark:border-slate-700/30 rounded-xl bg-slate-50/50 dark:bg-slate-900/60 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                  >
                    <option value="">Select language</option>
                    {languages.map(language => (
                      <option key={language.value} value={language.value}>{language.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.language && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">{errors.language.message}</p>
                )}
              </motion.div>
            </div>

            {/* Template Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">Use lowercase, numbers, and underscores only</p>
                </div>
              </div>
              <Input
                type="text"
                placeholder="e.g. order_confirmation_v1"
                {...register('name')}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
              />
              {errors.name && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">{errors.name.message}</p>
              )}
            </motion.div>

            {/* Template Header/Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                  <Paperclip className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Header Type</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['NONE', ...headerFormats].map((format) => {
                  const isSelected = (watch('headerFormat') || 'NONE') === format;
                  const Icon = format === 'IMAGE' ? Image : format === 'VIDEO' ? Video : format === 'DOCUMENT' ? FileText : format === 'TEXT' ? Type : X;
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setValue('headerFormat', format === 'NONE' ? undefined : format as any)}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all
                        ${isSelected
                          ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 shadow-sm'
                          : 'border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 text-slate-400 hover:border-slate-200 hover:bg-slate-100/50'}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{format}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>



            {/* Template Format (Body) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Body</span>
                </div>
                <div className="text-[10px] font-black text-slate-400 tabular-nums">
                  {characterCount} / 1024
                </div>
              </div>
              <textarea
                placeholder="Enter your message in here..."
                {...register('format')}
                className="w-full min-h-[160px] px-4 py-3 border border-slate-200 dark:border-slate-700/30 rounded-xl bg-slate-50/50 dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm resize-none"
                maxLength={1024}
              />
              {errors.format && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">{errors.format.message}</p>
              )}
              <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                  Use <span className="font-bold">*bold*</span>, <span className="font-bold">_italic_</span>, and <span className="font-bold">{`{{1}}`}</span> for variables.
                </p>
              </div>
            </motion.div>

            {/* Template Header Text (Condition-based) */}
            {watchedHeaderFormat === 'TEXT' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                    <Type className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Header Content</span>
                </div>
                <Input
                  type="text"
                  placeholder="Enter header text here"
                  {...register('header')}
                  maxLength={60}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                />
                {errors.header && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">{errors.header.message}</p>
                )}
              </motion.div>
            )}

            {/* Media Upload Section */}
            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(watchedHeaderFormat || '') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media Assets</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all">
                    <Checkbox
                      checked={useGenericSample}
                      onCheckedChange={(checked) => {
                        setUseGenericSample(checked as boolean);
                        if (checked) {
                          setHeaderHandle(null);
                          setUploadError('');
                        }
                      }}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Use generic sample handle</span>
                  </label>

                  {!useGenericSample && (
                    <div className="p-4 border-2 border-dashed border-slate-100 dark:border-slate-700/30 rounded-2xl bg-slate-50/30 dark:bg-slate-900/20">
                      <FileUploader
                        onFileSelect={handleFileSelect}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        accept={getFileAcceptTypes()}
                        maxSize={getMaxFileSize()}
                        uploadEndpoint={
                          selectedProject
                            ? `/whatsapp/templates/${selectedProject._id}/upload-sample-media`
                            : ''
                        }
                        uploadFieldName="file"
                      />
                    </div>
                  )}

                  {(headerHandle || useGenericSample) && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Sample file is ready
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Sample Values for Variables */}
            {sampleValues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variable Samples</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {sampleValues.map((value, index) => (
                    <div key={index} className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Sample for {`{{${index + 1}}}`}
                      </label>
                      <Input
                        placeholder={`e.g. ${index === 0 ? 'John' : '24 hours'}`}
                        value={value}
                        onChange={(e) => handleSampleValueChange(index, e.target.value)}
                        required
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Template Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                  <Info className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Footer Text (Optional)</span>
              </div>
              <Input
                type="text"
                placeholder="Enter footer text (e.g. reply STOP to unsubscribe)"
                {...register('footer')}
                maxLength={60}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
              />
              {errors.footer && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">{errors.footer.message}</p>
              )}
            </motion.div>

            {/* Interactive Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interactive Actions</span>
              </div>

              <div className="space-y-6">
                {/* Radio Selection Pill */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700/30 rounded-2xl w-full">
                  {['none', 'call_to_actions', 'quick_replies', 'all'].map((option) => {
                    const isActive = watch('interactiveType') === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setValue('interactiveType', option as any)}
                        className={`
                          flex-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                          ${isActive ? 'bg-white dark:bg-slate-800/80 text-green-600 dark:text-green-400 shadow-sm border border-slate-200 dark:border-slate-700/30' : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        {option.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>

                {/* Add Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'QUICK_REPLY', label: 'Reply', icon: Plus },
                    { id: 'URL', label: 'Link', icon: Link },
                    { id: 'PHONE_NUMBER', label: 'Call', icon: Phone },
                    { id: 'OTP', label: 'OTP', icon: Copy },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => addInteractiveAction(btn.id as any)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/60 text-slate-400 hover:border-slate-200 hover:bg-slate-100/50 hover:text-slate-600 transition-all"
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
                  {watchedInteractiveActions.map((action) => (
                    <div key={action.id} className="relative group/action bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 rounded-2xl p-4 transition-all hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400">
                            {getActionIcon(action.type)}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {action.type.replace('_', ' ')}
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
                          placeholder="Button Label (e.g. Visit Website)"
                          value={action.title}
                          onChange={(e) => updateInteractiveAction(action.id, 'title', e.target.value)}
                          maxLength={25}
                          className="h-10 rounded-xl border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                        />
                        {(action.type === 'URL' || action.type === 'PHONE_NUMBER') && (
                          <Input
                            placeholder={action.type === 'URL' ? 'https://example.com' : '+1 234 567 8900'}
                            value={action.value || ''}
                            onChange={(e) => updateInteractiveAction(action.id, 'value', e.target.value)}
                            className="h-10 rounded-xl border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-800/50 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                          />
                        )}
                        {action.type === 'OTP' && (
                          <div className="relative">
                            <select
                              value={action.otp_type || 'COPY_CODE'}
                              onChange={(e) => updateInteractiveAction(action.id, 'otp_type', e.target.value)}
                              className="w-full h-10 px-3 py-1 border border-slate-200 dark:border-slate-700/30 rounded-xl bg-white dark:bg-slate-800/50 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                            >
                              <option value="COPY_CODE">Copy Code</option>
                              <option value="ZERO_TAP">Zero Tap</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Error Messages (Final check) */}
            <AnimatePresence>
              {(appErrorMessage || metaError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {appErrorMessage && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-red-900 mb-1">Application Error</p>
                        <p className="text-xs font-medium text-red-700 leading-relaxed">{appErrorMessage}</p>
                      </div>
                    </div>
                  )}
                  {metaError && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-widest text-yellow-900 mb-1">Meta Rejection</p>
                        <p className="text-xs font-medium text-yellow-800 leading-relaxed">{metaError.message}</p>
                        {metaError.details?.error?.error_user_msg && (
                          <div className="mt-2 p-3 bg-white/50 rounded-xl border border-yellow-200">
                            <p className="text-[10px] font-bold text-yellow-900">{metaError.details.error.error_user_title || 'Feedback:'}</p>
                            <p className="text-[10px] text-yellow-800 mt-1">{metaError.details.error.error_user_msg}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-5 sticky top-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Preview</span>
              </div>

              {/* WhatsApp Mockup */}
              <div className="relative mx-auto max-w-[320px] bg-[#E5DDD5] rounded-[32px] border-8 border-slate-900 p-4 min-h-[480px] shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-12 bg-[#075E54] flex items-center px-4 gap-3 z-10">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    <Phone className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-[10px] font-bold">WhatsApp Business</p>
                    <p className="text-white/60 text-[8px]">Online</p>
                  </div>
                </div>

                <div className="mt-14 space-y-3 relative z-10">
                  <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-left-2">
                    {/* Header Preview */}
                    {watchedHeaderFormat && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        {watchedHeaderFormat === 'TEXT' && watch('header') && (
                          <p className="text-[11px] font-bold text-slate-900 mb-1 leading-tight">
                            {watch('header')}
                          </p>
                        )}
                        {watchedHeaderFormat === 'IMAGE' && (
                          <div className="aspect-video bg-slate-100 flex flex-col items-center justify-center gap-1 border border-slate-200 rounded-lg">
                            <Image className="h-6 w-6 text-slate-300" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Image Header</span>
                          </div>
                        )}
                        {watchedHeaderFormat === 'VIDEO' && (
                          <div className="aspect-video bg-slate-100 flex flex-col items-center justify-center gap-1 border border-slate-200 rounded-lg">
                            <Video className="h-6 w-6 text-slate-300" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Video Header</span>
                          </div>
                        )}
                        {watchedHeaderFormat === 'DOCUMENT' && (
                          <div className="p-3 bg-slate-50 flex items-center gap-3 border border-slate-200 rounded-lg">
                            <FileText className="h-6 w-6 text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Document</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Body Preview */}
                    <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {watchedFormat
                        ? (sampleValues.length > 0 ? replaceVariablesWithSamples(watchedFormat, sampleValues) : watchedFormat)
                        : "Your message content will appear here..."
                      }
                    </p>

                    {/* Footer Preview */}
                    {watch('footer') && (
                      <p className="text-[9px] text-slate-400 mt-1.5 border-t border-slate-50 pt-1.5">
                        {watch('footer')}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons Preview */}
                  {watchedInteractiveActions.length > 0 && (
                    <div className="flex flex-col gap-1.5 px-2">
                      {watchedInteractiveActions.map((action) => (
                        <div
                          key={action.id}
                          className="w-full bg-white/90 backdrop-blur-sm border border-slate-100 py-2 rounded-xl text-[10px] font-bold text-blue-600 text-center shadow-sm"
                        >
                          {action.title || `${action.type.replace('_', ' ')} button`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WhatsApp Background Pattern (Simulated) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>

              <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-50/50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl">
                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-800 font-medium leading-relaxed">
                  <strong>Preview Notice:</strong> This mockup is a graphical approximation. The final message appearance depends on the user&apos;s device and WhatsApp version.
                </p>
              </div>
            </motion.div>
          </div>
        </form>
      </main>
    </div>
  );
}
