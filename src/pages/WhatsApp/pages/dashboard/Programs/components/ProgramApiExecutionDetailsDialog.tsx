import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toastUtils } from "@/lib/utils";
import { Copy, FileText } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string;
  requiredVariables: string[];
};

export function ProgramApiExecutionDetailsDialog({
  open,
  onOpenChange,
  programName,
  requiredVariables,
}: Props) {
  const assignmentEndpointUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
    return baseUrl
      ? `${baseUrl}/whatsapp-program/assignments/by-name`
      : "/whatsapp-program/assignments/by-name";
  }, []);

  const cancelAssignmentEndpointUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
    return baseUrl
      ? `${baseUrl}/whatsapp-program/assignments/cancel-by-name`
      : "/whatsapp-program/assignments/cancel-by-name";
  }, []);

  const sampleAssignmentPayloadString = useMemo(() => {
    const variablesObj =
      requiredVariables?.length > 0
        ? Object.fromEntries(requiredVariables.map((k) => [k, ""]))
        : {};

    const samplePayload: any = {
      programName: programName ?? "",
      phone: "919999999999",
    };

    if (Object.keys(variablesObj).length > 0) {
      samplePayload.variables = variablesObj;
    }

    return JSON.stringify(samplePayload, null, 2);
  }, [programName, requiredVariables]);

  const sampleCancelPayloadString = useMemo(() => {
    const samplePayload = {
      programName: programName ?? "",
      phone: "919999999999",
    };
    return JSON.stringify(samplePayload, null, 2);
  }, [programName]);

  const handleCopyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastUtils.success(`${label} copied to clipboard`);
    } catch (copyError) {
      console.error("Copy failed", copyError);
      toastUtils.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                  API Integration
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500 mt-0.5">
                  Automate sequence assignments from your external systems
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-10">
            {/* Create Assignment Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create Assignment</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="p-5 rounded-[24px] border border-slate-100 bg-slate-50/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-green-50 text-[9px] font-black text-green-600 border border-green-100 uppercase tracking-widest">POST</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Endpoint URL</span>
                    </div>
                    <p className="text-xs font-mono text-slate-600 break-all bg-white p-3 rounded-xl border border-slate-100/50">
                      {assignmentEndpointUrl}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(assignmentEndpointUrl, "Endpoint URL")}
                    className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white transition-all shadow-sm shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample Payload</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(sampleAssignmentPayloadString, "Sample JSON")}
                      className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-white transition-all"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-5 overflow-auto max-h-64 shadow-inner">
                    <pre className="text-[11px] sm:text-xs font-mono text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                      {sampleAssignmentPayloadString}
                    </pre>
                  </div>
                </div>

                {requiredVariables?.length > 0 ? (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 text-blue-600">
                    <div className="text-[10px] font-black uppercase tracking-widest mt-0.5 shrink-0">Required:</div>
                    <div className="text-[11px] font-mono break-all font-bold">
                      {requiredVariables.join(", ")}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-slate-400 italic px-1">
                    No body variables required for this sequence.
                  </div>
                )}
              </div>
            </section>

            {/* Cancel Assignment Section */}
            <section className="space-y-4 pb-4">
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel Assignment</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="p-5 rounded-[24px] border border-slate-100 bg-slate-50/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-[9px] font-black text-red-600 border border-red-100 uppercase tracking-widest">POST</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Endpoint URL</span>
                    </div>
                    <p className="text-xs font-mono text-slate-600 break-all bg-white p-3 rounded-xl border border-slate-100/50">
                      {cancelAssignmentEndpointUrl}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(cancelAssignmentEndpointUrl, "Cancel endpoint URL")}
                    className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white transition-all shadow-sm shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample Payload</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(sampleCancelPayloadString, "Cancel sample JSON")}
                      className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-white transition-all"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-5 overflow-auto max-h-64 shadow-inner">
                    <pre className="text-[11px] sm:text-xs font-mono text-red-300/80 whitespace-pre-wrap break-words leading-relaxed">
                      {sampleCancelPayloadString}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
