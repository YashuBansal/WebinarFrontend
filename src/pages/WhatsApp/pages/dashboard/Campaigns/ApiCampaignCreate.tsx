import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Sparkles, ArrowLeft } from "lucide-react";
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
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertDescription>
            Please select a project to create API campaigns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 px-2 sm:px-0 overflow-y-auto">
      <ApiCampaignHeader resolvedProjectId={resolvedProjectId} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Campaign Details
          </CardTitle>
          <CardDescription>
            Configure name, template, variables, and optional media.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Summer Promo API Campaign"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
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
              onTemplateSelect={(template) => {
                setValue("templateName", template.name, {
                  shouldValidate: true,
                });
                setFormErrors((prev) => ({ ...prev, template: undefined }));
                setShowValidationErrors(false); // Reset validation errors when template changes
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

            {formErrors.template && (
              <p className="text-sm text-destructive">{formErrors.template}</p>
            )}
            {formErrors.variables && (
              <p className="text-sm text-destructive">{formErrors.variables}</p>
            )}
            {formErrors.media && (
              <p className="text-sm text-destructive">{formErrors.media}</p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={
                createApiCampaignMutation.isPending ||
                (showValidationErrors && !watchedValues.templateName)
              }
            >
              {createApiCampaignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>
                {createApiCampaignMutation.isPending
                  ? "Creating..."
                  : "Create API Campaign"}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiCampaignCreate;

const ApiCampaignHeader = ({
  resolvedProjectId,
}: {
  resolvedProjectId: string;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      <MessageSquare className="h-6 w-6 text-primary" />
      <div>
        <h1 className="text-2xl font-semibold">Create API Campaign</h1>
        <p className="text-sm text-muted-foreground">
          Configure a lightweight campaign for API triggering.
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns`}>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to API Campaigns
        </Button>
      </Link>
      <Link to={`/whatsapp/dashboard/${resolvedProjectId}/campaigns`}>
        <Button variant="ghost" size="sm">
          WhatsApp Campaigns
        </Button>
      </Link>
    </div>
  </div>
);

