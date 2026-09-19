/**
 * Couleurs des pastilles de statut de l'espace Salariés, lisibles en mode
 * clair comme en mode sombre (les variantes `success` / `warning` du Badge
 * sont pensées pour le fond sombre uniquement).
 *
 * Convention du client : vert = ok / validé / terminé / accepté,
 * orange = en attente / planifié / examiné, rouge = refusé / annulé / rejeté,
 * bleu = archivé / en cours.
 */
export const BADGE_TONS = {
  vert: "border-green-600/40 bg-green-500/10 text-green-700 dark:border-green-500/40 dark:text-green-300",
  orange:
    "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  rouge:
    "border-red-600/40 bg-red-500/10 text-red-700 dark:border-red-500/40 dark:text-red-300",
  bleu: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  gris: "border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
} as const;

export type BadgeTon = keyof typeof BADGE_TONS;
