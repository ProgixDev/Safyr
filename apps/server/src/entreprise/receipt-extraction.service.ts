import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { z } from "zod";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3.8-27b";

// Groq refuse les images dont l'encodage base64 dépasse 4 Mo (≈ 3 Mo bruts).
// Le front réduit les photos avant l'envoi ; ce plafond protège les autres appelants.
const TAILLE_IMAGE_MAX = 3 * 1024 * 1024;

export const MESSAGE_PDF =
  "Lecture automatique disponible pour les photos (JPG/PNG) — saisissez les montants pour un PDF.";

const ExtractedReceiptSchema = z.object({
  date: z.string().nullable(),
  montantHT: z.number().nullable(),
  tva: z.number().nullable(),
  montantTTC: z.number().nullable(),
  description: z.string().nullable(),
});

export type ExtractedReceipt = z.infer<typeof ExtractedReceiptSchema>;

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    date: {
      type: ["string", "null"],
      description: "Date du ticket ou de la facture, au format ISO YYYY-MM-DD",
    },
    montantHT: {
      type: ["number", "null"],
      description: "Total hors taxes, en euros",
    },
    tva: {
      type: ["number", "null"],
      description: "Montant total de la TVA, en euros (pas le taux en %)",
    },
    montantTTC: {
      type: ["number", "null"],
      description: "Total toutes taxes comprises à payer, en euros",
    },
    description: {
      type: ["string", "null"],
      description:
        "Résumé court de l'achat : article principal et/ou commerçant (moins de 80 caractères)",
    },
  },
  required: ["date", "montantHT", "tva", "montantTTC", "description"],
  additionalProperties: false,
};

const PROMPT =
  "Cette image est un ticket de caisse ou une facture d'achat (cadeau client). " +
  "Extrais la date, le total HT, le montant de TVA, le total TTC et une courte " +
  "description de l'achat. Les montants sont en euros, sous forme de nombres " +
  "(virgule décimale française à convertir en point). Si une information ne " +
  "figure pas clairement sur le document, renvoie null pour ce champ plutôt " +
  "que d'inventer une valeur.";

/**
 * Lit la photo d'un ticket ou d'une facture et en extrait date, HT, TVA, TTC
 * et description, pour pré-remplir le formulaire d'un cadeau client.
 *
 * Volontairement limité aux images (mode vision de Groq) : la lecture des PDF
 * passe par pdfjs, dont le chargement est instable en serverless (voir
 * l'extraction de contrat). Un PDF reçoit donc un message clair, sans crash.
 */
@Injectable()
export class ReceiptExtractionService {
  private readonly logger = new Logger(ReceiptExtractionService.name);
  private readonly apiKey: string | null;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.apiKey = this.env.GROQ_API_KEY ?? null;
    if (!this.apiKey) {
      this.logger.warn(
        "GROQ_API_KEY n'est pas définie : la lecture automatique des tickets est désactivée.",
      );
    }
  }

  async extractFromFile(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedReceipt> {
    // Le format est vérifié avant la clé : un PDF reçoit le même message
    // explicatif que la clé soit configurée ou non.
    if (mimeType === "application/pdf") {
      throw new BadRequestException(MESSAGE_PDF);
    }
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new BadRequestException(
        "Format non pris en charge pour la lecture automatique : utilisez une photo JPG, PNG ou WEBP.",
      );
    }
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "Lecture automatique non configurée",
      );
    }
    if (buffer.length > TAILLE_IMAGE_MAX) {
      throw new BadRequestException(
        "Photo trop volumineuse pour la lecture automatique (3 Mo maximum).",
      );
    }

    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const texte = await this.callGroq([
      { type: "text", text: PROMPT },
      { type: "image_url", image_url: { url: dataUrl } },
    ]);

    let json: unknown;
    try {
      json = JSON.parse(texte);
    } catch {
      this.logger.error(`Réponse Groq non JSON : ${texte.slice(0, 200)}`);
      throw this.illisible();
    }
    const parsed = ExtractedReceiptSchema.safeParse(json);
    if (!parsed.success) {
      this.logger.error(`Réponse Groq hors schéma : ${parsed.error.message}`);
      throw this.illisible();
    }
    return this.normaliser(parsed.data);
  }

  /** Valide la date, arrondit les montants et complète le troisième montant. */
  private normaliser(brut: ExtractedReceipt): ExtractedReceipt {
    const montant = (v: number | null): number | null =>
      v !== null && Number.isFinite(v) && v >= 0
        ? Math.round(v * 100) / 100
        : null;
    const arrondi = (v: number) => Math.round(v * 100) / 100;

    let ht = montant(brut.montantHT);
    let tva = montant(brut.tva);
    let ttc = montant(brut.montantTTC);

    // Le modèle ne renvoie parfois que deux des trois montants : le troisième
    // se déduit sans risque (TTC = HT + TVA).
    if (ttc === null && ht !== null && tva !== null) ttc = arrondi(ht + tva);
    else if (tva === null && ht !== null && ttc !== null && ttc >= ht)
      tva = arrondi(ttc - ht);
    else if (ht === null && ttc !== null && tva !== null && ttc >= tva)
      ht = arrondi(ttc - tva);

    return {
      date: dateIsoValide(brut.date),
      montantHT: ht,
      tva,
      montantTTC: ttc,
      description: brut.description?.trim() || null,
    };
  }

  private illisible(): ServiceUnavailableException {
    return new ServiceUnavailableException(
      "Le document n'a pas pu être analysé. Saisissez les champs manuellement.",
    );
  }

  private async callGroq(
    content: (
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    )[],
  ): Promise<string> {
    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extracted_receipt",
              strict: true,
              schema: RESPONSE_JSON_SCHEMA,
            },
          },
        }),
      });
    } catch (error) {
      this.logger.error(
        `Échec de l'appel à Groq : ${error instanceof Error ? error.message : "erreur inconnue"}`,
      );
      throw this.illisible();
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      this.logger.error(`Groq a répondu ${response.status} : ${body}`);
      throw this.illisible();
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw this.illisible();
    return text;
  }
}

/** Renvoie la date si c'est un vrai jour au format YYYY-MM-DD, sinon null. */
function dateIsoValide(valeur: string | null): string | null {
  if (!valeur) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur.trim());
  if (!m) return null;
  const [, a, mo, j] = m;
  const d = new Date(Date.UTC(Number(a), Number(mo) - 1, Number(j)));
  const coherente =
    d.getUTCFullYear() === Number(a) &&
    d.getUTCMonth() === Number(mo) - 1 &&
    d.getUTCDate() === Number(j);
  return coherente ? `${a}-${mo}-${j}` : null;
}
