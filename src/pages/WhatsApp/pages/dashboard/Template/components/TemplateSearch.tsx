import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TemplateSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function TemplateSearch({ searchTerm, onSearchChange }: TemplateSearchProps) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
        <Search className="h-4 w-4" />
      </div>
      <Input
        placeholder="Search templates..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-11 pl-11 pr-4 rounded-xl border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-900/60 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-medium"
      />
    </div>
  );
}
