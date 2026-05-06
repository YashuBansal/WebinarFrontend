import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ListTodo,
  FileText,
  Calendar,
  Clock,
  ListTree,
  Zap,
  Settings,
  Activity,
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">Missing Context</AlertTitle>
          <AlertDescription className="text-slate-600 font-medium">
            Please select a project and a valid sequence to view details.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (programLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
            <Loader2 className="h-6 w-6 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest animate-pulse">Loading sequence details...</p>
        </div>
      </div>
    );
  }

  if (programError || !program) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">Error Loading Sequence</AlertTitle>
          <AlertDescription className="text-slate-600 font-medium">
            Failed to load sequence details. It may not exist or you don't have access.
          </AlertDescription>
          <Link to={`/whatsapp/dashboard/${projectId}/programs`} className="mt-6 block">
            <Button variant="outline" className="w-full rounded-xl border-slate-200">Back to Sequences</Button>
          </Link>
        </Alert>
      </div>
    );
  }

  const isProgramCancelled = !program.isActive || program.isDeleted;

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
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link
                to={`/whatsapp/dashboard/${projectId}/programs`}
                className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
                  <ListTree className="h-3 w-3" />
                  Sequence Analytics
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
                  {program.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-slate-600" />
                    {formatInterval(program)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                    {getTotalOccurrenceCount(program)} Occurrences
                  </div>
                  <div className="flex items-center gap-2">
                    {program.isDeleted ? (
                      <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                        Cancelled
                      </Badge>
                    ) : program.isActive ? (
                      <Badge className="bg-green-50 text-green-600 border-green-100 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setApiDialogOpen(true)}
              className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all active:scale-[0.98] shadow-sm"
            >
              <FileText className="h-4 w-4" />
              API Details
            </Button>
            <Link to={`/whatsapp/dashboard/${projectId}/programs/${programId}/edit`}>
              <Button
                disabled={program.isDeleted}
                className="h-11 px-6 rounded-xl flex items-center gap-2 text-white font-bold text-sm shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "#22B573" }}
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-8 pb-20">
        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sequence Timeline</span>
            </div>
            <ProgramTimeSlotsCard program={program} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Assignments</span>
            </div>
            <ProgramAssignmentsSection programId={programId} program={program} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                <Settings className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Automation Rules</span>
            </div>
            <AutoAssignRuleBuilder
              isAutoAssignable={isAutoAssignable}
              onAutoAssignableChange={setIsAutoAssignable}
              criteria={autoAssignCriteria}
              onCriteriaChange={setAutoAssignCriteria}
              onSave={handleSaveAutoAssignRules}
              isSaving={updateProgramMutation.isPending}
              disabled={isProgramCancelled}
            />
          </motion.section>
        </div>
      </main>

      <ProgramApiExecutionDetailsDialog
        open={apiDialogOpen}
        onOpenChange={setApiDialogOpen}
        programName={program.name}
        requiredVariables={requiredVariables}
      />
    </div>
  );
}
