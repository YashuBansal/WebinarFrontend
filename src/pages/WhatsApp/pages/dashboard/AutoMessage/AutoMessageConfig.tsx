import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// removed language select
import { type VariableMapping } from "@/api/modules/autoMessage";
import { toast } from "sonner";
import { useUpsertAutoMessageConfig } from "@/hooks/useAutoMessageConfigs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronsUpDown,
  Check,
  ArrowLeft,
  Calendar,
  Loader2,
  XCircle,
  Save,
  MessageSquare,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useWebinars } from "@/hooks/useWebinars";
import { formatDateTime12 } from "@/lib/date";
import TemplateSelectionForm from "@/components/common/TemplateSelectionForm";

export default function AutoMessageConfig() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [webinarId, setWebinarId] = useState("");
  // language derives from template; no separate control
  // language derives from template; no separate control
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>(
    []
  );
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  // removed test send
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [webinarDropdownOpen, setWebinarDropdownOpen] = useState(false);

  // Template search

  const {
    data: webinarsData,
    isLoading: webinarsLoading,
    error: webinarsError,
  } = useWebinars();
  const webinars = webinarsData || [];

  const { mutate: upsertConfig, isPending: saving } =
    useUpsertAutoMessageConfig();

  const selectedWebinar = useMemo(
    () => webinars.find((w: any) => w._id === webinarId),
    [webinars, webinarId]
  );

  // Helper function for validation (used in handleSave)
  function hasMediaHeader(template: any): boolean {
    if (!template) return false;
    const header = template.components?.find((c: any) => c.type === "HEADER");
    return (
      !!header &&
      ["IMAGE", "VIDEO", "DOCUMENT"].includes((header as any).format)
    );
  }

  function getHeaderFormat(template: any): string | null {
    if (!template) return null;
    const header = template.components?.find((c: any) => c.type === "HEADER");
    return (header as any)?.format || null;
  }

  function isVariableValid(vm: VariableMapping): boolean {
    if (vm.isDynamic) {
      return (
        !!(vm.contactField && vm.contactField.trim()) &&
        !!(vm.fallbackValue && vm.fallbackValue.trim())
      );
    }
    return !!(vm.staticValue && vm.staticValue.trim());
  }

  const isWebinarIdMissing = !webinarId.trim();
  const isTemplateMissing = !selectedTemplate;
  const hasInvalidVariables =
    variableMappings.length > 0 &&
    variableMappings.some((vm) => !isVariableValid(vm));
  const isMediaRequiredMissing =
    selectedTemplate &&
    hasMediaHeader(selectedTemplate) &&
    hasMediaHeader(selectedTemplate) &&
    !selectedMediaAsset;

  function handleSave() {
    setShowValidationErrors(true);
    if (!projectId) return;
    if (isWebinarIdMissing) return toast.error("Select a webinar");
    if (isTemplateMissing) return toast.error("Select a template");
    if (hasInvalidVariables)
      return toast.error(
        "Fill all template variables (static or contact+fallback)"
      );
    if (isMediaRequiredMissing)
      return toast.error(
        `Select a ${getHeaderFormat(
          selectedTemplate
        )?.toLowerCase()} file for this template header`
      );

    upsertConfig(
      {
        projectId,
        webinarId,
        templateName: selectedTemplate?.name || "",
        // language omitted; backend will default or use template language
        // language omitted; backend will default or use template language
        headerMediaAssetId: selectedMediaAsset?._id || null,
        enabled: true,
        variableMappings,
      },
      {
        onSuccess: () => {
          navigate(`/whatsapp/dashboard/${projectId}/auto-message`);
        },
      }
    );
  }

  // test send removed

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <Link to={`/whatsapp/dashboard/${projectId}/auto-message`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Auto Message Configuration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure a WhatsApp template to send immediately when someone
              registers for a webinar.
            </p>
          </div>
        </div>
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
        projectId={projectId}
        showValidationErrors={showValidationErrors}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div className="space-y-2.5">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Webinar
            {showValidationErrors && isWebinarIdMissing && (
              <span className="text-xs text-destructive font-semibold ml-1">
                (Required)
              </span>
            )}
          </Label>
          <Popover
            open={webinarDropdownOpen}
            onOpenChange={setWebinarDropdownOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={webinarDropdownOpen}
                className={`w-full justify-between h-11 ${
                  showValidationErrors && isWebinarIdMissing
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                disabled={webinarsLoading}
              >
                {selectedWebinar ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium text-sm truncate w-full">
                        {selectedWebinar.webinarName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime12(selectedWebinar.webinarDate)}
                      </span>
                    </div>
                  </div>
                ) : webinarsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading webinars...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Select a webinar</span>
                  </div>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search webinars..." />
                <CommandList className="max-h-64 overflow-auto custom-scrollbar">
                  <CommandEmpty>No webinars found.</CommandEmpty>
                  <CommandGroup>
                    {webinars && webinars.length > 0 ? (
                      webinars.reverse().map((webinar: any) => (
                        <CommandItem
                          key={webinar._id}
                          value={webinar.webinarName}
                          onSelect={() => {
                            setWebinarId(webinar._id);
                            setWebinarDropdownOpen(false);
                          }}
                          className="cursor-pointer py-2.5"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${
                              webinarId === webinar._id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-sm">
                              {webinar.webinarName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime12(webinar.webinarDate)}
                            </span>
                          </div>
                        </CommandItem>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        {webinarsLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          "No webinars available"
                        )}
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {webinarsError && (
            <Alert variant="destructive">
              <XCircle />
              <AlertDescription>
                Failed to load webinars. Please try again.
              </AlertDescription>
            </Alert>
          )}
          {/* {isWebinarIdMissing && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Webinar is required
            </p>
          )} */}
        </div>
        <Button
          onClick={handleSave}
          disabled={
            saving ||
            (showValidationErrors && (
              isWebinarIdMissing ||
              isTemplateMissing ||
              hasInvalidVariables ||
              isMediaRequiredMissing
            ))
          }
          size="lg"
          className="w-full md:w-auto h-11 font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

