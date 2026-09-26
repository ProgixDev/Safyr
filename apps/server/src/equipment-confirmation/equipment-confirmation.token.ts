import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

// Format : <charge utile JSON en base64url>.<signature HMAC-SHA256 en base64url>
const VERSION = 1;

/** Durée de validité du lien de confirmation. */
export const CONFIRMATION_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface ConfirmationPayload {
  /** Organisation propriétaire de la ligne. */
  organizationId: string;
  /** Identifiant de la ligne `fiscal_record` de type `equipement`. */
  recordId: string;
  /** Expiration, en secondes Unix. */
  exp: number;
}

export type ConfirmationTokenError = "malformed" | "invalid" | "expired";

export type ConfirmationTokenResult =
  | { ok: true; payload: ConfirmationPayload }
  | { ok: false; error: ConfirmationTokenError };

/**
 * Clé HMAC dérivée du secret serveur : pas de variable d'environnement de plus,
 * et une clé distincte de celle des autres usages du secret (HKDF, contexte
 * propre).
 */
export function deriveConfirmationKey(secret: string): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      secret,
      "safyr-equipment-confirmation-salt-v1",
      "safyr:equipment-confirmation:hmac-sha256",
      32,
    ),
  );
}

function sign(data: string, key: Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

export function signConfirmationToken(
  input: { organizationId: string; recordId: string },
  key: Buffer,
  now: Date = new Date(),
  ttlSeconds: number = CONFIRMATION_TTL_SECONDS,
): string {
  const payload = {
    v: VERSION,
    o: input.organizationId,
    r: input.recordId,
    exp: Math.floor(now.getTime() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${sign(body, key).toString("base64url")}`;
}

export function verifyConfirmationToken(
  token: string,
  key: Buffer,
  now: Date = new Date(),
): ConfirmationTokenResult {
  if (typeof token !== "string" || token.length > 1024) {
    return { ok: false, error: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, error: "malformed" };
  }
  const [body, signature] = parts;

  // Comparaison à temps constant ; longueurs égales exigées par timingSafeEqual.
  const attendue = sign(body, key);
  const recue = Buffer.from(signature, "base64url");
  if (recue.length !== attendue.length || !timingSafeEqual(recue, attendue)) {
    return { ok: false, error: "invalid" };
  }

  let brut: unknown;
  try {
    brut = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "malformed" };
  }
  const p = brut as Record<string, unknown> | null;
  if (
    !p ||
    p.v !== VERSION ||
    typeof p.o !== "string" ||
    typeof p.r !== "string" ||
    typeof p.exp !== "number"
  ) {
    return { ok: false, error: "malformed" };
  }
  if (p.exp * 1000 < now.getTime()) return { ok: false, error: "expired" };

  return {
    ok: true,
    payload: { organizationId: p.o, recordId: p.r, exp: p.exp },
  };
}
