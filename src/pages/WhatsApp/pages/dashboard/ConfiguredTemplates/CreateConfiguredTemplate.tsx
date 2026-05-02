import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useCreateConfiguredTemplate } from '@/hooks/useConfiguredTemplates';
import { toastUtils } from '@/lib/utils';
import type { VariableMapping as ConfiguredTemplateVariableMapping } from '@/schemas/configuredTemplateSchema';
import type { VariableMapping } from '@/api/modules/autoMessage';
import { useNavigate, useParams } from 'react-router-dom';
import TemplateSelectionForm from '@/components/common/TemplateSelectionForm';

// Contact field options for dynamic variables (using WLH_CONTACT_FIELD_OPTIONS as requested)
const WLH_CONTACT_FIELD_OPTIONS = [
  { value: '$firstName', label: 'First Name', field: 'firstName' },
  { value: '$lastName', label: 'Last Name', field: 'lastName' },
  { value: '$email', label: 'Email', field: 'email' },
  { value: '$phone', label: 'Phone', field: 'phone' },
  { value: '$gender', label: 'Gender', field: 'gender' },
  { value: '$location', label: 'Location', field: 'location' },
  { value: '$source', label: 'Source', field: 'source' },
  { value: '$registeredCount', label: 'Registered Webinar Count', field: 'registeredCount' },
  { value: '$attendedCount', label: 'Attended Webinar Count', field: 'attendedCount' },
];

// Conversion utility to map from component format (contactField) to API format (dynamicField)
function toApiFormat(mappings: VariableMapping[]): ConfiguredTemplateVariableMapping[] {
  return mappings.map(m => ({
    variable: m.variable,
    isDynamic: m.isDynamic,
    dynamicField: m.contactField,
    staticValue: m.staticValue,
    fallbackValue: m.fallbackValue,
  }));
}

export default function CreateConfiguredTemplate() {
  const { selectedProject } = useProjectContext();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Form state
  const [configuredTemplateName, setConfiguredTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [uploadedFileName, setUploadedFileName] = useState('');
  
  // Media selection state
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);

  // Create configured template mutation
  const createConfiguredTemplateMutation = useCreateConfiguredTemplate();

  // Helper function to check if template has media header (for validation)
  const hasMediaHeader = (template: any): boolean => {
    if (!template) return false;
    const headerComponent = template.components?.find((c: any) => c.type === 'HEADER');
    return headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes((headerComponent as any).format);
  };

  // Check if a variable mapping is valid
  const isVariableValid = (vm: VariableMapping): boolean => {
    if (vm.isDynamic) {
      return (
        !!(vm.contactField && vm.contactField.trim()) &&
        !!(vm.fallbackValue && vm.fallbackValue.trim())
      );
    }
    return !!(vm.staticValue && vm.staticValue.trim());
  };

  // Handle form submission
  const handleSubmit = async () => {
    setShowValidationErrors(true);
    
    if (!selectedTemplate) {
      toastUtils.error('Please select a template');
      return;
    }

    if (!configuredTemplateName.trim()) {
      toastUtils.error('Please enter a configured template name');
      return;
    }

    if (hasMediaHeader(selectedTemplate) && !selectedMediaAsset) {
      const format = selectedTemplate.components?.find((c: any) => c.type === 'HEADER')?.format?.toLowerCase() || 'media';
      toastUtils.error(`Please select a ${format} file for the template header`);
      return;
    }

    // Validate variable mappings
    if (variableMappings.length > 0) {
      const invalidVariables = variableMappings.filter(vm => !isVariableValid(vm));
      if (invalidVariables.length > 0) {
        const missingVars = invalidVariables.map(vm => vm.variable).join(', ');
        toastUtils.error(`Please fill all template variables. Missing: ${missingVars}`);
        return;
      }
    }

    try {
      // Convert variableMappings from component format (contactField) to API format (dynamicField)
      const apiMappings = toApiFormat(variableMappings);
      
      await createConfiguredTemplateMutation.mutateAsync({
        projectId: projectId!,
        payload: {
          templateName: selectedTemplate.name,
          configuredTemplateName: configuredTemplateName.trim(),
          variableMappings: apiMappings,
          headerMediaAssetId: selectedMediaAsset?._id || undefined,
          isActive: true,
        },
        navigate: (path: string) => navigate(path),
      });
      setShowValidationErrors(false);
    } catch (error) {
      console.error('Failed to create configured template:', error);
    }
  };

  // Check if form is valid (only used for button disabled state after validation attempt)
  const hasInvalidVariables = variableMappings.length > 0 && variableMappings.some(vm => !isVariableValid(vm));
  
  const canProceed = selectedTemplate !== null && 
    configuredTemplateName.trim() !== '' && 
    (!hasMediaHeader(selectedTemplate) || selectedMediaAsset !== null) &&
    !hasInvalidVariables;

  return (
    <div className="space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Configured Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Select a template and configure variable mappings for automated messaging
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/whatsapp/dashboard/${projectId}/configured-templates`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      {/* Configured Template Name */}
      <div className="space-y-2">
        <Label htmlFor="configured-template-name">Configured Template Name</Label>
        <Input
          id="configured-template-name"
          placeholder="Enter a name for this configured template..."
          value={configuredTemplateName}
          onChange={(e) => setConfiguredTemplateName(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          This name will help you identify this configured template in your list
        </p>
      </div>

      <TemplateSelectionForm
        selectedTemplate={selectedTemplate}
        variableMappings={variableMappings}
        selectedMediaAsset={selectedMediaAsset}
        uploadedFileName={uploadedFileName}
        setSelectedTemplate={(template) => {
          setSelectedTemplate(template);
          setShowValidationErrors(false); // Reset validation errors when template changes
        }}
        setVariableMappings={setVariableMappings}
        setSelectedMediaAsset={setSelectedMediaAsset}
        setUploadedFileName={setUploadedFileName}
        onTemplateSelect={() => {
          setShowValidationErrors(false); // Reset validation errors when template changes
        }}
        projectId={selectedProject?._id}
        contactFieldOptions={WLH_CONTACT_FIELD_OPTIONS}
        showPreview={true}
        showHeaderMedia={true}
        showValidationErrors={showValidationErrors}
      />

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/whatsapp/dashboard/${projectId}/configured-templates`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          disabled={
            createConfiguredTemplateMutation.isPending ||
            (showValidationErrors && !canProceed)
          }
          className="flex items-center gap-2"
        >
          {createConfiguredTemplateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Configured Template
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
