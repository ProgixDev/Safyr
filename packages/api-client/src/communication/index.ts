import { apiFetch } from "../client";
import { ApiError } from "../fetch";
import { MAILBOX_ERROR_CODES } from "../mailbox";

export interface SendEmailPayload {
  recipients: string[];
  subject: string;
  body: string;
  saveInArchive?: boolean;
}

export interface SendEmailResult {
  sent: number;
}

/** Événement window émis quand un envoi échoue faute de boîte mail utilisable. */
export const MAILBOX_REQUIRED_EVENT = "safyr:mailbox-required";

export interface MailboxRequiredDetail {
  code: string;
  message: string;
}

/**
 * Interception centrale : la fenêtre de connexion de la boîte mail s'ouvre
 * (voir MailboxPromptHost) ; l'appelant reçoit toujours l'erreur.
 */
export function signalerBoiteMailRequise(error: unknown): void {
  if (
    error instanceof ApiError &&
    (MAILBOX_ERROR_CODES as readonly string[]).includes(error.code) &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent<MailboxRequiredDetail>(MAILBOX_REQUIRED_EVENT, {
        detail: { code: error.code, message: error.message },
      }),
    );
  }
}

export async function sendCommunicationEmail(
  data: SendEmailPayload,
): Promise<SendEmailResult> {
  try {
    return await apiFetch<SendEmailResult>(
      "/organization/communication/send-email",
      { method: "POST", body: data },
    );
  } catch (error) {
    signalerBoiteMailRequise(error);
    throw error;
  }
}
