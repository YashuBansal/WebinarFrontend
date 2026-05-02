import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ListTodo,
} from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { usePrograms, useDeleteProgram } from '@/hooks/usePrograms';
import type { Program } from '@/schemas/programSchema';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const LIMIT = 10;

export default function Programs() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    variant: 'destructive' as const,
    onConfirm: () => {},
    isLoading: false,
  });

  const { data, isLoading, error, refetch } = usePrograms(
    selectedProject?._id ?? '',
    currentPage,
    LIMIT
  );
  const deleteProgramMutation = useDeleteProgram();

  const showConfirmationDialog = (
    title: string,
    description: string,
    onConfirm: () => void
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      description,
      variant: 'destructive',
      onConfirm,
      isLoading: false,
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  };

  const handleConfirmationConfirm = async () => {
    setConfirmationDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await confirmationDialog.onConfirm();
      closeConfirmationDialog();
    } catch (err) {
      console.error('Confirmation action failed:', err);
      setConfirmationDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteProgram = (program: Program) => {
    showConfirmationDialog(
      'Cancel Sequence',
      `Are you sure you want to cancel "${program.name}"? This action is irreversible. All un-triggered assignments will also be cancelled.`,
      () => deleteProgramMutation.mutateAsync(program._id)
    );
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
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertDescription>Please select a project to view programs.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load programs. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const programs = data?.programs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Sequences
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">
              Project: {selectedProject?.projectName ?? 'Unknown'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-end">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link to={`/whatsapp/dashboard/${projectId}/programs/create`}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Sequence
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg flex-1">
            <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a program to schedule recurring messages to contacts.
            </p>
            <Link to={`/whatsapp/dashboard/${projectId}/programs/create`}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Sequence
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Occurrences
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Interval
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {programs.map((program) => (
                    <tr
                      key={program._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {program.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {(program.occurrenceTimeSlots ?? []).reduce((sum, s) => sum + (s?.length ?? 0), 0)} time slot(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {program.occurrenceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatInterval(program)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {program.isDeleted ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Cancelled
                          </Badge>
                        ) : program.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/whatsapp/dashboard/${projectId}/programs/${program._id}`}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {program.isDeleted ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Edit is not available for cancelled programs"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Link
                              to={`/whatsapp/dashboard/${projectId}/programs/${program._id}/edit`}
                            >
                              <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProgram(program)}
                              disabled={program.isDeleted || deleteProgramMutation.isPending}
                              title={program.isDeleted ? 'Sequence is already cancelled' : undefined}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 items-center flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        variant={confirmationDialog.variant}
        isLoading={confirmationDialog.isLoading}
        confirmText="Cancel Sequence"
      />
    </div>
  );
}

