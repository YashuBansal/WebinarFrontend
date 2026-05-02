import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { FormControl } from "@/components/ui/form";
import type { WABAPhoneNumber } from "@/schemas/wabaSchema";
import { useState } from "react";

interface PhoneNumberSelectorProps {
  phoneNumbers: WABAPhoneNumber[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PhoneNumberSelector({ phoneNumbers, value, onChange, disabled }: PhoneNumberSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedPhone = phoneNumbers.find(phone => phone.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedPhone ? (
              <span>{selectedPhone.display_phone_number} ({selectedPhone.quality_rating})</span>
            ) : (
              <span>Select a phone number</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search phone numbers..." />
          <CommandEmpty>No phone numbers found.</CommandEmpty>
          <CommandGroup>
            {phoneNumbers.map((phone) => (
              <CommandItem
                key={phone.id}
                value={phone.display_phone_number}
                onSelect={() => {
                  onChange(phone.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === phone.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {phone.display_phone_number} ({phone.quality_rating})
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}