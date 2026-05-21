import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Settings2,
  Code,
  Target,
  Zap,
  LayoutGrid,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  Activity
} from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { useCreateApiCampaign } from "@/hooks/useApiCampaigns";
import type { VariableMapping } from "@/api/modules/autoMessage";
import TemplateSelectionForm from "@/components/common/TemplateSelectionForm";
import type { CreateApiCampaignPayload } from "@/schemas/apiCampaignSchema";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Campaign name is required" })
    .max(100, { message: "Keep it under 100 characters" }),
  templateName: z.string().min(1, { message: "Please select a template" }),
});

type FormData = z.infer<typeof formSchema>;

// Conversion utility to convert VariableMapping[] to string[] for API
function toBodyVariables(mappings: VariableMapping[]): string[] {
  return mappings.map((m) => m.staticValue || "");
}

const ApiCampaignCreate = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedProject } = useProjectContext();
  const resolvedProjectId = projectId ?? selectedProject?._id ?? "";
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>(
    []
  );
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [formErrors, setFormErrors] = useState<{
    template?: string;
    media?: string;
    variables?: string;
  }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", templateName: "" },
  });

  const watchedValues = watch();
  const createApiCampaignMutation = useCreateApiCampaign();

  // Helper function to check if template has media header (for validation)
  const hasMediaHeader = (template: any): boolean => {
    if (!template) return false;
    const headerComponent = template.components?.find(
      (c: any) => c.type === "HEADER"
    );
    return (
      headerComponent &&
      ["IMAGE", "VIDEO", "DOCUMENT"].includes((headerComponent as any).format)
    );
  };

  const onSubmit = async (data: FormData) => {
    setShowValidationErrors(true);
    if (!selectedProject?._id) return;

    const validationErrors: typeof formErrors = {};

    if (!selectedTemplate) {
      validationErrors.template = "Please select a template.";
    }

    // Validate variable mappings
    if (variableMappings.length > 0) {
      const missingVariableIndex = variableMappings.findIndex(
        (m) => !m.staticValue || !m.staticValue.trim()
      );
      if (missingVariableIndex !== -1) {
        validationErrors.variables =
          "All template variables must have a value.";
      }
    }

    // Validate media header
    if (hasMediaHeader(selectedTemplate)) {
      const hasSelectedMedia = Boolean(
        selectedMediaAsset?._id
      );
      if (!hasSelectedMedia) {
        validationErrors.media = "Header media is required for this template.";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors({});
    // Convert VariableMapping[] to string[] for API
    const bodyVariables = toBodyVariables(variableMappings);

    const payload: CreateApiCampaignPayload = {
      name: data.name.trim(),
      projectId: selectedProject._id,
      messageTemplate: {
        templateName: data.templateName,
        bodyVariables: bodyVariables.length > 0 ? bodyVariables : undefined,
        headerMediaAssetId:
          selectedMediaAsset?._id || undefined,
      },
    };

    await createApiCampaignMutation.mutateAsync(payload);
    navigate(`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns`);
  };

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 bg-white dark:bg-slate-800/50 shadow-sm">
        <Alert className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
          <AlertCircle className="h-8 w-8 mb-4 text-[#22B573]" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Project Required</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Please select a project from the sidebar to create API campaigns.
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns`)}
              className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-slate-500 dark:text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest">
                <Code className="h-3.5 w-3.5" />
                API Hub
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Create API Campaign
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Establish a webhook-ready messaging endpoint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/campaigns`}>
              <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                WhatsApp Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-2">
        {/* Help Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-1 space-y-4"
        >
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden sticky top-6">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/50 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-[#22B573]" />
                Endpoint Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                {[
                  { label: "Trigger Mechanism", value: "REST API / Webhook", icon: Zap },
                  { label: "Execution Mode", value: "Asynchronous", icon: Activity },
                  { label: "Data Format", value: "JSON Payload", icon: Code },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-[#22B573] transition-all">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#22B573]/5 border border-[#22B573]/10">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  API campaigns are lightweight templates that can be triggered programmatically from your existing workflows or systems.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-3"
        >
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* 1. Campaign Identity Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden bg-white dark:bg-slate-800/50">
              <CardHeader className="bg-slate-50/30 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/50 px-6 sm:px-10 py-6">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#22B573]" />
                  Campaign Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 sm:px-10 py-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-1 bg-[#22B573] rounded-full" />
                    <Label htmlFor="name" className="text-sm font-black uppercase tracking-widest text-slate-400">Name your campaign</Label>
                  </div>
                  <div className="relative group">
                    <Input
                      id="name"
                      placeholder="e.g. Transactional OTP Service"
                      className={`h-14 rounded-2xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/60 pl-12 text-base font-bold transition-all focus:bg-white focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] ${errors.name ? 'border-red-300' : ''}`}
                      {...register("name")}
                    />
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#22B573] transition-colors" />
                  </div>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 pl-2"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </motion.p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Template Configuration Card (Sticky Preview inside) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/30 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-2xl p-1 transition-all duration-300"
            >
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
                onTemplateSelect={(template) => {
                  setValue("templateName", template.name, {
                    shouldValidate: true,
                  });
                  setFormErrors((prev) => ({ ...prev, template: undefined }));
                  setShowValidationErrors(false);
                }}
                onVariableMappingsChange={() => {
                  setFormErrors((prev) => ({ ...prev, variables: undefined }));
                }}
                projectId={selectedProject?._id}
                showPreview={true}
                showHeaderMedia={true}
                allowDynamicFields={false}
                showValidationErrors={showValidationErrors}
              />
            </motion.div>

            {/* 3. Validation and Deployment Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-lg bg-white dark:bg-slate-800/50 overflow-hidden">
              <CardContent className="p-4 sm:p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    {(formErrors.template || formErrors.variables || formErrors.media) ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 space-y-1"
                      >
                        {formErrors.template && <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> {formErrors.template}</p>}
                        {formErrors.variables && <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> {formErrors.variables}</p>}
                        {formErrors.media && <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> {formErrors.media}</p>}
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="h-5 w-5 text-[#22B573]" />
                        <p className="text-sm font-medium">Ready to deploy your transactional API endpoint.</p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={createApiCampaignMutation.isPending || (showValidationErrors && !watchedValues.templateName)}
                    className="h-14 px-8 rounded-2xl bg-[#22B573] hover:bg-[#1da467] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 min-w-[240px]"
                  >
                    {createApiCampaignMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    ) : (
                      <Sparkles className="h-5 w-5 mr-3" />
                    )}
                    {createApiCampaignMutation.isPending ? "Initializing..." : "Deploy API Campaign"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiCampaignCreate;

