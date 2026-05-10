import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, AlertCircle, Phone, MessageSquare, Users, History, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSendTemplateMessage, useSendBulkTemplateMessage } from '@/hooks/useTemplates';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import { useProjectContext } from '@/context/ProjectContext';
import { toastUtils } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import type { SendTemplateMessagePayload, SendBulkTemplateMessagePayload } from '@/schemas/templateSchema';
import type { Contact } from '@/schemas/contactSchema';
import type { VariableMapping } from '@/schemas/campaignSchema';
import TemplateSelectionForm from '@/components/common/TemplateSelectionForm';
import type { VariableMapping as AutoMessageVariableMapping } from '@/api/modules/autoMessage';

// Form validation schema - unified for both modes
const sendMessageSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  recipientPhoneNumber: z.string().optional(), // Will be validated conditionally
  bodyVariables: z.array(z.string()).optional(),
});

type SendMessageFormData = z.infer<typeof sendMessageSchema>;

// Contact field options for dynamic variables
const CONTACT_FIELD_OPTIONS = [
  { value: '$firstName', label: 'First Name', field: 'firstName' },
  { value: '$lastName', label: 'Last Name', field: 'lastName' },
  { value: '$email', label: 'Email', field: 'email' },
  { value: '$phone', label: 'Phone', field: 'phone' },
];

interface BulkModeState {
  bulkMode: boolean;
  selectedContacts: Contact[];
  projectId: string;
}

// Convert campaign VariableMapping to template selection VariableMapping
const toAutoMessageMapping = (mapping: VariableMapping): AutoMessageVariableMapping => ({
  variable: mapping.variable,
  isDynamic: mapping.isDynamic || false,
  contactField: mapping.contactField,
  staticValue: mapping.staticValue,
  fallbackValue: mapping.fallbackValue,
});

// Convert template selection VariableMapping to campaign VariableMapping
const toCampaignMapping = (mapping: AutoMessageVariableMapping): VariableMapping => ({
  variable: mapping.variable,
  contactField: mapping.contactField || '',
  isDynamic: mapping.isDynamic,
  staticValue: mapping.staticValue,
  fallbackValue: mapping.fallbackValue,
});

