import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker>;

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: EnhancedCalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-lg shadow-xl", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-lg font-semibold text-gray-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white border border-gray-300 hover:bg-gray-50 p-0 rounded-full"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "mb-2",
        head_cell: "text-gray-600 font-medium text-xs text-center p-0 m-0 h-8 w-8 flex items-center justify-center uppercase tracking-wide",
        row: "flex w-full mb-1",
        cell: "h-8 w-8 text-center text-sm p-0 m-0 flex items-center justify-center mx-auto relative",
        day: cn(
          "h-8 w-8 p-0 font-normal rounded-full hover:bg-blue-100 hover:text-blue-700 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        ),
        day_range_end: "day-range-end",
        day_search: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:text-white shadow-lg font-semibold",
        day_today: "bg-blue-100 text-blue-700 font-semibold",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
        day_range_middle: "bg-blue-50 text-blue-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar };
