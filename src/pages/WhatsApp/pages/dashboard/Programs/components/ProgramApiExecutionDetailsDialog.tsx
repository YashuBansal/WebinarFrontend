import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toastUtils } from "@/lib/utils";
import { Copy, FileText, X } from "lucide-react";

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
      <DialogContent 
        className="max-w-2xl max-h-[90vh] border-0 bg-transparent p-0 shadow-none outline-none"
        showCloseButton={false}
      >
        <div className="relative w-full rounded-2xl p-6 shadow-2xl flex flex-col bg-white border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              API Integration Details
            </h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2 mb-6">
            {/* Create Assignment Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Create Assignment</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-green-50 text-[9px] font-black text-green-600 border border-green-100 uppercase tracking-widest">POST</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Endpoint URL</span>
                    </div>
                    <p className="text-xs font-mono text-slate-600 break-all bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {assignmentEndpointUrl}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(assignmentEndpointUrl, "Endpoint URL")}
                    className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Sample Payload</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(sampleAssignmentPayloadString, "Sample JSON")}
                      className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-5 overflow-auto max-h-48 shadow-inner">
                    <pre className="text-[11px] font-mono text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                      {sampleAssignmentPayloadString}
                    </pre>
                  </div>
                </div>

                {requiredVariables?.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-600">
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Required Variables:</span>
                    <div className="text-[11px] font-mono break-all font-bold">
                      {requiredVariables.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Cancel Assignment Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Cancel Assignment</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-[9px] font-black text-red-600 border border-red-100 uppercase tracking-widest">POST</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Endpoint URL</span>
                    </div>
                    <p className="text-xs font-mono text-slate-600 break-all bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {cancelAssignmentEndpointUrl}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(cancelAssignmentEndpointUrl, "Cancel endpoint URL")}
                    className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Sample Payload</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(sampleCancelPayloadString, "Cancel sample JSON")}
                      className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-5 overflow-auto max-h-48 shadow-inner">
                    <pre className="text-[11px] font-mono text-red-300/80 whitespace-pre-wrap break-words leading-relaxed">
                      {sampleCancelPayloadString}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-8 py-2.5 font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20 transition-all"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
