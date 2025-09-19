"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

type DateInputProps = {
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isValidDateParts(day: number, month: number, year: number) {
  if (year < 1000 || year > 9999) return false;
  const clampedMonth = clampNumber(month, 1, 12);
  if (clampedMonth !== month) return false;
  const maxDay = new Date(year, month, 0).getDate();
  return day >= 1 && day <= maxDay;
}

function toDisplay(value?: string | null) {
  if (!value) return "";
  // Expecting ISO-like yyyy-MM-dd
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

function toIso(day: number, month: number, year: number) {
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yyyy = String(year).padStart(4, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoToDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (!isValidDateParts(day, month, year)) return undefined;
  return new Date(year, month - 1, day);
}

/**
 * A text input with dd/MM/yyyy mask that emits ISO date (yyyy-MM-dd).
 */
export function DateInput({
  value,
  onChange,
  onBlur,
  name,
  id,
  placeholder = "dd/mm/yyyy",
  disabled,
  className,
}: DateInputProps) {
  const initial = useMemo(() => toDisplay(value ?? ""), [value]);
  const [display, setDisplay] = useState(initial);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDisplay(toDisplay(value ?? ""));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Keep only digits
    const digits = raw.replace(/\D/g, "").slice(0, 8);

    let dd = digits.slice(0, 2);
    let mm = digits.slice(2, 4);
    let yyyy = digits.slice(4, 8);

    // Build masked value
    let masked = "";
    if (dd) masked = dd;
    if (mm) masked = `${masked}/${mm}`;
    if (yyyy) masked = `${masked}/${yyyy}`;
    setDisplay(masked);

    // Emit ISO when full date present and valid
    if (digits.length === 8) {
      const day = parseInt(dd, 10);
      const month = parseInt(mm, 10);
      const year = parseInt(yyyy, 10);
      if (isValidDateParts(day, month, year)) {
        onChange(toIso(day, month, year));
        return;
      }
    }
    // Partial or invalid → emit empty string to indicate no valid date
    onChange("");
  };

  const handleBlur = () => {
    // On blur, try to normalize if possible; otherwise leave as is
    const digits = display.replace(/\D/g, "");
    if (digits.length === 8) {
      const day = parseInt(digits.slice(0, 2), 10);
      const month = parseInt(digits.slice(2, 4), 10);
      const year = parseInt(digits.slice(4, 8), 10);
      if (isValidDateParts(day, month, year)) {
        // Ensure display reflects valid value
        const normalized = `${String(day).padStart(2, "0")}/${String(
          month
        ).padStart(2, "0")}/${String(year).padStart(4, "0")}`;
        if (normalized !== display) setDisplay(normalized);
      }
    }
    onBlur?.();
  };

  const selectedDate = useMemo(() => isoToDate(value ?? ""), [value]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        name={name}
        id={id}
        value={display}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        inputMode="numeric"
        aria-label="Date in format dd/mm/yyyy"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              const iso = toIso(
                date.getDate(),
                date.getMonth() + 1,
                date.getFullYear()
              );
              onChange(iso);
              setDisplay(toDisplay(iso));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateInput;
