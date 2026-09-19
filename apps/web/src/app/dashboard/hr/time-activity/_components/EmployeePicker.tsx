"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export interface OptionSalariePicker {
  id: string;
  name: string;
  /** Texte secondaire : matricule, poste… */
  detail?: string;
}

interface EmployeePickerProps {
  options: OptionSalariePicker[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

/**
 * Choix d'un salarié avec recherche par nom, matricule ou poste.
 *
 * Le filtre est fait ici (et non par cmdk) : cmdk compare la saisie à la
 * valeur de l'entrée, ici un identifiant, et faisait remonter des salariés
 * sans rapport avec le nom tapé.
 */
export function EmployeePicker({
  options,
  value,
  onChange,
  placeholder = "Sélectionner un salarié",
  emptyMessage = "Aucun salarié trouvé.",
  disabled,
}: EmployeePickerProps) {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState("");

  const choisi = options.find((o) => o.id === value);
  const terme = recherche.trim().toLowerCase();
  const visibles = terme
    ? options.filter((o) =>
        `${o.name} ${o.detail ?? ""}`.toLowerCase().includes(terme),
      )
    : options;

  return (
    <Popover
      open={open}
      onOpenChange={(ouvert) => {
        setOpen(ouvert);
        if (!ouvert) setRecherche("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !choisi && "text-muted-foreground")}>
            {choisi ? choisi.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher par nom ou matricule..."
            value={recherche}
            onValueChange={setRecherche}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {visibles.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => {
                    onChange(o.id);
                    setOpen(false);
                    setRecherche("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.name}</div>
                    {o.detail && (
                      <div className="truncate text-xs text-muted-foreground">
                        {o.detail}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
