import { NextRequest, NextResponse } from "next/server";

// Proxy vers l'annuaire des entreprises (INSEE/data.gouv) — gratuit, sans clé.
// Centralisé ici : pour passer à Pappers plus tard, il suffit de changer cette
// route (l'UI et le reste du code ne bougent pas).
const GOUV_API = "https://recherche-entreprises.api.gouv.fr/search";

export type CompanyResult = {
  siren: string;
  siret: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  ape: string;
  tva: string;
};

// Clé TVA intracommunautaire française : (12 + 3 * (SIREN % 97)) % 97
function computeTva(siren: string): string {
  const n = Number(siren);
  if (!Number.isFinite(n) || siren.length !== 9) return "";
  const key = (12 + 3 * (n % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

/**
 * L'annuaire renvoie la raison sociale suivie du sigle entre parenthèses
 * (« PRODIGE SECURITE PRIVEE (PRODIGE) »). On ne garde que la raison sociale :
 * le sigle n'a pas à figurer dans le nom de l'entreprise.
 */
function nettoyerRaisonSociale(nom: string): string {
  return nom.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/**
 * Normalise la saisie avant d'interroger l'annuaire.
 *
 * L'API gouv ne comprend que le nom ou le SIREN/SIRET : un numéro de TVA
 * intracommunautaire ne ramène aucun résultat. Or le SIREN est contenu dans la
 * TVA française (FR + clé sur 2 caractères + les 9 chiffres du SIREN) — on
 * l'extrait pour que saisir la TVA donne directement le SIRET de l'entreprise.
 *
 * Gère aussi les espaces/points de saisie et le SIRET complet (14 chiffres),
 * dont on ne garde que le SIREN (l'annuaire indexe l'établissement siège).
 */
function normalizeQuery(raw: string): string {
  const compact = raw.replace(/[\s.\-]/g, "").toUpperCase();

  // TVA intracommunautaire française : FR + clé (2 caractères) + SIREN (9).
  const tva = /^FR[0-9A-Z]{2}(\d{9})$/.exec(compact);
  if (tva) return tva[1];

  // SIRET complet : les 9 premiers chiffres sont le SIREN.
  if (/^\d{14}$/.test(compact)) return compact.slice(0, 9);

  // SIREN seul : on le passe tel quel.
  if (/^\d{9}$/.test(compact)) return compact;

  return raw;
}

interface GouvSiege {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  activite_principale?: string;
}
interface GouvResult {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: GouvSiege;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `${GOUV_API}?q=${encodeURIComponent(normalizeQuery(q))}&per_page=8`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Cache court : l'annuaire bouge peu.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }
    const data = (await res.json()) as { results?: GouvResult[] };
    const results: CompanyResult[] = (data.results ?? []).map((r) => {
      const siege = r.siege ?? {};
      const siren = r.siren ?? "";
      return {
        siren,
        siret: siege.siret ?? "",
        name: nettoyerRaisonSociale(
          r.nom_complet ?? r.nom_raison_sociale ?? "",
        ),
        address: siege.adresse ?? "",
        postalCode: siege.code_postal ?? "",
        city: siege.libelle_commune ?? "",
        ape: (siege.activite_principale ?? "").replace(".", ""),
        tva: computeTva(siren),
      };
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
