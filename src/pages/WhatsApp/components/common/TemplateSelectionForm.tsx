import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { type VariableMapping } from "@/api/modules/autoMessage";
import { useTemplates } from "@/hooks/useTemplates";
import { useMediaAssets } from "@/hooks/useMediaAssets";
import { useProjectContext } from "@/context/ProjectContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MediaFileDialog } from "@/components/ui/MediaFileDialog";
import { Button } from "@/components/ui/button";
import {
  ChevronsUpDown,
  Check,
  Image as ImageIcon,
  Search,
  FileText,
  Code,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhatsAppTemplatePreviewCard } from "@/components/ui/whatsapp-template-preview-card";

interface TemplateSelectionFormProps {
  // Required state
  selectedTemplate: any | null;
  variableMappings: VariableMapping[];

  // Optional state (for header media)
  // Optional state (for header media)
  selectedMediaAsset?: any;
  uploadedFileName?: string;

  // Required setters
  setSelectedTemplate: Dispatch<SetStateAction<any>>;
  setVariableMappings: Dispatch<SetStateAction<VariableMapping[]>>;

  // Optional setters
  // Optional setters
  setSelectedMediaAsset?: Dispatch<SetStateAction<any>>;
  setUploadedFileName?: Dispatch<SetStateAction<string>>;

  // Optional callbacks
  onTemplateSelect?: (template: any) => void;
  onVariableMappingsChange?: (mappings: VariableMapping[]) => void;

  // Optional configuration
  projectId?: string; // If not provided, uses useProjectContext
  contactFieldOptions?: Array<{ value: string; label: string; field: string }>;
  showPreview?: boolean; // Default true
  showHeaderMedia?: boolean; // Default true
  allowDynamicFields?: boolean; // Default true - if false, only static values are allowed
  showValidationErrors?: boolean; // Default false - if true, shows validation warnings
}

// Default contact field options
const DEFAULT_CONTACT_FIELD_OPTIONS = [
  { value: "$firstName", label: "First Name", field: "firstName" },
  { value: "$lastName", label: "Last Name", field: "lastName" },
  { value: "$email", label: "Email", field: "email" },
  { value: "$phone", label: "Phone", field: "phone" },
];

export default function TemplateSelectionForm({
  selectedTemplate,
  variableMappings,
  selectedMediaAsset,
  uploadedFileName,
  setSelectedTemplate,
  setVariableMappings,
  setSelectedMediaAsset,
  setUploadedFileName,
  onTemplateSelect,
  onVariableMappingsChange,
  projectId,
  contactFieldOptions = DEFAULT_CONTACT_FIELD_OPTIONS,
  showPreview = true,
  showHeaderMedia = true,
  allowDynamicFields = true,
  showValidationErrors = false,
}: TemplateSelectionFormProps) {
  const { selectedProject } = useProjectContext();
  const [templateSearch, setTemplateSearch] = useState<string>("");
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);

  // Determine projectId - use prop if provided, otherwise use context
  const effectiveProjectId = projectId || selectedProject?._id || "";

  // Normalize variableMappings when allowDynamicFields is false
  // Ensure all mappings are static when dynamic fields are disabled
  useEffect(() => {
    if (!allowDynamicFields && variableMappings.some(vm => vm.isDynamic)) {
      const normalized = variableMappings.map(vm => ({
        ...vm,
        isDynamic: false,
        contactField: undefined,
        fallbackValue: undefined,
      }));
      // Only update if there's an actual change to avoid infinite loops
      const hasChange = normalized.some((vm, idx) => 
        vm.isDynamic !== variableMappings[idx]?.isDynamic ||
        vm.contactField !== variableMappings[idx]?.contactField ||
        vm.fallbackValue !== variableMappings[idx]?.fallbackValue
      );
      if (hasChange) {
        setVariableMappings(normalized);
        onVariableMappingsChange?.(normalized);
      }
    }
  }, [allowDynamicFields]); // Only run when allowDynamicFields changes

  // Helper functions
  function extractVariables(templateBody: string): string[] {
    const matches = templateBody.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : [];
  }

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

  function getTemplateType(
    template: any
  ): "text" | "image" | "video" | "document" {
    const format = getHeaderFormat(template);
    if (!format) return "text";
    const upper = String(format).toUpperCase();
    if (upper === "IMAGE") return "image";
    if (upper === "VIDEO") return "video";
    if (upper === "DOCUMENT") return "document";
    return "text";
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

  function updateMapping(index: number, patch: Partial<VariableMapping>) {
    const next = [...variableMappings];
    const updated = { ...next[index], ...patch } as VariableMapping;
    // Force isDynamic to false if allowDynamicFields is false
    if (!allowDynamicFields) {
      updated.isDynamic = false;
      updated.contactField = undefined;
      updated.fallbackValue = undefined;
    }
    next[index] = updated;
    setVariableMappings(next);
    onVariableMappingsChange?.(next);
  }

  function handleTemplateSelect(t: any) {
    // Reset header media selection when template changes
    if (setSelectedMediaAsset) setSelectedMediaAsset(null);
    if (setUploadedFileName) setUploadedFileName("");
    
    
    setSelectedTemplate(t);
    
    // Extract variables and initialize mappings
    const body = t?.components?.find((c: any) => c.type === "BODY")?.text;
    if (body) {
      const vars = extractVariables(body);
      const mappings: VariableMapping[] = vars.map((v) => ({
        variable: `{{${v}}}`,
        isDynamic: allowDynamicFields ? true : false,
        contactField: allowDynamicFields ? (contactFieldOptions[0]?.value || "$firstName") : undefined,
        staticValue: "",
        fallbackValue: "",
      }));
      setVariableMappings(mappings);
      onVariableMappingsChange?.(mappings);
    } else {
      setVariableMappings([]);
      onVariableMappingsChange?.([]);
    }
    onTemplateSelect?.(t);
  }

  // Fetch templates
  const { data: templatesResp, isLoading: templatesLoading } = useTemplates(
    effectiveProjectId
  );

  // Fetch media assets
  const {
    data: mediaAssetsData,
    isLoading: mediaAssetsLoading,
    error: mediaAssetsError,
  } = useMediaAssets({
    projectId: effectiveProjectId,
    page: 1,
    limit: 50,
  });

  // Compute approved templates
  const approvedTemplates = useMemo(() => {
    if (!Array.isArray(templatesResp?.data)) return [];
    return templatesResp?.data.filter(
      (t: any) => (t?.status || "").toUpperCase() !== "REJECTED"
    );
  }, [templatesResp]);


  // Compute filtered templates
  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(approvedTemplates)) return [];
    const query = templateSearch.trim().toLowerCase();
    if (!query) return approvedTemplates;
    return approvedTemplates.filter((t: any) => {
      const name = (t?.name || "").toLowerCase();
      const category = (t?.category || "").toLowerCase();
      const language = (t?.language || "").toLowerCase();
      const body = (
        t?.components?.find((c: any) => c.type === "BODY")?.text || ""
      ).toLowerCase();
      return (
        name.includes(query) ||
        category.includes(query) ||
        language.includes(query) ||
        body.includes(query)
      );
    });
  }, [approvedTemplates, templateSearch]);

  // Compute validation flags
  const isTemplateMissing = !selectedTemplate;
  const isMediaRequiredMissing =
    showHeaderMedia &&
    selectedTemplate &&
    hasMediaHeader(selectedTemplate) &&
    hasMediaHeader(selectedTemplate) &&
    !selectedMediaAsset;

  // Compute filtered media assets
  const filteredMediaAssets = useMemo(() => {
    if (
      !mediaAssetsData?.data ||
      !selectedTemplate ||
      !hasMediaHeader(selectedTemplate)
    )
      return [];
    const format = getHeaderFormat(selectedTemplate);
    return mediaAssetsData.data.filter((asset: any) => {
      if (format === "IMAGE") return asset.mimeType.startsWith("image/");
      if (format === "VIDEO") return asset.mimeType.startsWith("video/");
      if (format === "DOCUMENT")
        return asset.mimeType.startsWith("application/");
      return true;
    });
  }, [mediaAssetsData, selectedTemplate, hasMediaHeader, getHeaderFormat]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      {/* Left: Configuration */}
      <Card className="flex flex-col h-full max-h-[calc(100vh-8rem)] shadow-sm border-2">
        <CardHeader className="flex-shrink-0 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Choose Template</CardTitle>
          </div>
          <CardDescription className="mt-1.5">
            Select a template and configure variables
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Search className="h-4 w-4 text-muted-foreground" />
                WhatsApp template
                {showValidationErrors && isTemplateMissing && (
                  <span className="text-xs text-destructive font-semibold ml-1">
                    (Required)
                  </span>
                )}
              </Label>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading templates...
                </div>
              ) : approvedTemplates.length === 0 ? (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900">
                  <AlertDescription className="text-sm">
                    No approved templates available.
                  </AlertDescription>
                </Alert>
              ) : (
                <Popover
                  open={templatePopoverOpen}
                  onOpenChange={setTemplatePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={templatePopoverOpen}
                      className={`w-full justify-between h-11 ${
                        showValidationErrors && isTemplateMissing
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                        <span className="truncate text-sm">
                          {selectedTemplate?.name || "Select template..."}
                        </span>
                        {selectedTemplate && (
                          <span className="text-[11px] text-muted-foreground">
                            {getTemplateType(selectedTemplate)} template
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search by name, category, language, or body"
                        value={templateSearch}
                        onValueChange={setTemplateSearch}
                      />
                      <CommandList
                        className="overscroll-contain"
                        onWheel={(e) => e.stopPropagation()}
                      >
                        <CommandEmpty>
                          No templates match your search.
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredTemplates.map((t: any) => (
                            <CommandItem
                              key={t.id || t._id || t.name}
                              value={t.name}
                              onSelect={() => {
                                handleTemplateSelect(t);
                                setTemplatePopoverOpen(false);
                              }}
                              className="cursor-pointer flex flex-col items-start gap-1 py-2.5"
                            >
                              <div className="flex w-full items-center justify-between">
                                <span className="font-medium text-sm">
                                  {t.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-medium px-2 py-0.5"
                                >
                                  {t.category || "General"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground w-full flex justify-between">
                                <span>
                                  {t.language} • {(t.status || "").toString()} •{" "}
                                  {getTemplateType(t)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2 w-full">
                                {t.components
                                  ?.find((c: any) => c.type === "BODY")
                                  ?.text?.substring(0, 100)}
                                {t.components
                                  ?.find((c: any) => c.type === "BODY")
                                  ?.text?.length > 100 && "..."}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {showValidationErrors && isTemplateMissing && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  Template selection is required.
                </p>
              )}
            </div>

            {showHeaderMedia &&
              selectedTemplate &&
              hasMediaHeader(selectedTemplate) && (
                <div className="space-y-2.5 pt-3 mt-1 border-t border-dashed">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Header media file
                    <Badge
                      variant="outline"
                      className="text-xs font-medium px-2 py-0.5 ml-1"
                    >
                      {getHeaderFormat(selectedTemplate)?.toLowerCase()}
                    </Badge>
                    {showValidationErrors && isMediaRequiredMissing && (
                      <span className="text-xs text-destructive font-semibold ml-1">
                        (Required)
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose the file that will appear in the template header.
                  </p>
                  <MediaFileDialog
                    mediaFiles={filteredMediaAssets}
                    isLoading={mediaAssetsLoading}
                    error={mediaAssetsError}
                    selectedFile={selectedMediaAsset}
                    onFileSelect={(file: any) => {
                      if (setSelectedMediaAsset) setSelectedMediaAsset(file);
                      if (setUploadedFileName)
                        setUploadedFileName(file?.fileName);
                    }}
                    onUploadNew={() => {}}
                    // @ts-expect-error narrowing not needed for dialog prop
                    fileType={getHeaderFormat(selectedTemplate)}
                    title={`Select ${getHeaderFormat(
                      selectedTemplate
                    )?.toLowerCase()} file`}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start h-10 ${
                        showValidationErrors && isMediaRequiredMissing
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      title={uploadedFileName || selectedMediaAsset?.fileName}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {uploadedFileName ||
                          selectedMediaAsset?.fileName ||
                          `Choose ${getHeaderFormat(
                            selectedTemplate
                          )?.toLowerCase()} file`}
                      </span>
                    </Button>
                  </MediaFileDialog>
                  {showValidationErrors && isMediaRequiredMissing && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      This template requires a{" "}
                      {getHeaderFormat(selectedTemplate)?.toLowerCase()} file.
                    </p>
                  )}
                </div>
              )}

            <div className="space-y-2.5 pt-2 border-t">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Code className="h-4 w-4 text-muted-foreground" />
                Variable mappings
              </Label>
              <p className="text-xs text-muted-foreground">
                Set how each <span className="font-mono">{"{{variable}}"}</span> in the template gets its value.
              </p>
              <div className="space-y-3">
                {selectedTemplate && variableMappings.length === 0 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-md border border-dashed">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Selected template has no body variables.
                  </div>
                )}
                {variableMappings.map((vm, idx) => {
                  const isDynamic = !!vm.isDynamic;
                  const isValid = isVariableValid(vm);
                  return (
                    <div
                      key={idx}
                      className={`space-y-3 p-3 border rounded-lg transition-all ${
                        showValidationErrors && !isValid
                          ? "border-destructive bg-destructive/5 dark:bg-destructive/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Code className="h-3.5 w-3.5 text-muted-foreground" />
                          Variable {vm.variable}
                          {showValidationErrors && !isValid && (
                            <span className="text-xs text-destructive font-semibold ml-1">
                              (Required)
                            </span>
                          )}
                        </Label>
                        {allowDynamicFields && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              Use contact field
                            </span>
                            <input
                              type="checkbox"
                              checked={isDynamic}
                              onChange={(e) =>
                                updateMapping(idx, {
                                  isDynamic: e.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                      {allowDynamicFields && isDynamic ? (
                        <div className="space-y-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-between h-10 ${
                                  showValidationErrors && !vm.contactField
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                                }`}
                              >
                                {contactFieldOptions.find(
                                  (o) => o.value === vm.contactField
                                )?.label || "Select contact field"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <Command>
                                <CommandList>
                                  <CommandEmpty>
                                    No contact fields found.
                                  </CommandEmpty>
                                    <CommandGroup>
                                    {contactFieldOptions.map((option) => (
                                      <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() =>
                                          updateMapping(idx, {
                                            contactField: option.value,
                                          })
                                        }
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            vm.contactField === option.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {option.label}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            Uses {option.field} from contact
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Fallback value
                            </Label>
                            <Input
                              value={vm.fallbackValue || ""}
                              onChange={(e) =>
                                updateMapping(idx, {
                                  fallbackValue: e.target.value,
                                })
                              }
                              placeholder="Used if contact field is empty"
                              className={`h-10 ${
                                showValidationErrors && !vm.fallbackValue
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                            />
                            {showValidationErrors && !vm.contactField && (
                              <p className="text-xs text-destructive flex items-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5" />
                                Contact field is required.
                              </p>
                            )}
                            {showValidationErrors && !vm.fallbackValue && (
                              <p className="text-xs text-destructive flex items-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5" />
                                Fallback value is required for dynamic variables.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Input
                          value={vm.staticValue || ""}
                          onChange={(e) =>
                            updateMapping(idx, {
                              staticValue: e.target.value,
                              // Force isDynamic to false when allowDynamicFields is false
                              ...(allowDynamicFields ? {} : { isDynamic: false }),
                            })
                          }
                          placeholder="Static value"
                          className={`h-10 ${
                            showValidationErrors && !vm.staticValue
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Template Preview */}
      {showPreview && (
        <Card className="flex flex-col h-full max-h-[calc(100vh-8rem)] shadow-sm border-2">
          <CardHeader className="flex-shrink-0 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Template Preview</CardTitle>
            </div>
            <CardDescription className="mt-1.5">
              Preview of the selected template
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {selectedTemplate ? (
              (() => {
                const previewMappings = (variableMappings || []).map((vm) => ({
                  variable: vm.variable,
                  contactField:
                    vm.contactField ??
                    contactFieldOptions[0]?.value ??
                    "$firstName",
                  isDynamic: vm.isDynamic,
                  staticValue: vm.staticValue ?? "",
                  fallbackValue: vm.fallbackValue ?? "",
                }));
                return (
                  <WhatsAppTemplatePreviewCard
                    template={selectedTemplate}
                    variableMappings={previewMappings}
                    showSampleContact={false}
                    showVariableMappings={false}
                    headerMediaAsset={selectedMediaAsset}
                  />
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No template selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Select a template to see the preview
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

