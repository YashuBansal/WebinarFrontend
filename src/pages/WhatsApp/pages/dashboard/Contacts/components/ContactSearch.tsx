import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filterFirstName">First Name</Label>
            <Input
              id="filterFirstName"
              placeholder="Filter first name"
              value={filters.firstName}
              onChange={(e) =>
                onFiltersChange({ ...filters, firstName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filterLastName">Last Name</Label>
            <Input
              id="filterLastName"
              placeholder="Filter last name"
              value={filters.lastName}
              onChange={(e) =>
                onFiltersChange({ ...filters, lastName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filterEmail">Email</Label>
            <Input
              id="filterEmail"
              placeholder="Filter email"
              value={filters.email}
              onChange={(e) =>
                onFiltersChange({ ...filters, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filterPhone">Phone</Label>
            <Input
              id="filterPhone"
              placeholder="Filter phone"
              value={filters.phone}
              onChange={(e) =>
                onFiltersChange({ ...filters, phone: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagsSelector
              tags={wabaTags}
              value={filters.tags}
              onChange={(tags) => onFiltersChange({ ...filters, tags })}
              placeholder="Filter by tags..."
            />
          </div>
          <div className="space-y-2">
            <Label>Tag Condition</Label>
            <Select
              value={filters.tagFilterMode}
              onValueChange={(value: 'has_any' | 'not_has_any') =>
                onFiltersChange({ ...filters, tagFilterMode: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tag condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="has_any">Has selected tags</SelectItem>
                <SelectItem value="not_has_any">Doesn't have selected tags</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
