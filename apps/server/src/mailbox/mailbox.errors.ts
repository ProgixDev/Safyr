import { HttpException, HttpStatus } from "@nestjs/common";

export const MAILBOX_NOT_CONNECTED_MESSAGE =
  "Connectez la boîte mail de votre société pour envoyer des e-mails.";

/** Erreur métier de la boîte mail : le front lit `code` pour ouvrir la fenêtre de connexion. */
export class MailboxException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string) {
    super({ code, message }, status);
  }
}

/** Boîte connectée mais refusée par le fournisseur (mot de passe changé/révoqué). */
export function mailboxAuthFailed(address?: string): MailboxException {
  return new MailboxException(
    HttpStatus.PRECONDITION_FAILED,
    "MAILBOX_AUTH_FAILED",
    `La boîte mail de votre société${address ? ` (${address})` : ""} a refusé la connexion : le mot de passe a sans doute été changé ou révoqué. Reconnectez-la pour envoyer des e-mails.`,
  );
}

export function mailboxNotConnected(): MailboxException {
  return new MailboxException(
    HttpStatus.PRECONDITION_FAILED,
    "MAILBOX_NOT_CONNECTED",
    MAILBOX_NOT_CONNECTED_MESSAGE,
  );
}

const GMAIL_APP_PASSWORD_MESSAGE =
  "Google refuse ce mot de passe. Gmail n'accepte pas le mot de passe habituel pour l'envoi depuis une application : activez la validation en 2 étapes puis créez un « mot de passe d'application » (Compte Google → Sécurité → Mots de passe d'application) et saisissez-le ici.";

export type MailboxProvider = "gmail" | "outlook" | "ovh" | "autre";

const AUTH_REFUSED_MESSAGES: Record<MailboxProvider, string> = {
  gmail: GMAIL_APP_PASSWORD_MESSAGE,
  outlook:
    "Microsoft refuse ces identifiants. Vérifiez l'adresse et le mot de passe ; si la validation en 2 étapes est activée, utilisez un mot de passe d'application. L'envoi SMTP authentifié doit aussi être autorisé pour cette boîte (à activer par l'administrateur Microsoft 365).",
  ovh: "OVH refuse ces identifiants. Vérifiez que l'adresse e-mail est complète et que le mot de passe est bien celui de cette boîte.",
  autre:
    "Le serveur refuse ces identifiants. Vérifiez l'adresse e-mail et le mot de passe.",
};

/**
 * Traduit une erreur nodemailer/SMTP en message français. Le texte brut de
 * l'erreur ne sert qu'à la classer : il n'est ni renvoyé ni journalisé.
 */
export function describeConnectError(
  error: unknown,
  ctx: { provider: MailboxProvider; host: string; port: number },
): MailboxException {
  const e = (error ?? {}) as {
    code?: string;
    responseCode?: number;
    message?: unknown;
  };
  const code = e.code ?? "";
  const smtp = e.responseCode;

  if (
    code === "EAUTH" ||
    (smtp !== undefined && [530, 534, 535].includes(smtp))
  ) {
    return new MailboxException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "MAILBOX_CREDENTIALS_REFUSED",
      AUTH_REFUSED_MESSAGES[ctx.provider],
    );
  }

  // nodemailer écrase le code d'origine (ECONNREFUSED, ENOTFOUND…) par ESOCKET
  // ou ECONNECTION : on affine sur le texte.
  const hint = typeof e.message === "string" ? e.message : "";
  if (code === "EDNS" || /ENOTFOUND|EAI_AGAIN/i.test(hint)) {
    return new MailboxException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "MAILBOX_HOST_NOT_FOUND",
      `Le serveur « ${ctx.host} » est introuvable. Vérifiez l'adresse du serveur.`,
    );
  }
  if (/certificate|self.signed|altnames/i.test(hint)) {
    return new MailboxException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "MAILBOX_CERTIFICATE_INVALID",
      `Le certificat de sécurité du serveur ${ctx.host} n'est pas valide. Vérifiez l'adresse du serveur.`,
    );
  }
  if (code === "ETLS" || /wrong version number|ssl routines|tls/i.test(hint)) {
    return new MailboxException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "MAILBOX_TLS_MISMATCH",
      `Impossible d'ouvrir une connexion sécurisée avec ${ctx.host}:${ctx.port}. Vérifiez le port et l'option SSL (en général : port 465 avec SSL activé, port 587 avec SSL désactivé).`,
    );
  }
  if (["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(code)) {
    return new MailboxException(
      HttpStatus.BAD_GATEWAY,
      "MAILBOX_UNREACHABLE",
      `Impossible de joindre le serveur ${ctx.host}:${ctx.port} (connexion refusée ou délai dépassé). Vérifiez le serveur et le port, puis réessayez.`,
    );
  }
  return new MailboxException(
    HttpStatus.BAD_GATEWAY,
    "MAILBOX_VERIFY_FAILED",
    "La vérification de la boîte mail a échoué. Contrôlez les informations saisies puis réessayez.",
  );
}