const SendMessage = () => {
  const { selectedProject } = useProjectContext();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Media upload state
  const [headerMediaAssetId, setHeaderMediaAssetId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);
  
  // Check if we're in bulk mode from navigation state
  const bulkModeState = location.state as BulkModeState | null;
  const isBulkMode = bulkModeState?.bulkMode || false;
  const selectedContacts = bulkModeState?.selectedContacts || [];


  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<SendMessageFormData>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      templateName: '',
      recipientPhoneNumber: '',
      bodyVariables: [],
    },
  });

  // Template selection is handled by TemplateSelectionForm, form validation uses data.templateName in onSubmit

  // Determine current project ID
  const currentProjectId = isBulkMode ? bulkModeState?.projectId : selectedProject?._id;

  // Fetch media assets for conversion between headerMediaAssetId and selectedMediaAsset
  const { data: mediaAssetsData } = useMediaAssets({
    projectId: currentProjectId || '',
    page: 1,
    limit: 50,
  });

  // Send template message mutations
  const sendMessageMutation = useSendTemplateMessage();
  const sendBulkMessageMutation = useSendBulkTemplateMessage();

  // Sync headerMediaAssetId → selectedMediaAsset
  useEffect(() => {
    if (headerMediaAssetId && mediaAssetsData?.data) {
      const asset = mediaAssetsData.data.find((file: any) => file._id === headerMediaAssetId);
      if (asset) {
        setSelectedMediaAsset(asset);
      }
    } else if (!headerMediaAssetId) {
      setSelectedMediaAsset(null);
    }
  }, [headerMediaAssetId, mediaAssetsData]);

  // Sync selectedMediaAsset → headerMediaAssetId
  const handleMediaAssetChange = (asset: any) => {
    setSelectedMediaAsset(asset);
    setHeaderMediaAssetId(asset?._id || null);
    setUploadedFileName(asset?.fileName || '');
  };

  // Convert variable mappings for TemplateSelectionForm
  const autoMessageMappings: AutoMessageVariableMapping[] = variableMappings.map(toAutoMessageMapping);

  // Handle variable mappings change from TemplateSelectionForm
  const handleVariableMappingsChange = (mappings: AutoMessageVariableMapping[]) => {
    const campaignMappings = mappings.map(toCampaignMapping);
    setVariableMappings(campaignMappings);
  };

  // Handle template select from TemplateSelectionForm
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setValue('templateName', template?.name || ''); // Sync with form
    setShowValidationErrors(false); // Reset validation errors when template changes
  };

  // Wrapper for setSelectedTemplate to work with Dispatch<SetStateAction<any>>
  const handleSetSelectedTemplate = (templateOrUpdater: any) => {
    if (typeof templateOrUpdater === 'function') {
      const currentTemplate = selectedTemplate;
      const newTemplate = templateOrUpdater(currentTemplate);
      handleTemplateSelect(newTemplate);
    } else {
      handleTemplateSelect(templateOrUpdater);
    }
  };

  // Wrapper for setVariableMappings to work with Dispatch<SetStateAction<VariableMapping[]>>
  const handleSetVariableMappings = (mappingsOrUpdater: any) => {
    if (typeof mappingsOrUpdater === 'function') {
      const currentMappings = autoMessageMappings;
      const newMappings = mappingsOrUpdater(currentMappings);
      handleVariableMappingsChange(newMappings);
    } else {
      handleVariableMappingsChange(mappingsOrUpdater);
    }
  };

  // Wrapper for setUploadedFileName to work with Dispatch<SetStateAction<string>>
  const handleSetUploadedFileName = (fileNameOrUpdater: any) => {
    if (typeof fileNameOrUpdater === 'function') {
      const currentFileName = uploadedFileName;
      const newFileName = fileNameOrUpdater(currentFileName);
      setUploadedFileName(newFileName);
    } else {
      setUploadedFileName(fileNameOrUpdater);
    }
  };

  // Check if a variable mapping is valid (has required value filled)
  const isVariableValid = (mapping: VariableMapping): boolean => {
    if (isBulkMode) {
      if (mapping.isDynamic) {
        return !!(mapping.contactField && mapping.contactField.trim() !== '') &&
          !!(mapping.fallbackValue && mapping.fallbackValue.trim() !== '');
      } else {
        return !!(mapping.staticValue && mapping.staticValue.trim() !== '');
      }
    } else {
      return !!(mapping.staticValue && mapping.staticValue.trim() !== '');
    }
  };

  // Check if selected template has media header
  const hasMediaHeader = () => {
    if (!selectedTemplate) return false;
    const headerComponent = selectedTemplate.components.find((c: any) => c.type === 'HEADER');
    return headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format);
  };

  const isMediaRequiredMissing = hasMediaHeader() && !headerMediaAssetId && !selectedMediaAsset;


  // Handle form submission
  const onSubmit = async (data: SendMessageFormData) => {
    setShowValidationErrors(true);
    console.log('Form submitted with data:', data);
    console.log('Is bulk mode:', isBulkMode);
    console.log('Selected contacts:', selectedContacts);
    
    if (!currentProjectId) {
      console.error('No project ID found');
      toastUtils.error('No project selected');
      return;
    }

    // Validate template selection
    if (!selectedTemplate || !data.templateName) {
      toastUtils.error('Please select a template');
      return;
    }

    // Validate media header if required
    if (isMediaRequiredMissing) {
      const format = selectedTemplate.components?.find((c: any) => c.type === 'HEADER')?.format?.toLowerCase() || 'media';
      toastUtils.error(`Please select a ${format} file for the template header`);
      return;
    }

    // Validate template variables are filled
    if (variableMappings.length > 0) {
      const missingVariables: string[] = [];
      
      if (isBulkMode) {
        // For bulk mode: check each variable has either contactField (if dynamic) or staticValue (if static)
        variableMappings.forEach((mapping) => {
          if (mapping.isDynamic) {
            if (!mapping.contactField || mapping.contactField.trim() === '') {
              missingVariables.push(mapping.variable);
            }
            if (!mapping.fallbackValue || mapping.fallbackValue.trim() === '') {
              missingVariables.push(`${mapping.variable} (fallback)`);
            }
          } else {
            if (!mapping.staticValue || mapping.staticValue.trim() === '') {
              missingVariables.push(mapping.variable);
            }
          }
        });
      } else {
        // For single mode: check each variable has staticValue
        variableMappings.forEach((mapping) => {
          if (!mapping.staticValue || mapping.staticValue.trim() === '') {
            missingVariables.push(mapping.variable);
          }
        });
      }
      
      if (missingVariables.length > 0) {
        toastUtils.error(
          `Please fill all template variables. Missing: ${missingVariables.join(', ')}`
        );
        return;
      }
    }

    if (isBulkMode) {
      // Bulk send mode
      if (!selectedContacts || selectedContacts.length === 0) {
        console.error('No contacts selected for bulk send');
        toastUtils.error('No contacts selected for bulk send');
        return;
      }

      // Filter out empty variable mappings (where both staticValue and contactField are empty)
      const filteredVariableMappings = variableMappings.filter((mapping) => {
        if (mapping.isDynamic) {
          // For dynamic variables, include if contactField is set
          return mapping.contactField && mapping.contactField.trim() !== '';
        } else {
          // For static variables, include if staticValue is set
          return mapping.staticValue && mapping.staticValue.trim() !== '';
        }
      });

      const payload: SendBulkTemplateMessagePayload = {
        projectId: currentProjectId,
        contacts: selectedContacts.map(contact => ({
          contactId: contact._id,
          phoneNumber: contact.phone
        })),
        templateName: data.templateName,
        language: selectedTemplate?.language || 'en_US', // Use template's language
        variableMappings: filteredVariableMappings.length > 0 ? filteredVariableMappings : undefined,
        headerMediaAssetId: headerMediaAssetId || selectedMediaAsset?._id || undefined,
      };

      console.log('Bulk payload:', payload);

      try {
        await sendBulkMessageMutation.mutateAsync(payload);
        reset();
        setVariableMappings([]);
        setSelectedTemplate(null);
        setHeaderMediaAssetId(null);
        setUploadedFileName('');
        setSelectedMediaAsset(null);
        setShowValidationErrors(false);
      } catch (error) {
        console.error('Failed to send bulk messages:', error);
        // Error handling is done in the mutation hook
      }
    } else {
      // Single send mode
      if (!data.recipientPhoneNumber || !data.recipientPhoneNumber.trim()) {
        console.error('No recipient phone number provided');
        toastUtils.error('Phone number is required for single send mode');
        return;
      }

      // Validate phone number format for single mode
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(data.recipientPhoneNumber)) {
        console.error('Invalid phone number format');
        toastUtils.error('Please enter a valid phone number (e.g., +1234567890)');
        return;
      }

      // Convert variableMappings to bodyVariables for single send
      // Single send uses bodyVariables array (static values only, in order)
      // Extract staticValue from each mapping in order to preserve variable positions
      const bodyVariablesArray = variableMappings.map((mapping) => 
        mapping.staticValue || ''
      );

      const payload: SendTemplateMessagePayload = {
        projectId: currentProjectId,
        recipientPhoneNumber: data.recipientPhoneNumber,
        templateName: data.templateName,
        language: selectedTemplate?.language || 'en_US', // Use template's language
        bodyVariables: bodyVariablesArray.length > 0 ? bodyVariablesArray : undefined,
        headerMediaAssetId: headerMediaAssetId || selectedMediaAsset?._id || undefined,
      };

      console.log('Single payload:', payload);

      try {
        await sendMessageMutation.mutateAsync(payload);
        reset();
        setVariableMappings([]);
        setSelectedTemplate(null);
        setHeaderMediaAssetId(null);
        setUploadedFileName('');
        setSelectedMediaAsset(null);
        setShowValidationErrors(false);
      } catch (error) {
        console.error('Failed to send message:', error);
        // Error handling is done in the mutation hook
      }
    }
  };


  // Format phone number examples
  const phoneNumberExamples = [
    '+1234567890',
    '+919876543210',
    '+447123456789',
    '+33123456789',
  ];

  if (!selectedProject && !isBulkMode) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 bg-white dark:bg-slate-800/50 shadow-sm">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Please select a project to send messages.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-1">
              {isBulkMode ? <Users className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
              {isBulkMode ? 'Bulk Campaign' : 'Direct Message'}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {isBulkMode ? 'Send Bulk Messages' : 'Send Template Message'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              {isBulkMode 
                ? `Sending to ${selectedContacts.length} selected contacts`
                : 'Send a personalized WhatsApp template message to a single recipient'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentProjectId && (
              <Button
                variant="outline"
                onClick={() => navigate(`/whatsapp/dashboard/${projectId}/message-history/${currentProjectId}`)}
                className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <History className="h-4 w-4" />
                View History
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence>
            {(sendMessageMutation.isError || sendBulkMessageMutation.isError) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-500/10 border-red-200 rounded-2xl mb-6">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 font-bold">Failed to Send</AlertTitle>
                  <AlertDescription className="text-red-700 font-medium">
                    {((sendMessageMutation.error || sendBulkMessageMutation.error) as any) || 'An unexpected error occurred.'}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            {(sendMessageMutation.isSuccess || sendBulkMessageMutation.isSuccess) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert className="bg-green-50 dark:bg-green-500/10 border-green-200 rounded-2xl mb-6">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 font-bold">Sent Successfully</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400 font-medium">
                    {isBulkMode ? 'Bulk messages have been queued for sending.' : 'Your message has been sent successfully.'}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 items-start">
            {/* Template Selection Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/30 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-1 transition-all duration-300"
            >
              <TemplateSelectionForm
                selectedTemplate={selectedTemplate}
                variableMappings={autoMessageMappings}
                selectedMediaAsset={selectedMediaAsset}
                uploadedFileName={uploadedFileName}
                setSelectedTemplate={handleSetSelectedTemplate}
                setVariableMappings={handleSetVariableMappings}
                setSelectedMediaAsset={handleMediaAssetChange}
                setUploadedFileName={handleSetUploadedFileName}
                onTemplateSelect={handleTemplateSelect}
                onVariableMappingsChange={handleVariableMappingsChange}
                projectId={currentProjectId}
                contactFieldOptions={CONTACT_FIELD_OPTIONS}
                showPreview={true}
                showHeaderMedia={true}
                allowDynamicFields={isBulkMode}
                showValidationErrors={showValidationErrors}
              />
            </motion.div>

            {/* Recipient and Action Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[20px] p-6 sm:p-8"
            >
              <div className="flex flex-col md:flex-row gap-8 items-end">
                {/* Phone Number - Only show in single mode */}
                {!isBulkMode ? (
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-7 w-7 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <Label htmlFor="recipientPhoneNumber" className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Recipient Phone Number
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="recipientPhoneNumber"
                        placeholder="+91 12345 67890"
                        {...register('recipientPhoneNumber')}
                        className="h-12 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl px-4 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                      {errors.recipientPhoneNumber && (
                        <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                          {errors.recipientPhoneNumber.message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Examples:</span>
                      {phoneNumberExamples.slice(0, 2).map((ex, i) => (
                        <span key={i} className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded-md">{ex}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bulk Mode Active</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedContacts.length} contacts will receive this message</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="w-full md:w-auto">
                  <Button
                    type="submit"
                    disabled={
                      (isBulkMode ? sendBulkMessageMutation.isPending : sendMessageMutation.isPending) || 
                      (showValidationErrors && (
                        isMediaRequiredMissing ||
                        (variableMappings.length > 0 && variableMappings.some(mapping => !isVariableValid(mapping)))
                      ))
                    }
                    className="h-12 px-10 rounded-xl w-full md:w-auto flex items-center justify-center gap-3 text-white font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                    style={{ backgroundColor: "#22B573", boxShadow: "0 10px 20px -5px rgba(34, 181, 115, 0.3)" }}
                  >
                    {(isBulkMode ? sendBulkMessageMutation.isPending : sendMessageMutation.isPending) ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isBulkMode ? 'Sending Batch...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        {isBulkMode ? `Send to ${selectedContacts.length} Contacts` : 'Send Message'}
                        <ArrowRight className="h-4 w-4 opacity-50" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {errors.templateName && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-tight">
                  <AlertCircle className="h-4 w-4" />
                  {errors.templateName.message}
                </div>
              )}
            </motion.div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SendMessage;