"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps
  extends Omit<React.ComponentProps<"input">, "type"> {}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, onClick, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleClick = () => {
      const inputEl = internalRef.current;
      if (inputEl) {
        if ("showPicker" in inputEl && typeof (inputEl as any).showPicker === "function") {
          try {
            (inputEl as any).showPicker();
          } catch {
            inputEl.focus();
          }
        } else {
          inputEl.focus();
        }
      }
    };

    return (
      <div
        className="relative flex items-center w-full cursor-pointer group"
        onClick={handleClick}
      >
        <input
          type="date"
          ref={internalRef}
          className={cn(
            "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-[#8C6D45]/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-sm cursor-pointer",
            className
          )}
          {...props}
        />
        <div className="absolute right-3 pointer-events-none text-zinc-400 group-hover:text-[#8C6D45] transition-colors flex items-center justify-center">
          <CalendarIcon className="w-4 h-4" />
        </div>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
