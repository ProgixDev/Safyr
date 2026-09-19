import { z } from "zod";

// Messages en français : le contrôleur renvoie le premier tel quel.
export const ConnectMailboxSchema = z
  .object({
    provider: z.enum(["gmail", "outlook", "ovh", "autre"], {
      error: "Choisissez votre fournisseur de messagerie.",
    }),
    email: z
      .string("Saisissez l'adresse e-mail de la boîte.")
      .trim()
      .toLowerCase()
      .max(254, "Adresse e-mail trop longue.")
      .email("Adresse e-mail invalide."),
    password: z
      .string("Saisissez le mot de passe de la boîte.")
      .min(1, "Saisissez le mot de passe de la boîte.")
      .max(512, "Mot de passe trop long."),
    host: z.string().trim().max(253).optional(),
    port: z.coerce
      .number("Le port doit être un nombre.")
      .int("Le port doit être un nombre entier.")
      .optional(),
    secure: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider !== "autre") return;
    if (!value.host) {
      ctx.addIssue({
        code: "custom",
        path: ["host"],
        message: "Indiquez le serveur d'envoi (SMTP).",
      });
    }
    if (value.port === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["port"],
        message: "Indiquez le port du serveur d'envoi.",
      });
    }
  });

export type ConnectMailboxDto = z.infer<typeof ConnectMailboxSchema>;

export interface MailboxStatus {
  connected: boolean;
  /** Seuls les propriétaires/administrateurs peuvent connecter ou déconnecter. */
  canManage: boolean;
  email?: string;
  provider?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  lastVerifiedAt?: string;
}
