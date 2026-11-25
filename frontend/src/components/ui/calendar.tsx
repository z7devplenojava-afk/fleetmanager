import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none text-slate-900 dark:text-slate-100", className)}
      classNames={{
        root: "rdp-root text-slate-900 dark:text-slate-100 w-full max-w-[280px]",
        months: "flex flex-col space-y-4",
        month: "space-y-3",
        month_caption: "flex justify-center pt-1 relative items-center mb-2 font-bold text-sm text-slate-900 dark:text-slate-100 capitalize",
        caption_label: "text-base font-bold capitalize text-slate-900 dark:text-white tracking-wide",
        nav: "flex items-center justify-between w-full absolute inset-x-0 top-1 px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "!h-7 !w-7 !p-0 !bg-slate-100 dark:!bg-slate-800 !border-slate-300 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 hover:!bg-slate-200 dark:hover:!bg-slate-700 hover:!text-slate-950 dark:hover:!text-white rounded-lg absolute left-1 z-10 flex items-center justify-center cursor-pointer shadow-sm"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "!h-7 !w-7 !p-0 !bg-slate-100 dark:!bg-slate-800 !border-slate-300 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 hover:!bg-slate-200 dark:hover:!bg-slate-700 hover:!text-slate-950 dark:hover:!text-white rounded-lg absolute right-1 z-10 flex items-center justify-center cursor-pointer shadow-sm"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "border-b border-slate-200 dark:border-slate-800/80 mb-1",
        weekday: "text-slate-700 dark:text-slate-400 font-bold text-[11px] text-center uppercase tracking-wider py-1.5",
        weeks: "divide-y divide-transparent",
        week: "",
        day: "text-center text-sm p-0.5 relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "!h-8 !w-8 !p-0 !font-bold !text-slate-900 dark:!text-slate-100 hover:!bg-slate-100 dark:hover:!bg-slate-800 hover:!text-red-600 dark:hover:!text-white rounded-lg transition-colors flex items-center justify-center mx-auto"
        ),
        selected: "!bg-red-600 !text-white !font-black rounded-lg shadow-md hover:!bg-red-700",
        today: "!font-black !text-amber-600 dark:!text-amber-400 !border-2 !border-amber-500 rounded-lg bg-amber-500/10",
        outside: "!text-slate-400/50 dark:!text-slate-600 !opacity-40 hover:!opacity-70",
        disabled: "!text-slate-300 dark:!text-slate-700 !opacity-30 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
