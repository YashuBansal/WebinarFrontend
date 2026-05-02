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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            API Execution Details
          </DialogTitle>
          <DialogDescription>
            Use this endpoint and payload from your external system to create a
            program assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Create Assignment Endpoint
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  HTTP method: <span className="font-mono">POST</span>
                </p>
                <p className="text-sm break-all font-mono">
                  {assignmentEndpointUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyToClipboard(assignmentEndpointUrl, "Endpoint URL")
                }
                className="flex items-center gap-2 shrink-0"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Sample JSON payload (create)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyToClipboard(
                    sampleAssignmentPayloadString,
                    "Sample JSON",
                  )
                }
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="rounded-md bg-muted p-4 overflow-auto max-h-80">
              <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-words">
                {sampleAssignmentPayloadString}
              </pre>
            </div>

            {requiredVariables?.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Required variables for this sequence:{" "}
                <span className="font-mono">
                  {requiredVariables.join(", ")}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No required variables detected from this sequence’s template
                mappings.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Note: the assignment will be created for the program name under
              your authenticated admin account. If an assignment for this phone
              already exists for this program, the API returns 409.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cancel Assignment Endpoint
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  HTTP method: <span className="font-mono">POST</span>
                </p>
                <p className="text-sm break-all font-mono">
                  {cancelAssignmentEndpointUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyToClipboard(
                    cancelAssignmentEndpointUrl,
                    "Cancel endpoint URL",
                  )
                }
                className="flex items-center gap-2 shrink-0"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Sample JSON payload (cancel)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyToClipboard(
                    sampleCancelPayloadString,
                    "Cancel sample JSON",
                  )
                }
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="rounded-md bg-muted p-4 overflow-auto max-h-80">
              <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-words">
                {sampleCancelPayloadString}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              This endpoint cancels the assignment for the given{" "}
              <span className="font-mono">programName</span> and{" "}
              <span className="font-mono">phone</span> under your authenticated
              admin account. If no such assignment exists, it returns 404.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

