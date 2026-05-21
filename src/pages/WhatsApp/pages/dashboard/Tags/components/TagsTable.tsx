import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Edit, Trash2, Search, Tag, Calendar } from 'lucide-react';
import type { WabaTag } from '@/schemas/tagSchema';
import ConfirmDeleteModal from '../../../../../../components/ConfirmDeleteModal';
import { Skeleton } from '@/components/ui/skeleton';

interface TagsTableProps {
  tags: WabaTag[];
  isLoading: boolean;
  isDeleting?: boolean;
  onEdit: (tag: WabaTag) => void;
  onDelete: (tagId: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function TagsTable({
  tags,
  isLoading,
  isDeleting = false,
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
}: TagsTableProps) {
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; tag: WabaTag | null }>({
    isOpen: false,
    tag: null,
  });

  const handleDeleteClick = (tag: WabaTag) => {
    setDeleteConfirmState({ isOpen: true, tag });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmState.tag) {
      onDelete(deleteConfirmState.tag._id);
      setDeleteConfirmState({ isOpen: false, tag: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmState({ isOpen: false, tag: null });
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-green-400 dark:hover:border-green-500 hover:shadow-xl transition-all duration-300 rounded-[20px] p-6 overflow-hidden">
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-green-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
              Manage Tags
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">View and organize your custom WABA tags</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:bg-white transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Tag className="h-8 w-8 opacity-20" />
            </div>
            <p className="font-bold text-sm uppercase tracking-widest">No tags found</p>
            {searchTerm && (
              <p className="text-xs font-medium mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6">Tag Name</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Created At</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag._id} className="group/row hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
                          #
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{tag.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-xs">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        {new Date(tag.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(tag)}
                          className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all"
                          title="Edit tag"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(tag)}
                          className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900 transition-all"
                          title="Delete tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {deleteConfirmState.isOpen && deleteConfirmState.tag && (
          <ConfirmDeleteModal
            setModal={(val) => {
              if (!val) handleDeleteCancel();
            }}
            triggerDelete={handleDeleteConfirm}
            title="Delete Tag"
            isLoading={isDeleting}
            itemName={deleteConfirmState.tag.name}
          />
        )}
      </div>
    </div>
  );
}
