import { useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TemplateSelectionForm from '@/components/common/TemplateSelectionForm';
import type { VariableMapping } from '@/api/modules/autoMessage';

interface ContactFieldOption {
  value: string;
  label: string;
  field: string;
}

interface TemplateSelectionDialogProps {
  // Trigger props
  triggerLabel?: string;
  triggerClassName?: string;

  // Core TemplateSelectionForm state
  selectedTemplate: any | null;
  setSelectedTemplate: Dispatch<SetStateAction<any | null>>;
  variableMappings: VariableMapping[];
  setVariableMappings: Dispatch<SetStateAction<VariableMapping[]>>;

  // Optional media state
  selectedMediaAsset?: any;
  setSelectedMediaAsset?: Dispatch<SetStateAction<any | null>>;
  uploadedFileName?: string;
  setUploadedFileName?: Dispatch<SetStateAction<string>>;

  // Optional callbacks
  onTemplateSelect?: (template: any) => void;
  onVariableMappingsChange?: (mappings: VariableMapping[]) => void;

  // Optional configuration
  projectId?: string;
  contactFieldOptions?: ContactFieldOption[];
  showPreview?: boolean;
  showHeaderMedia?: boolean;
  allowDynamicFields?: boolean;
  showValidationErrors?: boolean;
}

export function TemplateSelectionDialog({
  triggerLabel = 'Select template',
  triggerClassName,
  selectedTemplate,
  setSelectedTemplate,
  variableMappings,
  setVariableMappings,
  selectedMediaAsset,
  setSelectedMediaAsset,
  uploadedFileName,
  setUploadedFileName,
  onTemplateSelect,
  onVariableMappingsChange,
  projectId,
  contactFieldOptions,
  showPreview = true,
  showHeaderMedia = true,
  allowDynamicFields = true,
  showValidationErrors,
}: TemplateSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [internalShowValidationErrors, setInternalShowValidationErrors] =
    useState(false);

  const effectiveShowValidationErrors =
    showValidationErrors ?? internalShowValidationErrors;

  const hasMediaHeader = (template: any): boolean => {
    if (!template) return false;
    const header = template.components?.find((c: any) => c.type === 'HEADER');
    return (
      !!header &&
      ['IMAGE', 'VIDEO', 'DOCUMENT'].includes((header as any).format)
    );
  };

  const isVariableValid = (vm: VariableMapping): boolean => {
    if (vm.isDynamic) {
      return !!(
        vm.contactField?.trim() &&
        vm.fallbackValue?.trim()
      );
    }
    return !!vm.staticValue?.trim();
  };

  const isFormValid = () => {
    const isTemplateMissing = !selectedTemplate;
    const isMediaRequiredMissing =
      showHeaderMedia &&
      selectedTemplate &&
      hasMediaHeader(selectedTemplate) &&
      !selectedMediaAsset;

    const hasInvalidVariable =
      Array.isArray(variableMappings) &&
      variableMappings.some((vm) => !isVariableValid(vm));

    return !isTemplateMissing && !isMediaRequiredMissing && !hasInvalidVariable;
  };

  const handleConfirm = () => {
    const valid = isFormValid();
    if (!valid) {
      setInternalShowValidationErrors(true);
      return;
    }
    if (selectedTemplate) {
      onTemplateSelect?.(selectedTemplate);
    }
    if (variableMappings) {
      onVariableMappingsChange?.(variableMappings);
    }
    setInternalShowValidationErrors(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-screen sm:w-[80vw] max-w-none sm:max-w-none">
          <DialogHeader>
            <DialogTitle>Select WhatsApp template</DialogTitle>
          </DialogHeader>

          <TemplateSelectionForm
            selectedTemplate={selectedTemplate}
            variableMappings={variableMappings}
            selectedMediaAsset={selectedMediaAsset}
            uploadedFileName={uploadedFileName}
            setSelectedTemplate={setSelectedTemplate}
            setVariableMappings={setVariableMappings}
            setSelectedMediaAsset={setSelectedMediaAsset}
            setUploadedFileName={setUploadedFileName}
            onTemplateSelect={onTemplateSelect}
            projectId={projectId}
            contactFieldOptions={contactFieldOptions}
            showPreview={showPreview}
            showHeaderMedia={showHeaderMedia}
            allowDynamicFields={allowDynamicFields}
            showValidationErrors={effectiveShowValidationErrors}
          />

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInternalShowValidationErrors(false);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
            >
              Use this template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

