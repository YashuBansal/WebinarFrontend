import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-1",
        month: "flex flex-col gap-2",
        caption: "flex w-full items-center justify-between gap-1 pt-1",
        caption_dropdowns:
          "rdp-caption_dropdowns flex flex-1 flex-wrap items-center justify-start gap-2 min-w-0",
        caption_label:
          "text-sm font-semibold text-slate-800 dark:text-slate-100 text-left tabular-nums tracking-tight min-w-0 flex-1 pr-2 pl-1.5 sm:pl-2",
        nav: "flex shrink-0 items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "static",
        nav_button_next: "static",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-slate-500 dark:text-slate-400 rounded-md w-8 font-normal text-[0.75rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-200/60 dark:[&:has([aria-selected])]:bg-slate-700/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal text-xs aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-[#22B573] text-white hover:bg-[#1da366] hover:text-white focus:bg-[#22B573] focus:text-white",
        day_today:
          "bg-slate-200/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100",
        day_outside:
          "day-outside text-slate-400 opacity-50 aria-selected:text-slate-300",
        day_disabled: "text-slate-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-slate-200 aria-selected:text-slate-900 dark:aria-selected:bg-slate-700 dark:aria-selected:text-slate-100",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className: iconClass, ...rest }) => (
          <ChevronLeft className={cn("h-4 w-4", iconClass)} {...rest} />
        ),
        IconRight: ({ className: iconClass, ...rest }) => (
          <ChevronRight className={cn("h-4 w-4", iconClass)} {...rest} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
