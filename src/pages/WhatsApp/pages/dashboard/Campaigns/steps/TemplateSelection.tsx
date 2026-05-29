import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useMediaAssets } from '@/hooks/useMediaAssets';
import type { CampaignTemplate, VariableMapping } from '@/schemas/campaignSchema';
import { CotactType } from '@/types';
import TemplateSelectionForm from '@/components/common/TemplateSelectionForm';
import type { VariableMapping as AutoMessageVariableMapping } from '@/api/modules/autoMessage';

// Contact field options for dynamic variables
const CONTACT_FIELD_OPTIONS = [
  { value: '$firstName', label: 'First Name', field: 'firstName' },
  { value: '$lastName', label: 'Last Name', field: 'lastName' },
  { value: '$email', label: 'Email', field: 'email' },
  { value: '$phone', label: 'Phone', field: 'phone' },
];

const WLH_CONTACT_FIELD_OPTIONS = [
  ...CONTACT_FIELD_OPTIONS,
  { value: '$gender', label: 'Gender', field: 'gender' },
  { value: '$location', label: 'Location', field: 'location' },
  { value: '$source', label: 'Source', field: 'source' },
  { value: '$registeredCount', label: 'Registered Webinar Count', field: 'registeredCount' },
  { value: '$attendedCount', label: 'Attended Webinar Count', field: 'attendedCount' },
];

interface TemplateSelectionProps {
  selectedTemplate: CampaignTemplate | null;
  onTemplateSelect: (template: CampaignTemplate | null) => void;
  variableMappings: VariableMapping[];
  onVariableMappingsChange: (mappings: VariableMapping[]) => void;

  selectedSessionTemplate: CampaignTemplate | null;
  onSessionTemplateSelect: (template: CampaignTemplate | null) => void;
  sessionVariableMappings: VariableMapping[];
  onSessionVariableMappingsChange: (mappings: VariableMapping[]) => void;

  headerMediaAssetId: string | null;
  onHeaderMediaAssetIdChange: (assetId: string | null) => void;
  uploadedFileName: string;
  onUploadedFileNameChange: (fileName: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  contactType: string;
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

const TemplateSelection = ({
  selectedTemplate,
  onTemplateSelect,
  variableMappings,
  onVariableMappingsChange,
  selectedSessionTemplate,
  onSessionTemplateSelect,
  sessionVariableMappings,
  onSessionVariableMappingsChange,
  headerMediaAssetId,
  onHeaderMediaAssetIdChange,
  uploadedFileName,
  onUploadedFileNameChange,
  onNext,
  onPrevious,
  contactType,
}: TemplateSelectionProps) => {
  const { selectedProject } = useProjectContext();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Internal state for template selection form (uses object instead of string ID)
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);

  // Fetch media assets for conversion between headerMediaAssetId and selectedMediaAsset
  const { data: mediaAssetsData } = useMediaAssets({
    projectId: selectedProject?._id || '',
    page: 1,
    limit: 50,
  });

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
    onHeaderMediaAssetIdChange(asset?._id || null);
    onUploadedFileNameChange(asset?.fileName || '');
  };

  // Convert variable mappings for TemplateSelectionForm
  const autoMessageMappings: AutoMessageVariableMapping[] = variableMappings.map(toAutoMessageMapping);
  const autoSessionMappings: AutoMessageVariableMapping[] = sessionVariableMappings.map(toAutoMessageMapping);

  // Handle variable mappings change from TemplateSelectionForm
  const handleVariableMappingsChange = (mappings: AutoMessageVariableMapping[]) => {
    const campaignMappings = mappings.map(toCampaignMapping);
    onVariableMappingsChange(campaignMappings);
  };

  const handleSessionVariableMappingsChange = (mappings: AutoMessageVariableMapping[]) => {
    const campaignMappings = mappings.map(toCampaignMapping);
    onSessionVariableMappingsChange(campaignMappings);
  };

  // Handle template select from TemplateSelectionForm
  const handleTemplateSelect = (template: any) => {
    onTemplateSelect(template);
    setShowValidationErrors(false); // Reset validation errors when template changes
  };

