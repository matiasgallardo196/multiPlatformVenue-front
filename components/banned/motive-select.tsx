"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const BAN_MOTIVES = [
  "Underage entry or alcohol attempt",
  "Theft or stealing",
  "Physical or verbal assault",
  "Weapon possession or threat with weapon",
  "Drug use or dealing",
  "Anti-social or aggressive behaviour",
  "Harassment or inappropriate behaviour",
  "Property damage or vandalism",
  "Failure to comply with staff instructions",
  "Bringing alcohol into the venue",
  "Returning while banned or trespassing",
  "Threatening staff or patrons",
  "Incident requiring police intervention",
  "Other serious misconduct",
] as const;

const OTHER_MOTIVE = "Other serious misconduct";

interface MotiveSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  error?: boolean;
}

export function MotiveSelect({
  value = [],
  onChange,
  onBlur,
  error,
}: MotiveSelectProps) {
  const [open, setOpen] = useState(false);

  const hasOther = value.some(
    (v) => v === OTHER_MOTIVE || v.startsWith(OTHER_MOTIVE + ": ")
  );
  const otherMotiveValue = value.find((v) => v.startsWith(OTHER_MOTIVE + ": "));
  const otherMotiveDisplay = otherMotiveValue
    ? otherMotiveValue.replace(OTHER_MOTIVE + ": ", "")
    : "";

  const handleToggle = (motive: string, checked: boolean) => {
    let newValue = [...value];

    if (motive === OTHER_MOTIVE) {
      if (checked) {
        // Agregar "Other serious misconduct" sin texto personalizado inicialmente
        const hasOtherInValue = newValue.some(
          (v) => v === OTHER_MOTIVE || v.startsWith(OTHER_MOTIVE + ": ")
        );
        if (!hasOtherInValue) {
          newValue.push(OTHER_MOTIVE);
        }
      } else {
        // Remover "Other serious misconduct" y su texto personalizado si existe
        newValue = newValue.filter(
          (v) => !v.startsWith(OTHER_MOTIVE + ": ") && v !== OTHER_MOTIVE
        );
      }
    } else {
      if (checked) {
        if (!newValue.includes(motive)) {
          newValue.push(motive);
        }
      } else {
        newValue = newValue.filter((v) => v !== motive);
      }
    }

    onChange(newValue);
  };

  const handleOtherTextChange = (text: string) => {
    let newValue = [...value];
    
    // Remover cualquier entrada anterior de "Other"
    newValue = newValue.filter(
      (v) => !v.startsWith(OTHER_MOTIVE + ": ") && v !== OTHER_MOTIVE
    );

    if (text.trim()) {
      // Agregar "Other serious misconduct: [texto personalizado]"
      newValue.push(`${OTHER_MOTIVE}: ${text.trim()}`);
    } else {
      // Si se borra el texto pero "Other" estaba seleccionado, mantener solo "Other serious misconduct"
      const wasOtherSelected = value.some(
        (v) => v === OTHER_MOTIVE || v.startsWith(OTHER_MOTIVE + ": ")
      );
      if (wasOtherSelected) {
        newValue.push(OTHER_MOTIVE);
      }
    }

    onChange(newValue);
  };

  const handleRemove = (motive: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newValue = value.filter((v) => {
      if (motive === OTHER_MOTIVE || motive.startsWith(OTHER_MOTIVE + ": ")) {
        return !v.startsWith(OTHER_MOTIVE + ": ") && v !== OTHER_MOTIVE;
      }
      return v !== motive;
    });
    onChange(newValue);
  };

  const displayValue =
    value.length === 0
      ? "Select motives"
      : value.length === 1
      ? value[0].replace(OTHER_MOTIVE + ": ", OTHER_MOTIVE + ": ")
      : `${value.length} motives selected`;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              error && "border-destructive"
            )}
            onBlur={onBlur}
            type="button"
          >
            <span className="truncate text-left font-normal">
              {displayValue}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-3" align="start">
          <div
            className="space-y-3 max-h-[400px] overflow-y-auto overscroll-contain"
            onWheel={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.scrollTop += e.deltaY;
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {BAN_MOTIVES.map((motive) => {
              const isChecked =
                motive === OTHER_MOTIVE
                  ? hasOther
                  : value.includes(motive);
              return (
                <div key={motive} className="flex items-center space-x-2">
                  <Checkbox
                    id={motive}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleToggle(motive, checked === true)
                    }
                  />
                  <Label
                    htmlFor={motive}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {motive}
                  </Label>
                </div>
              );
            })}
            {hasOther && (
              <div className="ml-6 mt-2">
                <Label htmlFor="other-motive-text" className="text-sm mb-1 block">
                  Specify other misconduct:
                </Label>
                <Input
                  id="other-motive-text"
                  placeholder="Enter specific reason"
                  value={otherMotiveDisplay}
                  onChange={(e) => handleOtherTextChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((motive, index) => {
            const displayText = motive.startsWith(OTHER_MOTIVE + ": ")
              ? `${OTHER_MOTIVE}: ${motive.replace(OTHER_MOTIVE + ": ", "")}`
              : motive;
            return (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
              >
                <span className="truncate max-w-[200px]">{displayText}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(motive, e)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

