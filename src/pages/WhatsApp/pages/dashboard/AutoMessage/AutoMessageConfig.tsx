import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type VariableMapping } from "@/api/modules/autoMessage";
import { toast } from "sonner";
import { useUpsertAutoMessageConfig } from "@/hooks/useAutoMessageConfigs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronsUpDown,
  Check,
  ArrowLeft,
  Calendar,
  Loader2,
  XCircle,
  Save,
  MessageSquare,
  Sparkles,
  Info
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
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [webinarDropdownOpen, setWebinarDropdownOpen] = useState(false);

  const {
    data: webinarsData,
    isLoading: webinarsLoading,
    error: webinarsError,
  } = useWebinars();
  const webinars = webinarsData || [];

  const { mutate: upsertConfig, isPending: saving } = useUpsertAutoMessageConfig();

  const selectedWebinar = useMemo(
    () => webinars.find((w: any) => w._id === webinarId),
    [webinars, webinarId]
  );

  function hasMediaHeader(template: any): boolean {
    if (!template) return false;
    const header = template.components?.find((c: any) => c.type === "HEADER");
    return !!header && ["IMAGE", "VIDEO", "DOCUMENT"].includes((header as any).format);
  }

  function getHeaderFormat(template: any): string | null {
    if (!template) return null;
    const header = template.components?.find((c: any) => c.type === "HEADER");
    return (header as any)?.format || null;
  }

  function isVariableValid(vm: VariableMapping): boolean {
    if (vm.isDynamic) {
      return !!(vm.contactField && vm.contactField.trim()) && !!(vm.fallbackValue && vm.fallbackValue.trim());
    }
    return !!(vm.staticValue && vm.staticValue.trim());
  }

  const isWebinarIdMissing = !webinarId.trim();
  const isTemplateMissing = !selectedTemplate;
  const hasInvalidVariables = variableMappings.length > 0 && variableMappings.some((vm) => !isVariableValid(vm));
  const isMediaRequiredMissing = selectedTemplate && hasMediaHeader(selectedTemplate) && !selectedMediaAsset;

  function handleSave() {
    setShowValidationErrors(true);
    if (!projectId) return;
    if (isWebinarIdMissing) return toast.error("Select a webinar");
    if (isTemplateMissing) return toast.error("Select a template");
    if (hasInvalidVariables) return toast.error("Fill all template variables (static or contact+fallback)");
    if (isMediaRequiredMissing) return toast.error(`Select a ${getHeaderFormat(selectedTemplate)?.toLowerCase()} file for this template header`);

    upsertConfig(
      {
        projectId,
        webinarId,
        templateName: selectedTemplate?.name || "",
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

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/whatsapp/dashboard/${projectId}/auto-message`)}
              className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all text-slate-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                Configuration
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Auto Message Setup
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Automate WhatsApp responses for <span className="text-slate-900 font-bold">New Registrations</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-8 rounded-xl flex items-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-sm shadow-lg shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Main Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[20px] p-6 sm:p-8 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-green-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-xl font-black text-slate-900">Message Content</h2>
              <p className="text-slate-500 text-xs font-medium mt-1">Select a template and map its variables to registration data</p>
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
              projectId={projectId}
              showValidationErrors={showValidationErrors}
            />
          </div>
        </motion.div>

        {/* Trigger Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[20px] p-6 sm:p-8 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-blue-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-xl font-black text-slate-900">Trigger Conditions</h2>
              <p className="text-slate-500 text-xs font-medium mt-1">Define which webinar registration should trigger this message</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Select Target Webinar
                  {showValidationErrors && isWebinarIdMissing && (
                    <span className="text-red-500 font-black ml-1">(Required)</span>
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
                      className={`w-full justify-between h-12 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-left font-medium ${showValidationErrors && isWebinarIdMissing ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                      disabled={webinarsLoading}
                    >
                      {selectedWebinar ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-green-600">
                            <Calendar className="h-4 w-4 shrink-0" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {selectedWebinar.webinarName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              {formatDateTime12(selectedWebinar.webinarDate)}
                            </span>
                          </div>
                        </div>
                      ) : webinarsLoading ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading webinars...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Choose a webinar...</span>
                        </div>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 rounded-2xl overflow-hidden border-slate-200 shadow-2xl" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search webinars..." className="h-12 border-none ring-0 focus:ring-0" />
                      <CommandList className="max-h-64 overflow-auto custom-scrollbar">
                        <CommandEmpty className="p-4 text-center text-slate-400 text-sm font-medium">No webinars found.</CommandEmpty>
                        <CommandGroup className="p-2">
                          {webinars && webinars.length > 0 ? (
                            webinars.slice().reverse().map((webinar: any) => (
                              <CommandItem
                                key={webinar._id}
                                value={webinar.webinarName}
                                onSelect={() => {
                                  setWebinarId(webinar._id);
                                  setWebinarDropdownOpen(false);
                                }}
                                className="cursor-pointer py-3 px-4 rounded-xl hover:bg-slate-50 aria-selected:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-bold text-slate-900 text-sm">
                                      {webinar.webinarName}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      {formatDateTime12(webinar.webinarDate)}
                                    </span>
                                  </div>
                                  <Check
                                    className={`ml-2 h-4 w-4 text-green-600 transition-opacity ${webinarId === webinar._id ? "opacity-100" : "opacity-0"
                                      }`}
                                  />
                                </div>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              No webinars available
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4 items-start">
                <div className="h-8 w-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-blue-700 leading-relaxed">
                  Messages will be sent <span className="font-bold underline underline-offset-2">instantly</span> to the phone number provided during registration. Ensure your WhatsApp API is active.
                </p>
              </div>
            </div>

            {webinarsError && (
              <Alert variant="destructive" className="mt-6 rounded-2xl border-none bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800 font-bold">Data Error</AlertTitle>
                <AlertDescription className="text-red-700 font-medium">
                  Failed to load webinars. Please check your connection and try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

