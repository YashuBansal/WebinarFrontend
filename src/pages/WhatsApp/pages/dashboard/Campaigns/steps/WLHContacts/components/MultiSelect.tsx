import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  getDisplayLabel?: (value: string) => string;
  maxDisplayItems?: number;
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  getDisplayLabel,
  maxDisplayItems = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    const labels = selectedValues
      .map((value) => {
        if (getDisplayLabel) {
          return getDisplayLabel(value);
        }
        const option = options.find((opt) => opt.value === value);
        return option?.label || value;
      })
      .filter(Boolean);

    if (labels.length <= maxDisplayItems) {
      return labels.join(", ");
    }

    return `${labels.slice(0, maxDisplayItems).join(", ")} (+${
      labels.length - maxDisplayItems
    } more)`;
  }, [selectedValues, options, getDisplayLabel, maxDisplayItems, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-11 px-4 justify-between rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold transition-all hover:bg-slate-100/50 focus:ring-4 focus:ring-[#22B573]/10",
            open && "border-[#22B573] ring-4 ring-[#22B573]/10 bg-white dark:bg-slate-800/50"
          )}
        >
          <span className="truncate flex-1 text-left text-slate-700 dark:text-slate-300">
            {selectedValues.length > 0 ? (
              <span className="text-slate-900 dark:text-white">{displayText}</span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-[#22B573]"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-xl" align="start">
        <Command className="rounded-xl">
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-10 text-xs font-medium border-none focus:ring-0"
          />
          <CommandEmpty className="py-4 text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
            {emptyMessage}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto p-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => handleToggle(option.value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 data-[selected=true]:bg-[#22B573]/5 data-[selected=true]:text-[#22B573] transition-colors cursor-pointer"
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border border-slate-300 transition-all",
                    isSelected ? "bg-[#22B573] border-[#22B573]" : "group-hover:border-[#22B573]"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                  </div>
                  <span className="flex-1 truncate">{option.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

