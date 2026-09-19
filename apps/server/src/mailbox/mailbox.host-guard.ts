import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Ports SMTP usuels uniquement : évite d'utiliser le serveur pour sonder d'autres services. */
export const ALLOWED_SMTP_PORTS = [25, 465, 587, 2525];

const HOSTNAME =
  /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function isValidHostname(host: string): boolean {
  return isIP(host) !== 0 || HOSTNAME.test(host);
}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) {
    const v = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    if (mapped) return isPrivateIPv4(mapped[1]);
    return (
      v === "::" ||
      v === "::1" ||
      v.startsWith("fc") ||
      v.startsWith("fd") ||
      v.startsWith("fe8") ||
      v.startsWith("fe9") ||
      v.startsWith("fea") ||
      v.startsWith("feb")
    );
  }
  return true;
}

/**
 * Vrai si le nom d'hôte résout (ou est) vers une adresse privée/locale.
 * Un nom qui ne résout pas n'est pas bloqué ici : la vérification SMTP
 * répondra « serveur introuvable ».
 */
export async function resolvesToPrivateAddress(host: string): Promise<boolean> {
  if (isIP(host) !== 0) return isPrivateAddress(host);
  try {
    const records = await lookup(host, { all: true });
    return records.some((r) => isPrivateAddress(r.address));
  } catch {
    return false;
  }
}
