import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { CheckCircle, Clock } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import type { VariableMapping } from '@/schemas/configuredTemplateSchema';
// import { resolveConfiguredBodyPreview } from '@/utils/configuredTemplatePreview';
import { WhatsAppTemplatePreviewCard } from './whatsapp-template-preview-card';

type ConfiguredTemplateLike = {
  configuredTemplateName: string;
  templateName: string;
  variableMappings: VariableMapping[];
  headerMediaAssetId?: string | null;
  isActive?: boolean;
};

interface ConfiguredTemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  configuredTemplate: ConfiguredTemplateLike | null;
}

const CONTACT_FIELD_LABELS: Record<string, string> = {
  '$firstName': 'First Name',
  '$lastName': 'Last Name',
  '$email': 'Email',
  '$phone': 'Phone',
  '$gender': 'Gender',
  '$location': 'Location',
  '$source': 'Source',
  '$registeredCount': 'Registered Webinar Count',
  '$attendedCount': 'Attended Webinar Count',
};

export function ConfiguredTemplatePreviewDialog({
  isOpen,
  onClose,
  projectId,
  configuredTemplate,
}: ConfiguredTemplatePreviewDialogProps) {
  const { data: templatesResponse } = useTemplates(projectId || '');
  const templates = templatesResponse?.data || [];

  const baseTemplate = useMemo(() => {
    if (!configuredTemplate) return null;
    return templates.find((t: any) => t.name === configuredTemplate.templateName) || null;
  }, [templates, configuredTemplate]);

  // const headerComponent = baseTemplate?.components?.find((c: any) => c.type === 'HEADER');
  // const bodyComponent = baseTemplate?.components?.find((c: any) => c.type === 'BODY');
  // Legacy fields kept for reference; preview is now handled by WhatsAppTemplatePreviewCard

  const getStatusIcon = (active?: boolean) => {
    if (active) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  // const getHeaderMediaIndicator = () => {
  //   if (!headerComponent) return null;
  //   const format = (headerComponent as any).format;
  //   if (!format) return null;
  //   if (format === 'IMAGE') return <ImageIcon className="w-4 h-4 text-gray-600" />;
  //   if (format === 'VIDEO') return <Video className="w-4 h-4 text-gray-600" />;
  //   if (format === 'DOCUMENT') return <FileText className="w-4 h-4 text-gray-600" />;
  //   return null;
  // };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(configuredTemplate?.isActive)}
            <div className="flex-1">
              <DialogTitle className="text-left">{configuredTemplate?.configuredTemplateName || 'Configured Template'}</DialogTitle>
              <DialogDescription className="text-left">
                Based on: {configuredTemplate?.templateName}
              </DialogDescription>
            </div>
            <Badge className={configuredTemplate?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {configuredTemplate?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Configured Template Preview</h3>
              {baseTemplate ? (
                <WhatsAppTemplatePreviewCard
                  template={baseTemplate as any}
                  variableMappings={(configuredTemplate?.variableMappings || []).map((vm) => ({
                    variable: vm.variable,
                    contactField: (vm as any).dynamicField ?? '$firstName',
                    isDynamic: vm.isDynamic,
                    staticValue: vm.staticValue ?? '',
                    fallbackValue: vm.fallbackValue ?? '',
                  }))}
                  showSampleContact={false}
                  showVariableMappings={false}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">Base template not found</div>
              )}
            </CardContent>
          </Card>

          {/* Variable Mappings Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Variable Mappings</h3>
              <div className="space-y-2 text-sm">
                {(configuredTemplate?.variableMappings || []).map((m, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{m.variable}</Badge>
                    {m.isDynamic ? (
                      <span className="text-gray-700">
                        Dynamic → {CONTACT_FIELD_LABELS[m.dynamicField || ''] || m.dynamicField}
                        {m.fallbackValue ? (
                          <span className="text-gray-500"> (fallback: "{m.fallbackValue}")</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-gray-700">Static → {m.staticValue || '—'}</span>
                    )}
                  </div>
                ))}
                {(!configuredTemplate?.variableMappings || configuredTemplate.variableMappings.length === 0) && (
                  <div className="text-gray-600">No variables defined</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfiguredTemplatePreviewDialog;


