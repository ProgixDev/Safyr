/**
 * Déduction des informations d'un candidat à partir de son adresse e-mail.
 *
 * Couvre les formats courants : `prenom.nom@`, `prenom_nom@`,
 * `p.nom@` (initiale ignorée), `prenomnom@` (non séparable → laissé tel quel).
 * Les chiffres de fin (`marie.dupont2@`) et les suffixes `+...` sont retirés.
 *
 * Le tiret n'est PAS un séparateur : il marque un prénom ou un nom composé
 * (`jean-pierre.martin` → « Jean-Pierre Martin »).
 *
 * Les boîtes génériques (contact@, rh@, recrutement@…) ne donnent aucun nom :
 * ce sont des adresses de service, pas des candidats.
 */

const GENERIC_MAILBOXES = new Set([
  "contact",
  "info",
  "infos",
  "rh",
  "hr",
  "recrutement",
  "recrutements",
  "candidature",
  "candidatures",
  "emploi",
  "job",
  "jobs",
  "admin",
  "administration",
  "direction",
  "secretariat",
  "accueil",
  "hello",
  "bonjour",
  "noreply",
  "no-reply",
  "postmaster",
  "support",
]);

const PARTICLES = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "van",
  "von",
  "da",
  "di",
]);

/** "jean-pierre" → "Jean-Pierre", "de la tour" → "de la Tour". */
function capitalize(word: string): string {
  if (!word) return "";
  if (PARTICLES.has(word.toLowerCase())) return word.toLowerCase();
  return word
    .split("-")
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join("-");
}

export interface CandidateFromEmail {
  /** Nom complet reconstitué, ou "" si l'e-mail ne permet pas de le déduire. */
  fullName: string;
  /** Domaine de l'adresse (utile pour identifier l'entreprise d'origine). */
  domain: string;
}

export function candidateFromEmail(email: string): CandidateFromEmail {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return { fullName: "", domain: "" };

  const domain = trimmed.slice(at + 1);
  const local = trimmed
    .slice(0, at)
    .replace(/\+.*$/, "") // marie.dupont+offres@ → marie.dupont
    .replace(/\d+$/, ""); // marie.dupont2 → marie.dupont

  if (GENERIC_MAILBOXES.has(local)) return { fullName: "", domain };

  const parts = local
    .split(/[._]+/)
    .filter(Boolean)
    // Une initiale seule ("p.dupont") n'apporte pas de prénom exploitable.
    .filter((p) => p.length > 1);

  if (parts.length === 0) return { fullName: "", domain };

  return { fullName: parts.map(capitalize).join(" "), domain };
}
