import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Video,
    Sparkles,
    Settings,
    MessageSquare,
    Info,
    Save,
    ChevronLeft
} from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useCreateConfiguredTemplate } from '@/hooks/useConfiguredTemplates';
import { toastUtils } from '@/lib/utils';
import type { VariableMapping as ConfiguredTemplateVariableMapping } from '@/schemas/configuredTemplateSchema';
import type { VariableMapping } from '@/api/modules/autoMessage';
import { useNavigate, useParams } from 'react-router-dom';
import TemplateSelectionForm from '@/components/common/TemplateSelectionForm';

// Contact field options for dynamic variables
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

    const [configuredTemplateName, setConfiguredTemplateName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);

    const createConfiguredTemplateMutation = useCreateConfiguredTemplate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const hasMediaHeader = (template: any): boolean => {
        if (!template) return false;
        const headerComponent = template.components?.find((c: any) => c.type === 'HEADER');
        return headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes((headerComponent as any).format);
    };

    const isVariableValid = (vm: VariableMapping): boolean => {
        if (vm.isDynamic) {
            return (
                !!(vm.contactField && vm.contactField.trim()) &&
                !!(vm.fallbackValue && vm.fallbackValue.trim())
            );
        }
        return !!(vm.staticValue && vm.staticValue.trim());
    };

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

        if (variableMappings.length > 0) {
            const invalidVariables = variableMappings.filter(vm => !isVariableValid(vm));
            if (invalidVariables.length > 0) {
                const missingVars = invalidVariables.map(vm => vm.variable).join(', ');
                toastUtils.error(`Please fill all template variables. Missing: ${missingVars}`);
                return;
            }
        }

        try {
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

    const hasInvalidVariables = variableMappings.length > 0 && variableMappings.some(vm => !isVariableValid(vm));
    const canProceed = selectedTemplate !== null &&
        configuredTemplateName.trim() !== '' &&
        (!hasMediaHeader(selectedTemplate) || selectedMediaAsset !== null) &&
        !hasInvalidVariables;

    return (
        <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
            {/* Premium Header */}
            <motion.div
                className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/whatsapp/dashboard/${projectId}/configured-templates`)}
                            className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-slate-500 dark:text-slate-400"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-0.5">
                                <Video className="h-3.5 w-3.5" />
                                Zoom Templates
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                Create Zoom Template
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                Configure mappings for <span className="text-slate-900 dark:text-white font-bold">Automated Messaging</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={createConfiguredTemplateMutation.isPending || (showValidationErrors && !canProceed)}
                            className="h-11 px-8 rounded-xl flex items-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-sm shadow-lg shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {createConfiguredTemplateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {createConfiguredTemplateMutation.isPending ? "Creating..." : "Create Zoom Template"}
                        </Button>
                    </div>
                </div>
            </motion.div>

            <main className="container mx-auto space-y-6 pb-12">
                {/* Template Identity Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-2xl p-6 sm:p-8 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-green-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Template Identity</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Give your configured template a recognizable name</p>
                        </div>

                        <div className="space-y-4 max-w-xl">
                            <div className="space-y-2">
                                <Label htmlFor="configured-template-name" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Settings className="h-3.5 w-3.5" />
                                    Configuration Name
                                </Label>
                                <Input
                                    id="configured-template-name"
                                    placeholder="e.g., Webinar Welcome Message..."
                                    value={configuredTemplateName}
                                    onChange={(e) => setConfiguredTemplateName(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white transition-all font-medium placeholder:text-slate-400"
                                />
                                <p className="text-[10px] text-slate-400 font-medium">
                                    This name is used internally to identify this template in your lists.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Template Configuration Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-2xl p-1 transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-blue-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-6 pt-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Message & Variable Mapping</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Select a base template and map variables to contact fields</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center gap-3">
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                    Dynamic variables will be automatically replaced with contact data.
                                </p>
                            </div>
                        </div>

                        <TemplateSelectionForm
                            selectedTemplate={selectedTemplate}
                            variableMappings={variableMappings}
                            selectedMediaAsset={selectedMediaAsset}
                            uploadedFileName={uploadedFileName}
                            setSelectedTemplate={(template) => {
                                setSelectedTemplate(template);
                                setShowValidationErrors(false);
                            }}
                            setVariableMappings={setVariableMappings}
                            setSelectedMediaAsset={setSelectedMediaAsset}
                            setUploadedFileName={setUploadedFileName}
                            onTemplateSelect={() => {
                                setShowValidationErrors(false);
                            }}
                            projectId={selectedProject?._id}
                            contactFieldOptions={WLH_CONTACT_FIELD_OPTIONS}
                            showPreview={true}
                            showHeaderMedia={true}
                            showValidationErrors={showValidationErrors}
                        />
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
