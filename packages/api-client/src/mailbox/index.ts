import { apiFetch } from "../client";

export type MailboxProvider = "gmail" | "outlook" | "ovh" | "autre";

/** État de la boîte mail de la société : ne contient jamais le mot de passe. */
export interface MailboxStatus {
  connected: boolean;
  /** Vrai pour un propriétaire/administrateur (seul autorisé à connecter). */
  canManage: boolean;
  email?: string;
  provider?: MailboxProvider;
  host?: string;
  port?: number;
  secure?: boolean;
  lastVerifiedAt?: string;
}

export interface ConnectMailboxPayload {
  email: string;
  password: string;
  provider: MailboxProvider;
  host?: string;
  port?: number;
  secure?: boolean;
}

/** Codes d'erreur d'envoi qui demandent de (re)connecter la boîte mail. */
export const MAILBOX_ERROR_CODES = [
  "MAILBOX_NOT_CONNECTED",
  "MAILBOX_AUTH_FAILED",
] as const;

export const getMailboxStatus = () =>
  apiFetch<MailboxStatus>("/organization/mailbox");

// La vérification SMTP peut durer jusqu'à ~20 s : délai plus large que le défaut.
export const connectMailbox = (data: ConnectMailboxPayload) =>
  apiFetch<MailboxStatus>("/organization/mailbox", {
    method: "PUT",
    body: data,
    timeoutMs: 45_000,
  });

export const disconnectMailbox = () =>
  apiFetch<MailboxStatus>("/organization/mailbox", { method: "DELETE" });
