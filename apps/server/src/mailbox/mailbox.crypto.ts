import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

// Format : v1:<iv>:<tag>:<texte chiffré>, chaque partie en base64.
const VERSION = "v1";
const IV_BYTES = 12;

/**
 * Clé AES-256 dérivée (HKDF) du secret serveur : évite d'imposer une
 * variable d'environnement de plus. Contrepartie : changer le secret rend les
 * boîtes déjà enregistrées illisibles (elles sont alors à reconnecter).
 */
export function deriveMailboxKey(secret: string): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      secret,
      "safyr-mailbox-salt-v1",
      "safyr:mailbox-credentials:aes-256-gcm",
      32,
    ),
  );
}

/**
 * `aad` (l'identifiant de l'organisation) est authentifié avec le texte : une
 * valeur recopiée vers la ligne d'une autre organisation ne se déchiffre pas.
 */
export function encryptSecret(plain: string, key: Buffer, aad: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    VERSION,
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(":");
}

/** Lève une erreur générique si le format, la clé ou l'AAD ne correspondent pas. */
export function decryptSecret(
  payload: string,
  key: Buffer,
  aad: string,
): string {
  const [version, iv, tag, data] = payload.split(":");
  if (version !== VERSION || !iv || !tag || !data) {
    throw new Error("Format de secret non reconnu");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64"),
  );
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
