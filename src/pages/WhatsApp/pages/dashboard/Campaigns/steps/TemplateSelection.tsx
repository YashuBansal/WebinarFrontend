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
  onTemplateSelect: (template: CampaignTemplate) => void;
  variableMappings: VariableMapping[];
  onVariableMappingsChange: (mappings: VariableMapping[]) => void;
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

  // Handle variable mappings change from TemplateSelectionForm
  const handleVariableMappingsChange = (mappings: AutoMessageVariableMapping[]) => {
    const campaignMappings = mappings.map(toCampaignMapping);
    onVariableMappingsChange(campaignMappings);
  };

  // Handle template select from TemplateSelectionForm
  const handleTemplateSelect = (template: any) => {
    onTemplateSelect(template);
    setShowValidationErrors(false); // Reset validation errors when template changes
  };

  // Wrapper for setSelectedTemplate to work with Dispatch<SetStateAction<any>>
  const handleSetSelectedTemplate = (templateOrUpdater: any) => {
    if (typeof templateOrUpdater === 'function') {
      // It's an updater function
      const currentTemplate = selectedTemplate;
      const newTemplate = templateOrUpdater(currentTemplate);
      handleTemplateSelect(newTemplate);
    } else {
      // It's a direct value
      handleTemplateSelect(templateOrUpdater);
    }
  };

  // Wrapper for setVariableMappings to work with Dispatch<SetStateAction<VariableMapping[]>>
  const handleSetVariableMappings = (mappingsOrUpdater: any) => {
    if (typeof mappingsOrUpdater === 'function') {
      // It's an updater function
      const currentMappings = autoMessageMappings;
      const newMappings = mappingsOrUpdater(currentMappings);
      handleVariableMappingsChange(newMappings);
    } else {
      // It's a direct value
      handleVariableMappingsChange(mappingsOrUpdater);
    }
  };

  // Wrapper for setUploadedFileName to work with Dispatch<SetStateAction<string>>
  const handleSetUploadedFileName = (fileNameOrUpdater: any) => {
    if (typeof fileNameOrUpdater === 'function') {
      // It's an updater function
      const currentFileName = uploadedFileName;
      const newFileName = fileNameOrUpdater(currentFileName);
      onUploadedFileNameChange(newFileName);
    } else {
      // It's a direct value
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

  // Validation: can proceed if template is selected, media is selected (if required), and all variables are valid
  const hasInvalidVariables = variableMappings.length > 0 && variableMappings.some(mapping => !isVariableValid(mapping));
  
  const canProceed = selectedTemplate !== null && 
    (!hasMediaHeader() || headerMediaAssetId !== null || selectedMediaAsset !== null) &&
    !hasInvalidVariables;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-slate-50/30 p-1">
        <TemplateSelectionForm
          selectedTemplate={selectedTemplate}
          variableMappings={autoMessageMappings}
          selectedMediaAsset={selectedMediaAsset}
          uploadedFileName={uploadedFileName}
          setSelectedTemplate={(template) => {
            handleSetSelectedTemplate(template);
            setShowValidationErrors(false); // Reset validation errors when template changes
          }}
          setVariableMappings={handleSetVariableMappings}
          setSelectedMediaAsset={handleMediaAssetChange}
          setUploadedFileName={handleSetUploadedFileName}
          onTemplateSelect={handleTemplateSelect}
          onVariableMappingsChange={handleVariableMappingsChange}
          projectId={selectedProject?._id}
          contactFieldOptions={contactFieldOptions}
          showPreview={true}
          showHeaderMedia={true}
          allowDynamicFields={true}
          showValidationErrors={showValidationErrors}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-8 border-t border-slate-100">
        <Button 
          variant="outline" 
          onClick={onPrevious} 
          className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold text-sm transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]"
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
