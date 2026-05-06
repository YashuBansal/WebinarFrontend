import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WabaTag } from "@/schemas/tagSchema";

export interface TagsSelectorProps {
  tags: any[];
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const TagsSelector: React.FC<TagsSelectorProps> = ({ 
  tags, 
  value = [], 
  onChange, 
  disabled, 
  placeholder = "Select tags...",
  className
}) => {
  const [open, setOpen] = useState(false);
  const hasInitialized = useRef(false);
  const availableTagNames = useMemo(() => new Set(tags.map((tag) => tag.name)), [tags]);

  // Removed auto-cleanup effect that was wiping values during loading/project switching
  // which was causing filter selections to disappear.

  const handleSelect = (tagName: string) => {
    if (value.includes(tagName)) {
      onChange(value.filter(tag => tag !== tagName));
    } else {
      onChange([...value, tagName]);
    }
  };

  const handleRemove = (tagName: string) => {
    onChange(value.filter(tag => tag !== tagName));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all px-4", className)}
            disabled={disabled}
          >
            {value.length > 0 ? (
              <span className="text-sm font-bold text-slate-700">{value.length} tag{value.length > 1 ? 's' : ''} selected</span>
            ) : (
              <span className="text-sm font-medium text-slate-400">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {tags.map((tag, index) => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                const tagId = typeof tag === 'object' && tag?._id ? tag._id : `tag-${index}`;
                
                return (
                  <CommandItem
                    key={tagId}
                    value={tagName}
                    onSelect={() => handleSelect(tagName)}
                    className="rounded-xl m-1"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-600",
                        value.includes(tagName) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-xs font-bold text-slate-700">{tagName}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tagName) => (
            <Badge key={tagName} variant="secondary" className="flex items-center gap-1">
              {tagName}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(tagName)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
