import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from './dialog';
import { Badge } from './badge';
import { Button } from './button';
import {
  MessageSquare,
  Settings,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import type { VariableMapping } from '@/schemas/configuredTemplateSchema';
import { WhatsAppTemplatePreviewCard } from './whatsapp-template-preview-card';
import { useTheme } from '../../../../contexts/ThemeContext';

const FONT = "Inter, sans-serif";

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

export function ConfiguredTemplatePreviewDialog({
  isOpen,
  onClose,
  projectId,
  configuredTemplate,
}: ConfiguredTemplatePreviewDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: templatesResponse } = useTemplates(projectId || '');
  const templates = templatesResponse?.data || [];

  const baseTemplate = useMemo(() => {
    if (!configuredTemplate) return null;
    return templates.find((t: any) => t.name === configuredTemplate.templateName) || null;
  }, [templates, configuredTemplate]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-2xl p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${configuredTemplate?.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                <MessageSquare className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ fontFamily: FONT, color: titleColor }}>
                    {configuredTemplate?.configuredTemplateName || 'Template Preview'}
                  </h3>
                  <Badge variant="outline" className={`rounded-lg px-2 py-0 h-5 text-[10px] font-black uppercase tracking-wider ${configuredTemplate?.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {configuredTemplate?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500">
                  Base Template: <span className="font-bold text-blue-500">{configuredTemplate?.templateName}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar max-h-[75vh]">
            {/* Variables Info */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-50/50 border border-blue-100/50">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                <Info className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest leading-none mb-1">Variable Mappings</p>
                <p className="text-[10px] text-blue-700 font-medium leading-tight">
                  This template uses {configuredTemplate?.variableMappings?.length || 0} configured variables.
                </p>
              </div>
            </div>

            {/* Preview Container */}
            <div className="flex justify-center pt-1">
              <div className="relative z-10 w-full max-w-[320px] scale-[0.85] origin-top h-fit -mb-20">
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
                    showSampleContact={true}
                    showVariableMappings={true}
                    className="max-w-full"
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                      <Sparkles className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Base Template Not Found</p>
                    <p className="text-slate-400 text-[10px] mt-1">The original template might have been deleted.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfiguredTemplatePreviewDialog;


