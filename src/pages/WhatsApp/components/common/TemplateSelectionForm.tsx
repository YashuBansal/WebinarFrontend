import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type VariableMapping } from "@/api/modules/autoMessage";
import { useTemplates } from "@/hooks/useTemplates";
import { useQuickReplies } from "@/hooks/useQuickReplies";
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
  Zap,
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

  // Session state (optional when selecting both)
  selectedSessionTemplate?: any | null;
  sessionVariableMappings?: VariableMapping[];

  // Optional state (for header media)
  selectedMediaAsset?: any;
  uploadedFileName?: string;

  // Required setters
  setSelectedTemplate: Dispatch<SetStateAction<any>>;
  setVariableMappings: Dispatch<SetStateAction<VariableMapping[]>>;

  // Session setters (optional)
  setSelectedSessionTemplate?: Dispatch<SetStateAction<any>>;
  setSessionVariableMappings?: Dispatch<SetStateAction<VariableMapping[]>>;

  // Optional setters
  setSelectedMediaAsset?: Dispatch<SetStateAction<any>>;
  setUploadedFileName?: Dispatch<SetStateAction<string>>;

  // Optional callbacks
  onTemplateSelect?: (template: any) => void;
  onVariableMappingsChange?: (mappings: VariableMapping[]) => void;
  onSessionTemplateSelect?: (template: any) => void;
  onSessionVariableMappingsChange?: (mappings: VariableMapping[]) => void;

  // Optional configuration
  projectId?: string; // If not provided, uses useProjectContext
  contactFieldOptions?: Array<{ value: string; label: string; field: string }>;
  showPreview?: boolean; // Default true
  showHeaderMedia?: boolean; // Default true
  allowDynamicFields?: boolean; // Default true - if false, only static values are allowed
  showValidationErrors?: boolean; // Default false - if true, shows validation warnings
  allowedTabs?: "session" | "standard" | "both"; // Default "both"
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
  selectedSessionTemplate,
  sessionVariableMappings = [],
  selectedMediaAsset,
  uploadedFileName,
  setSelectedTemplate,
  setVariableMappings,
  setSelectedSessionTemplate,
  setSessionVariableMappings,
  setSelectedMediaAsset,
  setUploadedFileName,
  onTemplateSelect,
  onVariableMappingsChange,
  onSessionTemplateSelect,
  onSessionVariableMappingsChange,
  projectId,
  contactFieldOptions = DEFAULT_CONTACT_FIELD_OPTIONS,
  showPreview = true,
  showHeaderMedia = true,
  allowDynamicFields = true,
  showValidationErrors = false,
  allowedTabs = "both",
}: TemplateSelectionFormProps) {
  const { selectedProject } = useProjectContext();
  const [standardSearch, setStandardSearch] = useState<string>("");
  const [sessionSearch, setSessionSearch] = useState<string>("");
  const [standardPopoverOpen, setStandardPopoverOpen] = useState(false);
  const [sessionPopoverOpen, setSessionPopoverOpen] = useState(false);

  // Determine active preview: default to session if selected, standard otherwise
  const [previewType, setPreviewType] = useState<"session" | "standard">("session");

  // Sync preview type with allowedTabs restriction
  useEffect(() => {
    if (allowedTabs === "session") {
      setPreviewType("session");
    } else if (allowedTabs === "standard") {
      setPreviewType("standard");
    }
  }, [allowedTabs]);

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

  // Sync preview type on mount / initial load only
  useEffect(() => {
    if (selectedSessionTemplate) {
      setPreviewType("session");
    } else if (selectedTemplate) {
      setPreviewType("standard");
    }
  }, []);

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

  function isVariableValid(vm: VariableMapping): boolean {
    if (vm.isDynamic) {
      return (
        !!(vm.contactField && vm.contactField.trim()) &&
        !!(vm.fallbackValue && vm.fallbackValue.trim())
      );
    }
    return !!(vm.staticValue && vm.staticValue.trim());
  }

  function updateStandardMapping(index: number, patch: Partial<VariableMapping>) {
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

  function updateSessionMapping(index: number, patch: Partial<VariableMapping>) {
    if (!setSessionVariableMappings) return;
    const next = [...sessionVariableMappings];
    const updated = { ...next[index], ...patch } as VariableMapping;
    if (!allowDynamicFields) {
      updated.isDynamic = false;
      updated.contactField = undefined;
      updated.fallbackValue = undefined;
    }
    next[index] = updated;
    setSessionVariableMappings(next);
    onSessionVariableMappingsChange?.(next);
  }

  function handleStandardTemplateSelect(t: any) {
    if (setSelectedMediaAsset) setSelectedMediaAsset(null);
    if (setUploadedFileName) setUploadedFileName("");

    let normalizedTemplate = { ...t };
    if (t && !t.components && t.content) {
      normalizedTemplate.components = [
        { type: "BODY", text: t.content }
      ];
    }

    setSelectedTemplate(normalizedTemplate);

    const body = normalizedTemplate?.components?.find((c: any) => c.type === "BODY")?.text;
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
    onTemplateSelect?.(normalizedTemplate);
  }

  function handleSessionTemplateSelect(t: any) {
    let normalizedTemplate = { ...t };
    if (t && !t.components && t.content) {
      normalizedTemplate.components = [
        { type: "BODY", text: t.content }
      ];
    }

    if (setSelectedSessionTemplate) setSelectedSessionTemplate(normalizedTemplate);

    const body = normalizedTemplate?.components?.find((c: any) => c.type === "BODY")?.text;
    if (body) {
      const vars = extractVariables(body);
      const mappings: VariableMapping[] = vars.map((v) => ({
        variable: `{{${v}}}`,
        isDynamic: allowDynamicFields ? true : false,
        contactField: allowDynamicFields ? (contactFieldOptions[0]?.value || "$firstName") : undefined,
        staticValue: "",
        fallbackValue: "",
      }));
      if (setSessionVariableMappings) setSessionVariableMappings(mappings);
      onSessionVariableMappingsChange?.(mappings);
    } else {
      if (setSessionVariableMappings) setSessionVariableMappings([]);
      onSessionVariableMappingsChange?.([]);
    }
    onSessionTemplateSelect?.(normalizedTemplate);
  }

  // Fetch templates
  const { data: templatesResp, isLoading: templatesLoading } = useTemplates(
    effectiveProjectId
  );

  // Fetch quick replies
  const { quickReplies, isLoading: quickRepliesLoading } = useQuickReplies(
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

  // Compute approved templates / quick replies
  const availableStandardTemplates = useMemo(() => {
    if (!Array.isArray(templatesResp?.data)) return [];
    return templatesResp?.data.filter(
      (t: any) => (t?.status || "").toUpperCase() !== "REJECTED"
    );
  }, [templatesResp]);

  const availableSessionTemplates = useMemo(() => {
    if (!Array.isArray(quickReplies)) return [];
    return quickReplies.map((qr: any) => ({
      ...qr,
      status: "APPROVED",
      category: "SESSION_TEMPLATE",
      components: qr.components && qr.components.length > 0
        ? qr.components
        : [{ type: "BODY", text: qr.content }],
    }));
  }, [quickReplies]);

  // Compute filtered templates
  const filteredStandardTemplates = useMemo(() => {
    const query = standardSearch.trim().toLowerCase();
    if (!query) return availableStandardTemplates;
    return availableStandardTemplates.filter((t: any) => {
      const name = (t?.name || "").toLowerCase();
      const category = (t?.category || "").toLowerCase();
      const body = (t?.components?.find((c: any) => c.type === "BODY")?.text || "").toLowerCase();
      return name.includes(query) || category.includes(query) || body.includes(query);
    });
  }, [availableStandardTemplates, standardSearch]);

  const filteredSessionTemplates = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return availableSessionTemplates;
    return availableSessionTemplates.filter((t: any) => {
      const name = (t?.name || "").toLowerCase();
      const category = (t?.category || "").toLowerCase();
      const body = (t?.components?.find((c: any) => c.type === "BODY")?.text || "").toLowerCase();
      return name.includes(query) || category.includes(query) || body.includes(query);
    });
  }, [availableSessionTemplates, sessionSearch]);

  // Compute validation flags
  const isTemplateMissing = !selectedTemplate && !selectedSessionTemplate;
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
  }, [mediaAssetsData, selectedTemplate, getHeaderFormat]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch p-4 sm:p-6">
      {/* Left: Configuration (Col 7) */}
      <div className="lg:col-span-7 space-y-6">

        {/* Beautiful Premium Tab Toggle Switch */}
        <div className="flex bg-slate-150/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 w-full shadow-inner">
          <button
            type="button"
            disabled={allowedTabs === "standard"}
            onClick={() => setPreviewType("session")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black rounded-xl uppercase tracking-widest transition-all duration-300 ${
              previewType === "session"
                ? "bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-md scale-[1.01]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            } ${allowedTabs === "standard" ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
          >
            <Zap className="h-4 w-4" />
            <span>Session Template</span>
            {selectedSessionTemplate && (
              <span className="ml-2 flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white animate-bounce-subtle shrink-0">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
          </button>
          
          <button
            type="button"
            disabled={allowedTabs === "session"}
            onClick={() => setPreviewType("standard")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black rounded-xl uppercase tracking-widest transition-all duration-300 ${
              previewType === "standard"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md scale-[1.01]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            } ${allowedTabs === "session" ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
          >
            <FileText className="h-4 w-4" />
            <span>Standard Fallback</span>
            {selectedTemplate && (
              <span className="ml-2 flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white animate-bounce-subtle shrink-0">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {previewType === "session" ? (
            <motion.div
              key="session-config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Section 1: Session Template (Primary Option) */}
              <Card className="rounded-3xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/40 py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white font-extrabold uppercase text-[10px] tracking-wide px-2 py-0.5 rounded-md">
                          ⚡ Session Template
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Option</span>
                      </div>
                    </div>
                    {selectedSessionTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="h-7 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 rounded-lg transition-all"
                        onClick={() => {
                          if (setSelectedSessionTemplate) setSelectedSessionTemplate(null);
                          if (setSessionVariableMappings) setSessionVariableMappings([]);
                          onSessionTemplateSelect?.(null);
                          onSessionVariableMappingsChange?.([]);
                        }}
                      >
                        Clear Option
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Popover Selection */}
                  <div className="space-y-2">
                    {quickRepliesLoading ? (
                      <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center px-4">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-slate-400">Loading session templates...</span>
                      </div>
                    ) : (
                      <Popover open={sessionPopoverOpen} onOpenChange={setSessionPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between h-12 bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 rounded-xl px-4 hover:bg-slate-50/50 transition-all"
                          >
                            <div className="flex items-center gap-3 overflow-hidden text-left">
                              <div className="h-6 w-6 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                                <Zap className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {selectedSessionTemplate?.name || "Choose a Session Template (Quick Reply)..."}
                              </span>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent disablePortal className="w-[--radix-popover-trigger-width] p-0 border-slate-200 dark:border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden z-[9999]" align="start">
                          <Command className="bg-white dark:bg-slate-800/50">
                            <CommandInput placeholder="Search templates..." className="h-12 border-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none" onValueChange={setSessionSearch} />
                            <CommandList className="max-h-[240px]">
                              <CommandEmpty className="py-6 text-center text-sm text-slate-400 font-medium">No templates found.</CommandEmpty>
                              <CommandGroup>
                                {filteredSessionTemplates.map((t: any) => (
                                  <CommandItem
                                    key={t._id || t.name}
                                    value={t.name}
                                    onSelect={() => {
                                      handleSessionTemplateSelect(t);
                                      setSessionPopoverOpen(false);
                                    }}
                                    className="cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                                  >
                                    <div className="flex flex-col gap-1 w-full text-left">
                                      <span className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</span>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{t.content}</p>
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

                  {/* Variable mappings for Session Template */}
                  {selectedSessionTemplate && sessionVariableMappings.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Code className="h-3 w-3" />
                        Session Variables Mapping
                      </Label>
                      <div className="space-y-4">
                        {sessionVariableMappings.map((vm, idx) => {
                          const isDynamic = !!vm.isDynamic;
                          const isValid = isVariableValid(vm);
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border transition-all text-left ${showValidationErrors && !isValid
                                ? "border-red-200 bg-red-50/10"
                                : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <Badge className="bg-slate-950 text-white font-extrabold text-[9px] px-1.5 h-4.5 rounded-md">
                                  {vm.variable}
                                </Badge>
                                {allowDynamicFields && (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dynamic</span>
                                    <input
                                      type="checkbox"
                                      checked={isDynamic}
                                      onChange={(e) => updateSessionMapping(idx, { isDynamic: e.target.checked })}
                                      className="h-3 w-3 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>

                              {allowDynamicFields && isDynamic ? (
                                <div className="space-y-3 text-left">
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Field</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-between h-10 bg-slate-50/50 dark:bg-slate-900/60 border-slate-250 dark:border-slate-800 rounded-lg px-3 text-xs font-bold"
                                        >
                                          <div className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            {contactFieldOptions.find((o) => o.value === vm.contactField)?.label || "Select field"}
                                          </div>
                                          <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent disablePortal className="w-[--radix-popover-trigger-width] p-0 border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden z-[9999]" align="start">
                                        <Command>
                                          <CommandList>
                                            <CommandGroup>
                                              {contactFieldOptions.map((option) => (
                                                <CommandItem
                                                  key={option.value}
                                                  value={option.value}
                                                  onSelect={() => {
                                                    updateSessionMapping(idx, { contactField: option.value });
                                                  }}
                                                  className="cursor-pointer p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                                                >
                                                  <div className="flex items-center justify-between w-full">
                                                    <span>{option.label}</span>
                                                    {vm.contactField === option.value && <Check className="h-3.5 w-3.5 text-green-600" />}
                                                  </div>
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
                                      onChange={(e) => updateSessionMapping(idx, { fallbackValue: e.target.value })}
                                      placeholder="Type fallback content..."
                                      className="h-10 bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs font-medium focus:ring-green-500"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 text-left">
                                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Static Value</Label>
                                  <Input
                                    value={vm.staticValue || ""}
                                    onChange={(e) => updateSessionMapping(idx, { staticValue: e.target.value })}
                                    placeholder="Enter static message value..."
                                    className="h-10 bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs font-medium focus:ring-green-500"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="standard-config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Section 2: Standard Template (Fallback Option) */}
              <Card className="rounded-3xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/40 py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold uppercase text-[10px] tracking-wide px-2 py-0.5 rounded-md">
                          🌐 Standard Fallback
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Template</span>
                      </div>
                    </div>
                    {selectedTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="h-7 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 rounded-lg transition-all"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setVariableMappings([]);
                          onTemplateSelect?.(null);
                          onVariableMappingsChange?.([]);
                        }}
                      >
                        Clear Option
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Popover Selection */}
                  <div className="space-y-2">
                    {templatesLoading ? (
                      <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center px-4">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-slate-400">Loading WABA templates...</span>
                      </div>
                    ) : (
                      <Popover open={standardPopoverOpen} onOpenChange={setStandardPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between h-12 bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 rounded-xl px-4 hover:bg-slate-50/50 transition-all"
                          >
                            <div className="flex items-center gap-3 overflow-hidden text-left">
                              <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <FileText className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {selectedTemplate?.name || "Choose a Standard Fallback Template..."}
                              </span>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent disablePortal className="w-[--radix-popover-trigger-width] p-0 border-slate-200 dark:border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden z-[9999]" align="start">
                          <Command className="bg-white dark:bg-slate-800/50">
                            <CommandInput placeholder="Search WABA templates..." className="h-12 border-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none" onValueChange={setStandardSearch} />
                            <CommandList className="max-h-[240px]">
                              <CommandEmpty className="py-6 text-center text-sm text-slate-400 font-medium">No templates found.</CommandEmpty>
                              <CommandGroup>
                                {filteredStandardTemplates.map((t: any) => (
                                  <CommandItem
                                    key={t._id || t.name}
                                    value={t.name}
                                    onSelect={() => {
                                      handleStandardTemplateSelect(t);
                                      setStandardPopoverOpen(false);
                                    }}
                                    className="cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                                  >
                                    <div className="flex flex-col gap-1 w-full text-left">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</span>
                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] uppercase font-black">{t.language}</Badge>
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{t.category}</p>
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

                  {/* Media Upload (If required by Standard WABA Template Header) */}
                  <AnimatePresence>
                    {showHeaderMedia && selectedTemplate && hasMediaHeader(selectedTemplate) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden text-left"
                      >
                        <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <ImageIcon className="h-3 w-3" />
                          Header File required ({getHeaderFormat(selectedTemplate)?.toLowerCase()})
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
                            className="w-full justify-between h-12 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl px-4 hover:bg-slate-50/50 transition-all"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <ImageIcon className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {uploadedFileName || selectedMediaAsset?.fileName || `Upload ${getHeaderFormat(selectedTemplate)?.toLowerCase()}...`}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </Button>
                        </MediaFileDialog>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Variable mappings for WABA Fallback Template */}
                  {selectedTemplate && variableMappings.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Code className="h-3 w-3" />
                        Fallback Variables Mapping
                      </Label>
                      <div className="space-y-4">
                        {variableMappings.map((vm, idx) => {
                          const isDynamic = !!vm.isDynamic;
                          const isValid = isVariableValid(vm);
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border transition-all text-left ${showValidationErrors && !isValid
                                ? "border-red-200 bg-red-50/10"
                                : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <Badge className="bg-slate-950 text-white font-extrabold text-[9px] px-1.5 h-4.5 rounded-md">
                                  {vm.variable}
                                </Badge>
                                {allowDynamicFields && (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dynamic</span>
                                    <input
                                      type="checkbox"
                                      checked={isDynamic}
                                      onChange={(e) => updateStandardMapping(idx, { isDynamic: e.target.checked })}
                                      className="h-3 w-3 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                    />
                                  </div>
                                )}
                              </div>

                              {allowDynamicFields && isDynamic ? (
                                <div className="space-y-3 text-left">
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Field</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-between h-10 bg-slate-50/50 dark:bg-slate-900/60 border-slate-250 dark:border-slate-800 rounded-lg px-3 text-xs font-bold"
                                        >
                                          <div className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            {contactFieldOptions.find((o) => o.value === vm.contactField)?.label || "Select field"}
                                          </div>
                                          <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent disablePortal className="w-[--radix-popover-trigger-width] p-0 border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden z-[9999]" align="start">
                                        <Command>
                                          <CommandList>
                                            <CommandGroup>
                                              {contactFieldOptions.map((option) => (
                                                <CommandItem
                                                  key={option.value}
                                                  value={option.value}
                                                  onSelect={() => {
                                                    updateStandardMapping(idx, { contactField: option.value });
                                                  }}
                                                  className="cursor-pointer p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                                                >
                                                  <div className="flex items-center justify-between w-full">
                                                    <span>{option.label}</span>
                                                    {vm.contactField === option.value && <Check className="h-3.5 w-3.5 text-green-600" />}
                                                  </div>
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
                                      onChange={(e) => updateStandardMapping(idx, { fallbackValue: e.target.value })}
                                      placeholder="Type fallback content..."
                                      className="h-10 bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs font-medium focus:ring-green-500"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 text-left">
                                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Static Value</Label>
                                  <Input
                                    value={vm.staticValue || ""}
                                    onChange={(e) => updateStandardMapping(idx, { staticValue: e.target.value })}
                                    placeholder="Enter static message value..."
                                    className="h-10 bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs font-medium focus:ring-green-500"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Template Preview (Col 5) */}
      <div className="lg:col-span-5">
        <div className="sticky top-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Real-time Preview</h2>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-slate-900/5 blur-3xl -z-10 rounded-full scale-75" />

            {showPreview && ((previewType === "session" && selectedSessionTemplate) || (previewType === "standard" && selectedTemplate)) ? (
              <motion.div
                key={previewType}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex justify-center"
              >
                {previewType === "session" && selectedSessionTemplate ? (
                  (() => {
                    const previewMappings = (sessionVariableMappings || []).map((vm) => ({
                      variable: vm.variable,
                      contactField: vm.contactField ?? contactFieldOptions[0]?.value ?? "$firstName",
                      isDynamic: vm.isDynamic,
                      staticValue: vm.staticValue ?? "",
                      fallbackValue: vm.fallbackValue ?? "",
                    }));
                    return (
                      <WhatsAppTemplatePreviewCard
                        template={selectedSessionTemplate}
                        variableMappings={previewMappings}
                        showSampleContact={true}
                        showVariableMappings={true}
                        className="w-full"
                      />
                    );
                  })()
                ) : (
                  (() => {
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
                  })()
                )}
              </motion.div>
            ) : (
              <div className="h-[400px] rounded-[32px] border-4 border-dashed border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 bg-white dark:bg-slate-800/50 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-200 mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No Template Selected</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Choose a template from the list to see how it will look on your customers' phones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}