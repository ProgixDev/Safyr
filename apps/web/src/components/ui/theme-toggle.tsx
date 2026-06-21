"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// Bascule clair / sombre : ajoute ou retire la classe `.dark` sur <html> et
// mémorise le choix dans localStorage. Le thème par défaut reste sombre.
export function ThemeToggle({ expanded = false }: { expanded?: boolean }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* localStorage indisponible : on ignore */
    }
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-label="Basculer le thème clair / sombre"
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        expanded ? "w-full px-4 py-2.5" : "h-10 w-10 mx-auto justify-center",
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5 shrink-0" />
      ) : (
        <Moon className="h-5 w-5 shrink-0" />
      )}
      {expanded && (
        <span className="text-sm font-medium">
          {isDark ? "Mode clair" : "Mode sombre"}
        </span>
      )}
    </button>
  );
}
