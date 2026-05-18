import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"
import { Calendar } from "../../components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover"

export function DatePicker({ date, setDate, minDate, maxDate, className, style, placeholder = "Pick a date" }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal px-2 py-1 h-8 text-[13px]",
            !date && "text-muted-foreground",
            className
          )}
          style={style}
        >
          <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
          {date ? format(date, "MMM d, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { if (d) setDate(d) }}
          disabled={(d) => {
            const compDate = new Date(d);
            compDate.setHours(0, 0, 0, 0);

            if (minDate) {
              const m = new Date(minDate);
              m.setHours(0, 0, 0, 0);
              if (compDate < m) return true;
            }
            if (maxDate) {
              const x = new Date(maxDate);
              x.setHours(0, 0, 0, 0);
              if (compDate > x) return true;
            }
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
