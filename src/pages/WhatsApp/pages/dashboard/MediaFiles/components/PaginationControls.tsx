import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';

type Props = {
  page: number;
  total: number;
  limit: number;
  onChange: (nextPage: number) => void;
};

const PaginationControls: React.FC<Props> = ({ page, total, limit, onChange }) => {
  const totalPages = Math.ceil(total / limit);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  if (totalPages <= 1) return null;

  const renderPageButton = (pageNum: number) => (
    <Button
      key={pageNum}
      variant={pageNum === page ? "default" : "outline"}
      size="icon"
      onClick={() => onChange(pageNum)}
      className={`h-9 w-9 rounded-xl transition-all duration-300 font-bold text-xs ${
        pageNum === page 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {pageNum}
    </Button>
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (start === 1) end = maxVisiblePages;
      if (end === totalPages) start = totalPages - maxVisiblePages + 1;

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Showing Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
        {/* First Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(1)}
          disabled={!hasPrevPage}
          className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(page - 1)}
          disabled={!hasPrevPage}
          className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-1">
          {getPageNumbers().map(pageNum => renderPageButton(pageNum))}
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Next Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(page + 1)}
          disabled={!hasNextPage}
          className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(totalPages)}
          disabled={!hasNextPage}
          className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;


