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

interface TagsSelectorProps {
  tags: WabaTag[];
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TagsSelector({ 
  tags, 
  value = [], 
  onChange, 
  disabled, 
  placeholder = "Select tags..." 
}: TagsSelectorProps) {
  const [open, setOpen] = useState(false);
  const hasInitialized = useRef(false);
  const availableTagNames = useMemo(() => new Set(tags.map((tag) => tag.name)), [tags]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    const filteredValue = value.filter((tagName) => availableTagNames.has(tagName));
    if (filteredValue.length !== value.length) {
      onChange(filteredValue);
    }
  }, [availableTagNames, onChange, value]);

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
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value.length > 0 ? (
              <span>{value.length} tag{value.length > 1 ? 's' : ''} selected</span>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {tags.map((tag) => (
                <CommandItem
                  key={tag._id}
                  value={tag.name}
                  onSelect={() => handleSelect(tag.name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(tag.name) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag.name}
                </CommandItem>
              ))}
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
