import { describe, expect, it } from "bun:test";
import {
  decryptSecret,
  deriveMailboxKey,
  encryptSecret,
} from "../src/mailbox/mailbox.crypto";
import { isPrivateAddress } from "../src/mailbox/mailbox.host-guard";

const KEY = deriveMailboxKey("secret-serveur-de-test-0123456789");

describe("mailbox.crypto", () => {
  it("chiffre puis déchiffre, avec IV différent à chaque appel", () => {
    const a = encryptSecret("valeur-factice", KEY, "org_1");
    const b = encryptSecret("valeur-factice", KEY, "org_1");
    expect(a).not.toBe(b);
    expect(a.startsWith("v1:")).toBe(true);
    expect(a).not.toContain("valeur-factice");
    expect(decryptSecret(a, KEY, "org_1")).toBe("valeur-factice");
  });

  it("refuse une autre organisation, une autre clé ou un contenu altéré", () => {
    const payload = encryptSecret("valeur-factice", KEY, "org_1");
    expect(() => decryptSecret(payload, KEY, "org_2")).toThrow();
    expect(() =>
      decryptSecret(
        payload,
        deriveMailboxKey("un-autre-secret-0123456789"),
        "org_1",
      ),
    ).toThrow();
    const [v, iv, tag, data] = payload.split(":");
    const altere = [v, iv, tag, Buffer.from("x" + data).toString("base64")];
    expect(() => decryptSecret(altere.join(":"), KEY, "org_1")).toThrow();
  });
});

describe("mailbox.host-guard", () => {
  it("bloque les adresses privées et locales", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.1",
      "169.254.169.254",
      "172.20.0.1",
      "::1",
      "fd00::1",
    ]) {
      expect(isPrivateAddress(ip)).toBe(true);
    }
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });
});
