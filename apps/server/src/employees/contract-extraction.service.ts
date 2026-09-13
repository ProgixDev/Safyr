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

// Le modèle vision de Groq ne lit que des images, pas de PDF direct.
const SUPPORTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

const ExtractedContractSchema = z.object({
  type: z
    .enum(["CDI", "CDD", "INTERIM", "APPRENTICESHIP", "INTERNSHIP"])
    .nullable(),
  position: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  workingHours: z.number().nullable(),
  grossSalary: z.number().nullable(),
  trialPeriodEndDate: z.string().nullable(),
  notes: z.string().nullable(),
});

export type ExtractedContract = z.infer<typeof ExtractedContractSchema>;

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    type: {
      type: ["string", "null"],
      enum: ["CDI", "CDD", "INTERIM", "APPRENTICESHIP", "INTERNSHIP", null],
    },
    position: { type: ["string", "null"], description: "Intitulé du poste" },
    startDate: {
      type: ["string", "null"],
      description: "Date de début du contrat, au format ISO YYYY-MM-DD",
    },
    endDate: {
      type: ["string", "null"],
      description:
        "Date de fin si le contrat est à durée déterminée, au format ISO YYYY-MM-DD",
    },
    workingHours: {
      type: ["number", "null"],
      description: "Durée du travail hebdomadaire, en heures",
    },
    grossSalary: {
      type: ["number", "null"],
      description: "Salaire brut mensuel, en euros",
    },
    trialPeriodEndDate: {
      type: ["string", "null"],
      description:
        "Date de fin de la période d'essai, au format ISO YYYY-MM-DD",
    },
    notes: {
      type: ["string", "null"],
      description:
        "Clauses particulières, avenants ou mentions notables, résumés en une ou deux phrases",
    },
  },
  required: [
    "type",
    "position",
    "startDate",
    "endDate",
    "workingHours",
    "grossSalary",
    "trialPeriodEndDate",
    "notes",
  ],
  additionalProperties: false,
};

/**
 * Lit le fichier de contrat déposé (image) et en extrait les champs du
 * formulaire via le modèle vision de Groq : le salarié n'a plus à les
 * ressaisir à la main une fois le fichier choisi.
 */
@Injectable()
export class ContractExtractionService {
  private readonly logger = new Logger(ContractExtractionService.name);
  private readonly apiKey: string | null;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.apiKey = this.env.GROQ_API_KEY ?? null;
    if (!this.apiKey) {
      this.logger.warn(
        "GROQ_API_KEY n'est pas définie : l'extraction automatique de contrat est désactivée.",
      );
    }
  }

  async extractFromFile(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedContract> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "L'extraction automatique n'est pas configurée sur ce serveur.",
      );
    }
    if (!this.isSupported(mimeType)) {
      throw new BadRequestException(
        "Format non pris en charge pour l'extraction automatique : déposez une image (PNG, JPEG ou WEBP). Les PDF ne sont pas lisibles automatiquement pour l'instant — remplissez le formulaire manuellement.",
      );
    }

    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_VISION_MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Ce document est un contrat de travail français (secteur de la sécurité privée). " +
                    "Extrais les champs demandés à partir du texte visible sur l'image. Si une " +
                    "information ne figure pas clairement dans le document, renvoie null pour ce " +
                    "champ plutôt que d'inventer une valeur.",
                },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extracted_contract",
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
      throw new ServiceUnavailableException(
        "Échec de l'extraction automatique. Remplissez le formulaire manuellement.",
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      this.logger.error(`Groq a répondu ${response.status} : ${body}`);
      throw new ServiceUnavailableException(
        "Échec de l'extraction automatique. Remplissez le formulaire manuellement.",
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new ServiceUnavailableException(
        "Le contenu du fichier n'a pas pu être analysé. Remplissez le formulaire manuellement.",
      );
    }

    const parsed = ExtractedContractSchema.safeParse(
      JSON.parse(content) as unknown,
    );
    if (!parsed.success) {
      this.logger.error(`Réponse Groq hors schéma : ${parsed.error.message}`);
      throw new ServiceUnavailableException(
        "Le contenu du fichier n'a pas pu être analysé. Remplissez le formulaire manuellement.",
      );
    }
    return parsed.data;
  }

  private isSupported(mimeType: string): mimeType is SupportedMimeType {
    return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
  }
}
