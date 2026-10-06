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
import { extractPdfText } from "@/common/pdf-text-extraction";

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3.8-27b";

// Groq refuse les images dont l'encodage base64 dépasse 4 Mo (≈ 3 Mo bruts).
// Le front réduit les photos avant l'envoi ; ce plafond protège les autres appelants.
const TAILLE_IMAGE_MAX = 3 * 1024 * 1024;

export const MESSAGE_PDF_SCANNE =
  "Ce PDF semble être un scan sans texte détectable (image de document) : l'extraction automatique ne peut pas le lire. Saisissez les montants manuellement, ou déposez une photo/capture d'écran du reçu (JPG/PNG).";

// Taux de TVA français courants : sert à valider le taux lu et à estimer
// HT/TVA quand seul le TTC est lisible.
const TAUX_TVA_FR = [2.1, 5.5, 10, 20];
const TAUX_TVA_DEFAUT = 20;

const ExtractedReceiptSchema = z.object({
  date: z.string().nullable(),
  montantHT: z.number().nullable(),
  tva: z.number().nullable(),
  montantTTC: z.number().nullable(),
  description: z.string().nullable(),
  tauxTVA: z.number().nullable().optional(),
});

type LectureBrute = z.infer<typeof ExtractedReceiptSchema>;

/** Résultat renvoyé au front : les champs lus + l'indication d'estimation. */
export interface ExtractedReceipt {
  /** Date ISO AAAA-MM-JJ. */
  date: string | null;
  montantHT: number | null;
  tva: number | null;
  montantTTC: number | null;
  description: string | null;
  /** Vrai si HT/TVA ont été déduits du TTC avec un taux plausible. */
  estime: boolean;
  /** Taux (en %) utilisé pour l'estimation, sinon null. */
  tauxEstime: number | null;
}

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    date: {
      type: ["string", "null"],
      description:
        "Date d'émission du ticket ou de la facture, au format ISO AAAA-MM-JJ. Une date française JJ/MM/AAAA se convertit (le jour vient en premier). null si absente.",
    },
    montantHT: {
      type: ["number", "null"],
      description:
        "Total hors taxes (HT) en euros, nombre avec point décimal. Si plusieurs taux de TVA, la somme de tous les HT.",
    },
    tva: {
      type: ["number", "null"],
      description:
        "Montant total de la TVA en euros (jamais le taux en %). Si plusieurs taux de TVA, la somme de tous les montants de TVA.",
    },
    montantTTC: {
      type: ["number", "null"],
      description:
        "Total toutes taxes comprises (TTC) réellement payé, en euros, nombre avec point décimal.",
    },
    description: {
      type: ["string", "null"],
      description:
        "Une seule ligne : commerçant ou fournisseur, puis objet de l'achat, par exemple « Décathlon – vélo » (moins de 100 caractères).",
    },
    tauxTVA: {
      type: ["number", "null"],
      description:
        "Taux de TVA principal en pourcentage (20, 10, 5.5 ou 2.1) si indiqué sur le document, sinon null.",
    },
  },
  required: [
    "date",
    "montantHT",
    "tva",
    "montantTTC",
    "description",
    "tauxTVA",
  ],
  additionalProperties: false,
};

const PROMPT = [
  "Ce document (image ou texte extrait d'un PDF) est un ticket de caisse ou une facture d'achat française (cadeau client).",
  "Renseigne TOUS les champs du schéma en lisant le document avec soin :",
  "- date : date d'émission, format AAAA-MM-JJ. Les dates françaises sont JJ/MM/AAAA (le jour d'abord) : 22/09/2026 devient 2026-09-22.",
  "- montantHT, tva, montantTTC : nombres en euros avec un point décimal (la virgule française 12,50 devient 12.5), sans symbole ni espace.",
  "- tva est le MONTANT de TVA en euros, jamais le taux en pourcentage. TVA = TTC - HT.",
  "- Si le document présente plusieurs taux de TVA (5,5 %, 10 %, 20 %…), additionne les HT entre eux et les montants de TVA entre eux ; le TTC est le total à payer.",
  "- Si seul le total TTC est lisible, renvoie le TTC et null pour HT et TVA (ne les invente pas).",
  "- description : une ligne, commerçant ou fournisseur puis objet de l'achat, par exemple « Décathlon – vélo ».",
  "- tauxTVA : le taux principal indiqué sur le document, sinon null.",
  "Si une information est vraiment absente ou illisible, renvoie null pour ce champ.",
].join("\n");

