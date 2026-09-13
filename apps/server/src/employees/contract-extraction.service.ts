import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PDFParse } from "pdf-parse";
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

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3.8-27b";

// En dessous de ce nombre de caractères, le PDF est presque certainement un
// scan sans couche de texte : l'extraire donnerait un résultat vide ou du
// bruit plutôt que le contenu réel du contrat.
const TEXTE_PDF_MINIMUM = 40;

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

type GroqContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

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

const PROMPT =
  "Ce document est un contrat de travail français (secteur de la sécurité privée). " +
  "Extrais les champs demandés à partir de son contenu. Si une information ne figure " +
  "pas clairement dans le document, renvoie null pour ce champ plutôt que d'inventer " +
  "une valeur.";

/**
 * Lit le fichier de contrat déposé (PDF ou image) et en extrait les champs
 * du formulaire via Groq : le salarié n'a plus à les ressaisir à la main
 * une fois le fichier choisi.
 *
 * Les PDF sont d'abord convertis en texte (pdf-parse, sans rendu image :
 * pas de dépendance native, fiable en environnement serverless) puis
 * envoyés au modèle en mode texte. Les images passent directement par le
 * mode vision du même modèle. Un PDF scanné sans couche de texte (donc
 * sans texte extractible) est signalé explicitement plutôt que de produire
 * un résultat vide ou halluciné.
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
        "Format non pris en charge pour l'extraction automatique : déposez un PDF, PNG, JPEG ou WEBP.",
      );
    }

    const content =
      mimeType === "application/pdf"
        ? await this.buildTextContent(buffer)
        : this.buildImageContent(buffer, mimeType);

    const responseContent = await this.callGroq(content);
    const parsed = ExtractedContractSchema.safeParse(
      JSON.parse(responseContent) as unknown,
    );
    if (!parsed.success) {
      this.logger.error(`Réponse Groq hors schéma : ${parsed.error.message}`);
      throw new ServiceUnavailableException(
        "Le contenu du fichier n'a pas pu être analysé. Remplissez le formulaire manuellement.",
      );
    }
    return parsed.data;
  }

  private async buildTextContent(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    let texte: string;
    try {
      const resultat = await parser.getText();
      texte = resultat.text;
    } catch (error) {
      this.logger.error(
        `Échec de la lecture du PDF : ${error instanceof Error ? error.message : "erreur inconnue"}`,
      );
      throw new BadRequestException(
        "Ce fichier PDF n'a pas pu être lu. Vérifiez qu'il n'est pas corrompu ou protégé par mot de passe.",
      );
    } finally {
      await parser.destroy();
    }

    if (texte.trim().length < TEXTE_PDF_MINIMUM) {
      throw new BadRequestException(
        "Ce PDF semble être un scan sans texte détectable (image de document) : l'extraction automatique ne peut pas le lire. Remplissez le formulaire manuellement.",
      );
    }

    return `${PROMPT}\n\n--- Contenu du contrat ---\n${texte}`;
  }

  private buildImageContent(
    buffer: Buffer,
    mimeType: string,
  ): GroqContentPart[] {
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    return [
      { type: "text", text: PROMPT },
      { type: "image_url", image_url: { url: dataUrl } },
    ];
  }

  private async callGroq(content: string | GroqContentPart[]): Promise<string> {
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
    const text = payload.choices?.[0]?.message?.content;
    if (!text) {
      throw new ServiceUnavailableException(
        "Le contenu du fichier n'a pas pu être analysé. Remplissez le formulaire manuellement.",
      );
    }
    return text;
  }

  private isSupported(mimeType: string): mimeType is SupportedMimeType {
    return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
  }
}
