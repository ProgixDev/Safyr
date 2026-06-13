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
    const url = `${GOUV_API}?q=${encodeURIComponent(q)}&per_page=8`;
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
        name: r.nom_complet ?? r.nom_raison_sociale ?? "",
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