/**
 * Lit le reçu (photo ou PDF) d'un cadeau client et en extrait date, HT, TVA,
 * TTC et description, pour pré-remplir le formulaire.
 *
 * Les PDF sont d'abord convertis en texte (pdf-parse, voir
 * @/common/pdf-text-extraction) puis envoyés au modèle en mode texte. Les
 * images passent par le mode vision du même modèle. Un PDF scanné sans
 * couche de texte (donc sans texte extractible) est signalé explicitement
 * plutôt que de produire un résultat vide ou halluciné.
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
    const estPdf = mimeType === "application/pdf";
    if (
      !estPdf &&
      !(IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      throw new BadRequestException(
        "Format non pris en charge pour la lecture automatique : utilisez un PDF ou une photo JPG, PNG ou WEBP.",
      );
    }
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "Lecture automatique non configurée",
      );
    }
    if (buffer.length > TAILLE_IMAGE_MAX) {
      throw new BadRequestException(
        estPdf
          ? "Fichier trop volumineux pour la lecture automatique (3 Mo maximum)."
          : "Photo trop volumineuse pour la lecture automatique (3 Mo maximum).",
      );
    }

    const texte = estPdf
      ? await this.callGroq([{ type: "text", text: await this.buildPdfPrompt(buffer) }])
      : await this.callGroq([
          { type: "text", text: PROMPT },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            },
          },
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

  /** Valide la date, arrondit les montants et complète HT / TVA / TTC. */
  private normaliser(brut: LectureBrute): ExtractedReceipt {
    const montant = (v: number | null): number | null =>
      v !== null && Number.isFinite(v) && v >= 0
        ? Math.round(v * 100) / 100
        : null;
    const arrondi = (v: number) => Math.round(v * 100) / 100;

    let ht = montant(brut.montantHT);
    let tva = montant(brut.tva);
    let ttc = montant(brut.montantTTC);
    let estime = false;
    let tauxEstime: number | null = null;

    // Un HT supérieur au TTC est une erreur de lecture : on garde le TTC, qui
    // est le total payé, et HT/TVA sont déduits plus bas.
    if (ht !== null && ttc !== null && ht > ttc) {
      ht = null;
      tva = null;
    }

    // Le modèle ne renvoie parfois que deux des trois montants : le troisième
    // se déduit sans risque (TTC = HT + TVA, TVA = TTC − HT).
    if (ttc === null && ht !== null && tva !== null) ttc = arrondi(ht + tva);
    else if (ht !== null && ttc !== null) tva = arrondi(ttc - ht);
    else if (ht === null && ttc !== null && tva !== null && ttc >= tva)
      ht = arrondi(ttc - tva);

    // Un seul montant lisible : on estime le reste avec un taux plausible et on
    // le signale au front (jamais présenté comme une lecture certaine).
    if (ht === null && tva === null && ttc !== null) {
      const taux = this.tauxPlausible(brut.tauxTVA);
      ht = arrondi(ttc / (1 + taux / 100));
      tva = arrondi(ttc - ht);
      estime = true;
      tauxEstime = taux;
    } else if (ht !== null && tva === null && ttc === null) {
      const taux = this.tauxPlausible(brut.tauxTVA);
      tva = arrondi((ht * taux) / 100);
      ttc = arrondi(ht + tva);
      estime = true;
      tauxEstime = taux;
    }

    return {
      date: dateIsoValide(brut.date),
      montantHT: ht,
      tva,
      montantTTC: ttc,
      description: brut.description?.trim().slice(0, 120) || null,
      estime,
      tauxEstime,
    };
  }

  /** Taux lu s'il est un taux français courant, sinon 20 %. */
  private tauxPlausible(lu: number | null | undefined): number {
    return lu != null && TAUX_TVA_FR.includes(lu) ? lu : TAUX_TVA_DEFAUT;
  }

  private illisible(): ServiceUnavailableException {
    return new ServiceUnavailableException(
      "Le document n'a pas pu être analysé. Saisissez les champs manuellement.",
    );
  }

  /** Texte du PDF (ou message d'erreur explicite) suivi du prompt d'extraction. */
  private async buildPdfPrompt(buffer: Buffer): Promise<string> {
    let texte: string | null;
    try {
      texte = await extractPdfText(buffer);
    } catch (error) {
      this.logger.error(
        `Échec de la lecture du PDF : ${error instanceof Error ? error.message : "erreur inconnue"}`,
      );
      throw new BadRequestException(
        "Ce fichier PDF n'a pas pu être lu. Vérifiez qu'il n'est pas corrompu ou protégé par mot de passe.",
      );
    }
    if (!texte) {
      throw new BadRequestException(MESSAGE_PDF_SCANNE);
    }
    return `${PROMPT}\n\n--- Contenu du reçu ---\n${texte}`;
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

/**
 * Renvoie la date au format AAAA-MM-JJ si c'est un vrai jour, sinon null.
 * Accepte aussi la forme française JJ/MM/AAAA (ou JJ-MM-AAAA, JJ.MM.AAAA), au
 * cas où le modèle ne la convertirait pas.
 */
function dateIsoValide(valeur: string | null): string | null {
  if (!valeur) return null;
  const texte = valeur.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(texte);
  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/.exec(texte);
  let annee: string;
  let mois: string;
  let jour: string;
  if (iso) {
    [, annee, mois, jour] = iso;
  } else if (fr) {
    [, jour, mois, annee] = fr;
    if (annee.length === 2) annee = `20${annee}`;
  } else {
    return null;
  }
  mois = mois.padStart(2, "0");
  jour = jour.padStart(2, "0");
  const d = new Date(Date.UTC(Number(annee), Number(mois) - 1, Number(jour)));
  const coherente =
    d.getUTCFullYear() === Number(annee) &&
    d.getUTCMonth() === Number(mois) - 1 &&
    d.getUTCDate() === Number(jour);
  return coherente ? `${annee}-${mois}-${jour}` : null;
}
