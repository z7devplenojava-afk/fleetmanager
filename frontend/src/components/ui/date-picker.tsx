"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[252px] p-0 bg-popover border border-border shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          locale={ptBR}
          className="rounded-md w-[252px]"
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateTimePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Selecione data e hora",
  disabled = false,
  className
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [selectedTime, setSelectedTime] = React.useState<string>(
    date ? format(date, "HH:mm") : ""
  );

  React.useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(":");
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes), 0);
      onDateChange?.(newDate);
    }
  }, [selectedDate, selectedTime, onDateChange]);

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setSelectedTime(format(date, "HH:mm"));
    }
  }, [date]);

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[252px] p-0 bg-popover border border-border shadow-lg" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
            locale={ptBR}
            className="rounded-md w-[252px]"
          />
        </PopoverContent>
      </Popover>
      <input
        type="time"
        value={selectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
        className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
        disabled={disabled}
      />
    </div>
  );
} 