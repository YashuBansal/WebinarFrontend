import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type VariableMapping } from "@/api/modules/autoMessage";
import { useTemplates } from "@/hooks/useTemplates";
import { useMediaAssets } from "@/hooks/useMediaAssets";
import { useProjectContext } from "@/context/ProjectContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Settings,
  ChevronRight,
  User,
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
  selectedMediaAsset?: any;
  uploadedFileName?: string;

  // Required setters
  setSelectedTemplate: Dispatch<SetStateAction<any>>;
  setVariableMappings: Dispatch<SetStateAction<VariableMapping[]>>;

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
  useEffect(() => {
    if (!allowDynamicFields && variableMappings.some(vm => vm.isDynamic)) {
      const normalized = variableMappings.map(vm => ({
        ...vm,
        isDynamic: false,
        contactField: undefined,
        fallbackValue: undefined,
      }));
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
  }, [allowDynamicFields]);

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
    if (setSelectedMediaAsset) setSelectedMediaAsset(null);
    if (setUploadedFileName) setUploadedFileName("");

    setSelectedTemplate(t);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch p-4 sm:p-6">
      {/* Left: Configuration (Col 7) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="space-y-6">
          {/* Template Selection Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <FileText className="h-3 w-3" />
                Select Template
              </Label>
              {showValidationErrors && isTemplateMissing && (
                <Badge variant="destructive" className="h-5 px-2 text-[10px] font-bold uppercase">Required</Badge>
              )}
            </div>

            {templatesLoading ? (
              <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4">
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-600" />
                <span className="text-sm font-medium text-slate-400">Loading templates...</span>
              </div>
            ) : (
              <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-between h-12 bg-white border-slate-200 rounded-xl px-4 hover:bg-slate-50/50 hover:border-slate-300 transition-all ${showValidationErrors && isTemplateMissing ? "border-red-300 ring-2 ring-red-50" : ""
                      }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <div className="h-6 w-6 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-sm font-bold text-slate-900">
                        {selectedTemplate?.name || "Choose a WhatsApp template..."}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-slate-200 shadow-2xl rounded-2xl overflow-hidden" align="start">
                  <Command className="bg-white">
                    <CommandInput placeholder="Search templates..." className="h-12 border-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-sm text-slate-400 font-medium">No templates found.</CommandEmpty>
                      <CommandGroup>
                        {filteredTemplates.map((t: any) => (
                          <CommandItem
                            key={t._id || t.name}
                            value={t.name}
                            onSelect={() => {
                              handleTemplateSelect(t);
                              setTemplatePopoverOpen(false);
                            }}
                            className="cursor-pointer p-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black">{t.language}</Badge>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 font-medium">{t.category}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Media Header Section */}
          <AnimatePresence>
            {showHeaderMedia && selectedTemplate && hasMediaHeader(selectedTemplate) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <ImageIcon className="h-3 w-3" />
                  Header {getHeaderFormat(selectedTemplate)?.toLowerCase()}
                </Label>

                <MediaFileDialog
                  mediaFiles={filteredMediaAssets as any}
                  isLoading={mediaAssetsLoading}
                  error={mediaAssetsError}
                  selectedFile={selectedMediaAsset}
                  onFileSelect={(file: any) => {
                    if (setSelectedMediaAsset) setSelectedMediaAsset(file);
                    if (setUploadedFileName) setUploadedFileName(file?.fileName);
                  }}
                  onUploadNew={() => { }}
                  // @ts-expect-error narrowing not needed for dialog prop
                  fileType={getHeaderFormat(selectedTemplate)}
                  title={`Select ${getHeaderFormat(selectedTemplate)?.toLowerCase()} file`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-between h-12 bg-white border-slate-200 rounded-xl px-4 hover:bg-slate-50/50 transition-all ${showValidationErrors && isMediaRequiredMissing ? "border-red-300 ring-2 ring-red-50" : ""
                      }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <ImageIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-sm font-bold text-slate-900">
                        {uploadedFileName || selectedMediaAsset?.fileName || `Upload ${getHeaderFormat(selectedTemplate)?.toLowerCase()}...`}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Button>
                </MediaFileDialog>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Variables Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Code className="h-3 w-3" />
              Template Variables
            </Label>

            <div className="space-y-4">
              {selectedTemplate && variableMappings.length === 0 && (
                <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-green-500 mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">No variables needed</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">This template is ready to send as-is.</p>
                </div>
              )}

              {variableMappings.map((vm, idx) => {
                const isDynamic = !!vm.isDynamic;
                const isValid = isVariableValid(vm);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 rounded-2xl bg-white border transition-all duration-300 ${showValidationErrors && !isValid
                        ? "border-red-200 bg-red-50/30"
                        : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-900 text-white font-black text-[10px] px-2 h-5 rounded-md">
                          {vm.variable}
                        </Badge>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Configuration</span>
                      </div>

                      {allowDynamicFields && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dynamic</span>
                          <input
                            type="checkbox"
                            checked={isDynamic}
                            onChange={(e) => updateMapping(idx, { isDynamic: e.target.checked })}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {allowDynamicFields && isDynamic ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Field</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between h-11 bg-slate-50/50 border-slate-200 rounded-xl px-3 hover:bg-white transition-all text-sm font-bold text-slate-700"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  {contactFieldOptions.find((o) => o.value === vm.contactField)?.label || "Select field"}
                                </div>
                                <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-slate-200 rounded-xl overflow-hidden" align="start">
                              <Command>
                                <CommandList>
                                  <CommandGroup>
                                    {contactFieldOptions.map((option) => (
                                      <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => updateMapping(idx, { contactField: option.value })}
                                        className="cursor-pointer p-2 font-bold text-slate-700 text-sm hover:bg-slate-50"
                                      >
                                        <Check className={`mr-2 h-4 w-4 text-green-600 ${vm.contactField === option.value ? "opacity-100" : "opacity-0"}`} />
                                        {option.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fallback Value</Label>
                          <Input
                            value={vm.fallbackValue || ""}
                            onChange={(e) => updateMapping(idx, { fallbackValue: e.target.value })}
                            placeholder="Type fallback content..."
                            className="h-11 bg-slate-50/50 border-slate-200 rounded-xl px-4 text-sm font-medium focus:ring-green-500 focus:border-green-500 transition-all"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Static Message Content</Label>
                        <Textarea
                          value={vm.staticValue || ""}
                          onChange={(e) => updateMapping(idx, { staticValue: e.target.value })}
                          placeholder="Enter the value for this variable..."
                          className="min-h-[100px] bg-slate-50/50 border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-green-500/20 focus:border-green-500 transition-all resize-none shadow-inner"
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Template Preview (Col 5) */}
      <div className="lg:col-span-5">
        <div className="sticky top-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
              <ImageIcon className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Real-time Preview</h2>
          </div>

          <div className="relative">
            {/* Phone Mockup Background */}
            <div className="absolute inset-0 bg-slate-900/5 blur-3xl -z-10 rounded-full scale-75" />

            {showPreview && selectedTemplate ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex justify-center"
              >
                {(() => {
                  const previewMappings = (variableMappings || []).map((vm) => ({
                    variable: vm.variable,
                    contactField: vm.contactField ?? contactFieldOptions[0]?.value ?? "$firstName",
                    isDynamic: vm.isDynamic,
                    staticValue: vm.staticValue ?? "",
                    fallbackValue: vm.fallbackValue ?? "",
                  }));
                  return (
                    <WhatsAppTemplatePreviewCard
                      template={selectedTemplate}
                      variableMappings={previewMappings}
                      showSampleContact={true}
                      showVariableMappings={true}
                      headerMediaAsset={selectedMediaAsset}
                      className="w-full"
                    />
                  );
                })()}
              </motion.div>
            ) : (
              <div className="h-[400px] rounded-[32px] border-4 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-200 mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No Template Selected</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Choose a template from the list to see how it will look on your customers' phones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}