"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { SmartReactDatePicker } from "@/components/ui/smart-date-picker";

interface EnhancedDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  className,
  error = false
}: EnhancedDatePickerProps) {
  return (
    <SmartReactDatePicker
      selected={date || null}
      onChange={(d) => onDateChange?.(d || undefined)}
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(
        error && "border-red-500 text-red-600",
        className
      )}
    />
  );
}

interface EnhancedDateTimePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function EnhancedDateTimePicker({
  date,
  onDateChange,
  placeholder = "Selecione data e hora",
  disabled = false,
  className,
  error = false
}: EnhancedDateTimePickerProps) {
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
    <div className="space-y-3">
      <EnhancedDatePicker
        date={selectedDate}
        onDateChange={setSelectedDate}
        placeholder="Selecione uma data"
        disabled={disabled}
        error={error}
      />
      <input
        type="time"
        value={selectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
        className={cn(
          "w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-all duration-200",
          error && "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500",
          disabled && "bg-gray-100 cursor-not-allowed"
        )}
        disabled={disabled}
      />
    </div>
  );
}
