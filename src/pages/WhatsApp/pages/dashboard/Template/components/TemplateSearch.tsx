import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TemplateSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function TemplateSearch({ searchTerm, onSearchChange }: TemplateSearchProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search templates by name or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
