import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagsSelector } from '@/components/ui/tags-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWabaTags } from '@/hooks/useTags';
import { Search, User, Mail, Phone, Tag, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContactColumnFilters {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  tagFilterMode: 'has_any' | 'not_has_any';
}

interface ContactSearchProps {
  projectId?: string;
  filters: ContactColumnFilters;
  onFiltersChange: (value: ContactColumnFilters) => void;
}

export default function ContactSearch({
  projectId,
  filters,
  onFiltersChange,
}: ContactSearchProps) {
  const { data: wabaTags = [] } = useWabaTags({ projectId });

  const inputStyles = "h-10 rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:ring-green-500/10 focus:border-green-500/50 transition-all text-xs font-bold text-slate-700 placeholder:text-slate-300";
  const labelStyles = "text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 mb-2 flex items-center gap-1.5";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <div className="flex flex-col">
        <Label htmlFor="filterFirstName" className={labelStyles}>
          <User className="h-3 w-3" />
          First Name
        </Label>
        <div className="relative group">
          <Input
            id="filterFirstName"
            placeholder="Search first name..."
            value={filters.firstName}
            onChange={(e) =>
              onFiltersChange({ ...filters, firstName: e.target.value })
            }
            className={inputStyles}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <Label htmlFor="filterLastName" className={labelStyles}>
          <User className="h-3 w-3 opacity-50" />
          Last Name
        </Label>
        <Input
          id="filterLastName"
          placeholder="Search last name..."
          value={filters.lastName}
          onChange={(e) =>
            onFiltersChange({ ...filters, lastName: e.target.value })
          }
          className={inputStyles}
        />
      </div>

      <div className="flex flex-col">
        <Label htmlFor="filterEmail" className={labelStyles}>
          <Mail className="h-3 w-3" />
          Email Address
        </Label>
        <Input
          id="filterEmail"
          placeholder="Filter by email..."
          value={filters.email}
          onChange={(e) =>
            onFiltersChange({ ...filters, email: e.target.value })
          }
          className={inputStyles}
        />
      </div>

      <div className="flex flex-col">
        <Label htmlFor="filterPhone" className={labelStyles}>
          <Phone className="h-3 w-3" />
          Phone Number
        </Label>
        <Input
          id="filterPhone"
          placeholder="Filter by phone..."
          value={filters.phone}
          onChange={(e) =>
            onFiltersChange({ ...filters, phone: e.target.value })
          }
          className={inputStyles}
        />
      </div>

      <div className="flex flex-col">
        <Label className={labelStyles}>
          <Tag className="h-3 w-3" />
          Audience Tags
        </Label>
        <TagsSelector
          tags={wabaTags as any[]}
          value={filters.tags}
          onChange={(tags) => onFiltersChange({ ...filters, tags })}
          placeholder="Filter by tags..."
          className={inputStyles}
        />
      </div>

      <div className="flex flex-col">
        <Label className={labelStyles}>
          <Settings2 className="h-3 w-3" />
          Condition
        </Label>
        <Select
          value={filters.tagFilterMode}
          onValueChange={(value: 'has_any' | 'not_has_any') =>
            onFiltersChange({ ...filters, tagFilterMode: value })
          }
          disabled={filters.tags.length === 0}
        >
          <SelectTrigger className={cn(inputStyles, filters.tags.length === 0 && "opacity-50 cursor-not-allowed bg-slate-100")}>
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
            <SelectItem value="has_any" className="text-xs font-bold text-slate-600 focus:bg-slate-50 rounded-lg my-0.5">Has selected tags</SelectItem>
            <SelectItem value="not_has_any" className="text-xs font-bold text-slate-600 focus:bg-slate-50 rounded-lg my-0.5">Doesn't have selected tags</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
