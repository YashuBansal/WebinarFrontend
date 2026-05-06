import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useProjectContext } from '@/context/ProjectContext';
import { usePrograms, useDeleteProgram } from '@/hooks/usePrograms';
import type { Program } from '@/schemas/programSchema';
// @ts-ignore
import ConfirmDeleteModal from '../../../../../components/ConfirmDeleteModal';

const LIMIT = 10;

export default function Programs() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    program: Program | null;
  }>({
    isOpen: false,
    program: null,
  });

  const { data, isLoading, error, refetch } = usePrograms(
    selectedProject?._id ?? '',
    currentPage,
    LIMIT
  );
  const deleteProgramMutation = useDeleteProgram();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteProgram = (program: Program) => {
    setDeleteModal({
      isOpen: true,
      program,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.program) return;
    try {
      await deleteProgramMutation.mutateAsync(deleteModal.program._id);
      setDeleteModal({ isOpen: false, program: null });
    } catch (err) {
      console.error('Delete sequence failed:', err);
    }
  };

  const WEEKDAY_NAMES: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };

  const formatInterval = (p: Program) => {
    if (p.intervalUnit === 'week') {
      if (p.weekdays?.length) {
        const names = p.weekdays.map((d) => WEEKDAY_NAMES[d]).filter(Boolean);
        return names.length
          ? `${p.occurrenceCount} week(s) × ${names.join(', ')}`
          : `${p.intervalValue} ${p.intervalUnit}`;
      }
      if (p.intervalValue >= 1 && p.intervalValue <= 7) {
        return `Every ${WEEKDAY_NAMES[p.intervalValue]}`;
      }
    }
    return `${p.intervalValue} ${p.intervalUnit}${p.intervalValue !== 1 ? 's' : ''}`;
  };

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-600 font-medium">
            Please select a project to manage its sequences.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
            <Loader2 className="h-6 w-6 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest animate-pulse">Loading sequences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">Error Loading Sequences</AlertTitle>
          <AlertDescription className="text-slate-600 font-medium">
            {error.message || 'Something went wrong while fetching your sequences.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const programs = data?.programs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

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
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
              <ListTree className="h-3 w-3" />
              Automated Workflows
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
              Sequences
            </h1>
            <p className="text-slate-600 text-xs font-medium">
              Schedule recurring messages and automate your communication for <span className="text-slate-900 font-bold">{selectedProject?.projectName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="h-10 px-4 rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all active:scale-[0.98]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to={`/whatsapp/dashboard/${projectId}/programs/create`}>
              <Button
                className="h-10 px-5 rounded-xl flex items-center gap-2 text-white font-bold text-xs shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "#22B573" }}
              >
                <Plus className="w-4 h-4" />
                Create Sequence
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-2xl transition-all duration-300 overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-green-600 transition-colors">
                  <ListTodo className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sequence Management</span>
              </div>
            </div>

            {programs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 rounded-[20px] border-2 border-dashed border-slate-100 bg-slate-50/30">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                  <ListTree className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">No sequences found</h3>
                <p className="text-slate-600 text-xs font-medium mb-6 text-center max-w-xs">Start by creating your first automated sequence to streamline your communication.</p>
                <Link to={`/whatsapp/dashboard/${projectId}/programs/create`}>
                  <Button className="h-10 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-lg shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Sequence
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-600 pl-6">Sequence Details</TableHead>
                        <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-600">Schedule Info</TableHead>
                        <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Status</TableHead>
                        <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow key={program._id} className="group/row hover:bg-slate-50/50 border-slate-100 transition-colors">
                          <TableCell className="py-5 pl-6">
                            <div className="flex items-center gap-4">
                              <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover/row:text-green-600 group-hover/row:bg-green-50 group-hover/row:border-green-100 transition-all">
                                <ListTree className="h-5 w-5" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 text-sm tracking-tight">{program.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    {(program.occurrenceTimeSlots ?? []).reduce((sum, s) => sum + (s?.length ?? 0), 0)} Slots
                                  </span>
                                  {program.isAutoAssignable && (
                                    <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 rounded-md py-0 px-1.5 h-4 text-[8px] font-black uppercase tracking-widest">
                                      Auto-Assign
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                                <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                {formatInterval(program)}
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 font-black text-[9px] uppercase tracking-widest">
                                <Clock className="h-3 w-3" />
                                {program.occurrenceCount} Occurrences
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center">
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
                          </TableCell>
                          <TableCell className="py-5 text-right pr-6">
                            <div className="flex justify-end items-center gap-2">
                              <Link to={`/whatsapp/dashboard/${projectId}/programs/${program._id}`}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl border-slate-200 text-slate-600 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all shadow-sm"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to={`/whatsapp/dashboard/${projectId}/programs/${program._id}/edit`}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={program.isDeleted}
                                  className={`h-9 w-9 rounded-xl border-slate-200 text-slate-600 transition-all shadow-sm ${program.isDeleted
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                                    }`}
                                  title={program.isDeleted ? "Cannot edit cancelled sequence" : "Edit sequence"}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteProgram(program)}
                                disabled={program.isDeleted || deleteProgramMutation.isPending}
                                className={`h-9 w-9 rounded-xl border-slate-200 text-slate-600 transition-all shadow-sm ${program.isDeleted || deleteProgramMutation.isPending
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                                  }`}
                                title={program.isDeleted ? 'Sequence is already cancelled' : 'Cancel sequence'}
                              >
                                {deleteProgramMutation.isPending && program._id === deleteProgramMutation.variables ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Premium Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 px-2">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Page <span className="text-slate-900 font-extrabold">{currentPage}</span> of <span className="text-slate-900 font-extrabold">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-[0.95] disabled:opacity-50 shadow-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-[0.95] disabled:opacity-50 shadow-sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </main>

      {deleteModal.isOpen && deleteModal.program && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) setDeleteModal({ isOpen: false, program: null });
          }}
          triggerDelete={handleConfirmDelete}
          title="Cancel Sequence"
          isLoading={deleteProgramMutation.isPending}
          itemName={deleteModal.program.name}
        />
      )}
    </div>
  );
}
