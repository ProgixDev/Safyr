"use client";

import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Précision affichée en grisé (matricule, poste…). */
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Menu déroulant à sélection multiple : recherche, cases à cocher et pastilles
 * retirables. Une valeur enregistrée qui n'est plus dans la liste (salarié
 * supprimé, ancien matricule…) reste affichée et retirable : on ne la perd pas
 * en silence à la modification.
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé.",
  disabled = false,
  className,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const labelOf = (v: string) =>
    options.find((option) => option.value === v)?.label ?? v;

  const toggle = (v: string) =>
    onValueChange(
      value.includes(v) ? value.filter((item) => item !== v) : [...value, v],
    );

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span
              className={cn(
                "truncate",
                value.length === 0 && "text-muted-foreground",
              )}
            >
              {value.length === 0
                ? placeholder
                : `${value.length} sélectionné${value.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const checked = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      // `value` sert au filtrage : libellé + précision, plus
                      // la clé pour que deux homonymes restent distincts.
                      value={`${option.label} ${option.description ?? ""} ${option.value}`}
                      onSelect={() => toggle(option.value)}
                    >
                      <Checkbox
                        checked={checked}
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none mr-2"
                      />
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="ml-2 truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          {value.length > 0 && (
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-center text-xs"
                onClick={() => onValueChange([])}
              >
                Tout désélectionner
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="gap-1 pr-1 font-medium"
            >
              {labelOf(v)}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Retirer ${labelOf(v)}`}
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                  onClick={() => toggle(v)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
