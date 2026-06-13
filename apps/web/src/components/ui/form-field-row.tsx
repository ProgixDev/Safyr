"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import type { AnyFieldApi } from "@tanstack/react-form";
import { cn } from "@/lib/utils";

type InjectedProps = {
  id?: string;
  value?: unknown;
  onBlur?: () => void;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  disabled?: boolean;
  className?: string;
};

interface FormFieldRowProps {
  field: AnyFieldApi;
  label: string;
  /** When false the field is read-only (no per-field edit button). */
  editing: boolean;
  children: React.ReactElement<InjectedProps>;
  className?: string;
  helperText?: string;
}

/**
 * Presentational form field used inside a "batch edit" section: a single
 * "Modifier" button toggles the whole section into edit mode, and a single
 * "Enregistrer" button saves everything. Unlike EditableFormField there is no
 * per-field pencil/save control. Font sizes are intentionally larger for
 * readability.
 */
export function FormFieldRow({
  field,
  label,
  editing,
  children,
  className,
  helperText,
}: FormFieldRowProps) {
  const isTouched = field.state.meta.isTouched;
  const isInvalid = isTouched && field.state.meta.errors.length > 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={field.name}
        className={cn(
          isInvalid ? "text-destructive" : "",
          "text-base font-medium leading-none",
        )}
      >
        {label}
      </Label>
      <div className="relative">
        {React.cloneElement<InjectedProps>(children, {
          id: field.name,
          value: field.state.value ?? "",
          onBlur: field.handleBlur,
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => field.handleChange(e.target.value as never),
          disabled: !editing,
          className: cn(
            children.props.className,
            "text-base",
            !editing &&
              "bg-muted/30 border-transparent shadow-none cursor-default focus-visible:ring-0",
            isInvalid &&
              "border-destructive ring-destructive/20 text-destructive placeholder:text-destructive/60",
          ),
        })}
      </div>

      {(isInvalid || helperText) && (
        <p
          className={cn(
            "mt-1 text-sm animate-in fade-in slide-in-from-top-1 duration-200",
            isInvalid ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {field.state.meta.errors
            .map((err) => (typeof err === "string" ? err : (err?.message ?? "")))
            .filter(Boolean)
            .join(", ") || helperText}
        </p>
      )}
    </div>
  );
}
