import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";

const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

const ExtractedContractSchema = z.object({
  type: z
    .enum(["CDI", "CDD", "INTERIM", "APPRENTICESHIP", "INTERNSHIP"])
    .nullable(),
  position: z.string().nullable().describe("Intitulé du poste"),
  startDate: z
    .string()
    .nullable()
    .describe("Date de début du contrat, au format ISO YYYY-MM-DD"),
  endDate: z
    .string()
    .nullable()
    .describe(
      "Date de fin si le contrat est à durée déterminée, au format ISO YYYY-MM-DD",
    ),
  workingHours: z
    .number()
    .nullable()
    .describe("Durée du travail hebdomadaire, en heures"),
  grossSalary: z.number().nullable().describe("Salaire brut mensuel, en euros"),
  trialPeriodEndDate: z
    .string()
    .nullable()
    .describe("Date de fin de la période d'essai, au format ISO YYYY-MM-DD"),
  notes: z
    .string()
    .nullable()
    .describe(
      "Clauses particulières, avenants ou mentions notables, résumés en une ou deux phrases",
    ),
});

export type ExtractedContract = z.infer<typeof ExtractedContractSchema>;

/**
 * Lit le fichier de contrat déposé (PDF ou image) et en extrait les champs
 * du formulaire : le salarié n'a plus à les ressaisir à la main une fois le
 * fichier choisi.
 */
@Injectable()
export class ContractExtractionService {
  private readonly logger = new Logger(ContractExtractionService.name);
  private readonly client: Anthropic | null;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.client = this.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY })
      : null;
    if (!this.client) {
      this.logger.warn(
        "ANTHROPIC_API_KEY n'est pas définie : l'extraction automatique de contrat est désactivée.",
      );
    }
  }

  async extractFromFile(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedContract> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "L'extraction automatique n'est pas configurée sur ce serveur.",
      );
    }
    if (!this.isSupported(mimeType)) {
      throw new BadRequestException(
        "Format non pris en charge pour l'extraction automatique : déposez un PDF, PNG, JPEG ou WEBP.",
      );
    }

    const data = buffer.toString("base64");
    const documentBlock =
      mimeType === "application/pdf"
        ? ({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data,
            },
          } as const)
        : ({
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data,
            },
          } as const);

    try {
      const response = await this.client.messages.parse({
        model: "claude-opus-5",
        max_tokens: 4096,
        output_config: {
          effort: "medium",
          format: zodOutputFormat(ExtractedContractSchema),
        },
        messages: [
          {
            role: "user",
            content: [
              documentBlock,
              {
                type: "text",
                text:
                  "Ce document est un contrat de travail français (secteur de la sécurité privée). " +
                  "Extrais les champs demandés à partir du texte du contrat. Si une information ne " +
                  "figure pas clairement dans le document, renvoie null pour ce champ plutôt que " +
                  "d'inventer une valeur.",
              },
            ],
          },
        ],
      });

      if (!response.parsed_output) {
        throw new ServiceUnavailableException(
          "Le contenu du fichier n'a pas pu être analysé. Remplissez le formulaire manuellement.",
        );
      }
      return response.parsed_output;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(
        `Échec de l'extraction du contrat : ${error instanceof Error ? error.message : "erreur inconnue"}`,
      );
      throw new ServiceUnavailableException(
        "Échec de l'extraction automatique. Remplissez le formulaire manuellement.",
      );
    }
  }

  private isSupported(mimeType: string): mimeType is SupportedMimeType {
    return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
  }
}
