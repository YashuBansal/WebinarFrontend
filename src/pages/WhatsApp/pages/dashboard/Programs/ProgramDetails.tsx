import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ListTodo,
  FileText,
  // Pencil,
} from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { useProgramById, useUpdateProgram } from "@/hooks/usePrograms";
import { getTotalOccurrenceCount } from "@/schemas/programSchema";
import { ProgramAssignmentsSection } from "./components/ProgramAssignmentsSection";
import { ProgramTimeSlotsCard } from "./components/ProgramTimeSlotsCard";
import { AutoAssignRuleBuilder } from "./components/AutoAssignRuleBuilder";
import { ProgramApiExecutionDetailsDialog } from "./components/ProgramApiExecutionDetailsDialog";
import type { AutoAssignCriteriaPayload } from "./components/AutoAssignRuleBuilder";
import { toastUtils } from "@/lib/utils";

export default function ProgramDetails() {
  const { projectId, programId } = useParams<{
    projectId: string;
    programId: string;
  }>();
  const { selectedProject } = useProjectContext();

  const {
    data: program,
    isLoading: programLoading,
    error: programError,
  } = useProgramById(programId ?? "");

  const updateProgramMutation = useUpdateProgram();

  const [isAutoAssignable, setIsAutoAssignable] = useState(false);
  const [autoAssignCriteria, setAutoAssignCriteria] =
    useState<AutoAssignCriteriaPayload | null>(null);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);

  // Sync state when program loads
  useEffect(() => {
    if (program) {
      setIsAutoAssignable(program.isAutoAssignable ?? false);
      setAutoAssignCriteria((program.autoAssignCriteria as any) ?? null);
    }
  }, [program]);

  const requiredVariables = useMemo(() => {
    if(!program || !Array.isArray(program.occurrenceTimeSlots)) return [];
    const variables = new Set<string>();
    program.occurrenceTimeSlots.forEach((occurrence) => {
      if(!Array.isArray(occurrence)) return;

      occurrence.forEach((slot) => {
        if(!slot || !slot?.messageConfig || slot.messageConfig?.messageType !== 'template' || !Array.isArray(slot.messageConfig.variableMappings) || slot.messageConfig.variableMappings.length === 0) return;

        slot.messageConfig.variableMappings.forEach((mapping) => {
          if(mapping.isDynamic && mapping.contactField) {
            const raw = String(mapping.contactField).trim();
            const cleaned = raw.startsWith("$") ? raw.slice(1) : raw;
            if (cleaned) variables.add(cleaned);
          }
        })

      })
    })

    return Array.from(variables);
  },[program]);

  const handleSaveAutoAssignRules = async () => {
    if (!programId) return;

    if (isAutoAssignable) {
      if (
        !autoAssignCriteria ||
        autoAssignCriteria.webinarIds.length === 0 ||
        autoAssignCriteria.isAttended === null
      ) {
        toastUtils.error(
          "Please configure the auto-assign rules (select a webinar and attendance status).",
        );
        return;
      }
    }

    try {
      await updateProgramMutation.mutateAsync({
        programId,
        payload: {
          isAutoAssignable,
          autoAssignCriteria: isAutoAssignable ? autoAssignCriteria : null,
        } as any, // Type cast to bypass partial UpdateProgramDto strictness
      });
      toastUtils.success("Auto-assign rules updated.");
    } catch (err) {
      console.error(err);
    }
  };

  const WEEKDAY_NAMES: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
  };
  const formatInterval = (p: NonNullable<typeof program>) => {
    if (p.intervalUnit === "week") {
      if (p.weekdays?.length) {
        const names = p.weekdays.map((d) => WEEKDAY_NAMES[d]).filter(Boolean);
        return names.length
          ? `${p.occurrenceCount} week(s) × ${names.join(", ")}`
          : `${p.intervalValue} ${p.intervalUnit}`;
      }
      if (p.intervalValue >= 1 && p.intervalValue <= 7) {
        return `Every ${WEEKDAY_NAMES[p.intervalValue]}`;
      }
    }
    return `${p.intervalValue} ${p.intervalUnit}${p.intervalValue !== 1 ? "s" : ""}`;
  };

  if (!programId || !selectedProject) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Missing project or program.</p>
      </div>
    );
  }

  if (programLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (programError || !program) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load program. It may not exist or you don&apos;t have
            access.
          </AlertDescription>
        </Alert>
        <Link to={`/whatsapp/dashboard/${projectId}/programs`}>
          <Button variant="outline" className="mt-4">
            Back to Sequences
          </Button>
        </Link>
      </div>
    );
  }

  const isProgramCancelled = !program.isActive || program.isDeleted;

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <Link to={`/whatsapp/dashboard/${projectId}/programs`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sequences
          </Button>
        </Link>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setApiDialogOpen(true)}
          >
            <FileText className="h-4 w-4" />
            API
          </Button>
        </div>
        {/* <Link to={`/whatsapp/dashboard/${projectId}/programs/${programId}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            {program.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Interval:</span>{" "}
            {formatInterval(program)} ·{" "}
            <span className="font-medium">Occurrences:</span>{" "}
            {getTotalOccurrenceCount(program)} total
            {" · "}
            <span className="font-medium">Time slots:</span>{" "}
            {(program.occurrenceTimeSlots ?? []).reduce(
              (sum, slots) => sum + (slots?.length ?? 0),
              0,
            )}{" "}
            total across occurrences
          </p>
          <div>
            {program.isActive ? (
              <Badge className="bg-green-600">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <ProgramTimeSlotsCard program={program} />

      <ProgramApiExecutionDetailsDialog
        open={apiDialogOpen}
        onOpenChange={setApiDialogOpen}
        programName={program.name}
        requiredVariables={requiredVariables}
      />

      <div className="space-y-4">
        <AutoAssignRuleBuilder
          isAutoAssignable={isAutoAssignable}
          onAutoAssignableChange={setIsAutoAssignable}
          criteria={autoAssignCriteria}
          onCriteriaChange={setAutoAssignCriteria}
          onSave={handleSaveAutoAssignRules}
          isSaving={updateProgramMutation.isPending}
          disabled={isProgramCancelled}
        />
      </div>

      <ProgramAssignmentsSection programId={programId} program={program} />
    </div>
  );
}

