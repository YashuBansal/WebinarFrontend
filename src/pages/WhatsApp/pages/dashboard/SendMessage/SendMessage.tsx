import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, AlertCircle, Phone, MessageSquare, Users, History } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project to send messages.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isBulkMode ? (
            <Users className="h-6 w-6 text-primary" />
          ) : (
            <MessageSquare className="h-6 w-6 text-primary" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isBulkMode ? 'Send Bulk Template Messages' : 'Send Template Message'}
          </h1>
          {isBulkMode && (
            <Badge variant="secondary" className="ml-2">
              {selectedContacts.length} contacts selected
            </Badge>
          )}
        </div>
        
        {/* Message History Button */}
        {currentProjectId && (
          <Button
            variant="outline"
            onClick={() => navigate(`/whatsapp/dashboard/${projectId}/message-history/${currentProjectId}`)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Message History
          </Button>
        )}
      </div>

      {/* Selected Contacts Display - Only in bulk mode */}
      {/* {isBulkMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selected Contacts ({selectedContacts.length})
            </CardTitle>
            <CardDescription>
              These contacts will receive the template message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {selectedContacts.map((contact) => (
                <div key={contact._id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {contact.email}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* TemplateSelectionForm with built-in preview */}
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

        {/* Phone Number and Submit Button Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {isBulkMode ? 'Send Bulk Messages' : 'Send Message'}
            </CardTitle>
            <CardDescription>
              {isBulkMode 
                ? `Send WhatsApp template messages to ${selectedContacts.length} selected contacts`
                : 'Send a WhatsApp template message to a recipient'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number - Only show in single mode */}
            {!isBulkMode && (
              <div className="space-y-2">
                <Label htmlFor="recipientPhoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Recipient Phone Number
                </Label>
                <Input
                  id="recipientPhoneNumber"
                  placeholder="+911234567890"
                  {...register('recipientPhoneNumber')}
                />
                {errors.recipientPhoneNumber && (
                  <p className="text-sm text-red-500">{errors.recipientPhoneNumber.message}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  Examples: {phoneNumberExamples.join(', ')}
                </div>
              </div>
            )}

            {errors.templateName && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.templateName.message}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                (isBulkMode ? sendBulkMessageMutation.isPending : sendMessageMutation.isPending) || 
                (showValidationErrors && (
                  isMediaRequiredMissing ||
                  (variableMappings.length > 0 && variableMappings.some(mapping => !isVariableValid(mapping)))
                ))
              }
            >
              {(isBulkMode ? sendBulkMessageMutation.isPending : sendMessageMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isBulkMode ? 'Sending Bulk Messages...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isBulkMode ? `Send to ${selectedContacts.length} Contacts` : 'Send Message'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Success/Error Messages */}
      {!isBulkMode && sendMessageMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to send message: {(sendMessageMutation.error as any) || 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {isBulkMode && sendBulkMessageMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to send bulk messages: { (sendBulkMessageMutation.error as any) || 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Messages */}
      {!isBulkMode && sendMessageMutation.isSuccess && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Message sent successfully!
          </AlertDescription>
        </Alert>
      )}

      {isBulkMode && sendBulkMessageMutation.isSuccess && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bulk messages sent! Check the results for details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SendMessage;