  const handleSessionTemplateSelect = (template: any) => {
    onSessionTemplateSelect(template);
    setShowValidationErrors(false);
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

  const handleSetSelectedSessionTemplate = (templateOrUpdater: any) => {
    if (typeof templateOrUpdater === 'function') {
      const currentTemplate = selectedSessionTemplate;
      const newTemplate = templateOrUpdater(currentTemplate);
      handleSessionTemplateSelect(newTemplate);
    } else {
      handleSessionTemplateSelect(templateOrUpdater);
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

  const handleSetSessionVariableMappings = (mappingsOrUpdater: any) => {
    if (typeof mappingsOrUpdater === 'function') {
      const currentMappings = autoSessionMappings;
      const newMappings = mappingsOrUpdater(currentMappings);
      handleSessionVariableMappingsChange(newMappings);
    } else {
      handleSessionVariableMappingsChange(mappingsOrUpdater);
    }
  };

  // Wrapper for setUploadedFileName to work with Dispatch<SetStateAction<string>>
  const handleSetUploadedFileName = (fileNameOrUpdater: any) => {
    if (typeof fileNameOrUpdater === 'function') {
      const currentFileName = uploadedFileName;
      const newFileName = fileNameOrUpdater(currentFileName);
      onUploadedFileNameChange(newFileName);
    } else {
      onUploadedFileNameChange(fileNameOrUpdater);
    }
  };

  // Map contact field options based on contactType
  const contactFieldOptions = contactType === CotactType.WLH ? WLH_CONTACT_FIELD_OPTIONS : CONTACT_FIELD_OPTIONS;

  // Check if selected template has media header
  const hasMediaHeader = () => {
    if (!selectedTemplate) return false;
    const headerComponent = selectedTemplate.components.find((c: any) => c.type === 'HEADER');
    return headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes((headerComponent as any).format);
  };

  // Check if a variable mapping is valid
  const isVariableValid = (mapping: VariableMapping): boolean => {
    if (mapping.isDynamic) {
      return (
        !!(mapping.contactField && mapping.contactField.trim()) &&
        !!(mapping.fallbackValue && mapping.fallbackValue.trim())
      );
    }
    return !!(mapping.staticValue && mapping.staticValue.trim());
  };

  // Validation: can proceed if at least one template (standard or session) is selected, and all variables are valid
  const hasInvalidVariables = variableMappings.length > 0 && variableMappings.some(mapping => !isVariableValid(mapping));
  const hasInvalidSessionVariables = sessionVariableMappings.length > 0 && sessionVariableMappings.some(mapping => !isVariableValid(mapping));

  const hasAtLeastOneTemplate = selectedTemplate !== null || selectedSessionTemplate !== null;

  const canProceed = hasAtLeastOneTemplate && 
    (!hasMediaHeader() || headerMediaAssetId !== null || selectedMediaAsset !== null) &&
    !hasInvalidVariables &&
    !hasInvalidSessionVariables;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30 p-1">
        <TemplateSelectionForm
          selectedTemplate={selectedTemplate}
          variableMappings={autoMessageMappings}
          selectedSessionTemplate={selectedSessionTemplate}
          sessionVariableMappings={autoSessionMappings}
          selectedMediaAsset={selectedMediaAsset}
          uploadedFileName={uploadedFileName}
          setSelectedTemplate={(template) => {
            handleSetSelectedTemplate(template);
            setShowValidationErrors(false); // Reset validation errors when template changes
          }}
          setVariableMappings={handleSetVariableMappings}
          setSelectedSessionTemplate={(template) => {
            handleSetSelectedSessionTemplate(template);
            setShowValidationErrors(false);
          }}
          setSessionVariableMappings={handleSetSessionVariableMappings}
          setSelectedMediaAsset={handleMediaAssetChange}
          setUploadedFileName={handleSetUploadedFileName}
          onTemplateSelect={handleTemplateSelect}
          onVariableMappingsChange={handleVariableMappingsChange}
          onSessionTemplateSelect={handleSessionTemplateSelect}
          onSessionVariableMappingsChange={handleSessionVariableMappingsChange}
          projectId={selectedProject?._id}
          contactFieldOptions={contactFieldOptions}
          showPreview={true}
          showHeaderMedia={true}
          allowDynamicFields={true}
          showValidationErrors={showValidationErrors}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-700/50">
        <Button 
          variant="outline" 
          onClick={onPrevious} 
          className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={() => {
            setShowValidationErrors(true);
            if (canProceed) {
              onNext();
            }
          }} 
          disabled={showValidationErrors && !canProceed}
          className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 group"
        >
          Proceed to Contacts
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default TemplateSelection;
