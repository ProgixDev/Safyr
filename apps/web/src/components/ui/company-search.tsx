"use client";

import { useState } from "react";
import { Loader2, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CompanyResult } from "@/app/api/company-search/route";

export type { CompanyResult };

interface Props {
  onSelect: (company: CompanyResult) => void;
  placeholder?: string;
}

/**
 * Recherche d'une société dans l'annuaire des entreprises (gratuit, sans clé)
 * via la route proxy /api/company-search. Sélectionner un résultat appelle
 * onSelect avec les données normalisées (nom, SIREN, SIRET, adresse, APE, TVA…).
 */
export function CompanySearch({ onSelect, placeholder }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = async () => {
    const query = q.trim();
    if (query.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/company-search?q=${encodeURIComponent(query)}`,
      );
      const data = (await res.json()) as { results?: CompanyResult[] };
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
          placeholder={
            placeholder ?? "Rechercher une société (nom ou SIREN)…"
          }
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void search()}
          disabled={loading || q.trim().length < 3}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {results.length > 0 ? (
            <div className="max-h-72 overflow-auto">
              {results.map((c) => (
                <button
                  key={c.siret || c.siren}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    setQ(c.name);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent"
                >
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      SIREN {c.siren}
                      {c.postalCode || c.city
                        ? ` · ${c.postalCode} ${c.city}`
                        : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-3 text-sm text-muted-foreground">
              {loading ? "Recherche…" : "Aucun résultat"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
