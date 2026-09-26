import { describe, expect, it } from "bun:test";
import {
  CONFIRMATION_TTL_SECONDS,
  deriveConfirmationKey,
  signConfirmationToken,
  verifyConfirmationToken,
} from "../src/equipment-confirmation/equipment-confirmation.token";

const KEY = deriveConfirmationKey("secret-serveur-de-test-0123456789");
const INPUT = { organizationId: "org_1", recordId: "rec_1" };

describe("equipment-confirmation.token", () => {
  it("signe puis vérifie, avec organisation, ligne et expiration ~30 jours", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const token = signConfirmationToken(INPUT, KEY, now);
    const res = verifyConfirmationToken(token, KEY, now);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.organizationId).toBe("org_1");
      expect(res.payload.recordId).toBe("rec_1");
      expect(res.payload.exp).toBe(
        Math.floor(now.getTime() / 1000) + CONFIRMATION_TTL_SECONDS,
      );
    }
  });

  it("refuse une charge utile falsifiée (autre organisation ou autre ligne)", () => {
    const token = signConfirmationToken(INPUT, KEY);
    const [body, signature] = token.split(".");
    const forge = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    forge.o = "org_2";
    const corps = Buffer.from(JSON.stringify(forge)).toString("base64url");
    expect(verifyConfirmationToken(`${corps}.${signature}`, KEY)).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("refuse une signature altérée, tronquée ou signée avec une autre clé", () => {
    const token = signConfirmationToken(INPUT, KEY);
    const [body, signature] = token.split(".");
    const altere = `${body}.${signature.slice(0, -2)}AA`;
    expect(verifyConfirmationToken(altere, KEY).ok).toBe(false);
    expect(
      verifyConfirmationToken(`${body}.${signature.slice(2)}`, KEY).ok,
    ).toBe(false);
    const autreCle = deriveConfirmationKey("un-autre-secret-0123456789-xx");
    expect(verifyConfirmationToken(token, autreCle)).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("refuse un jeton expiré", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const token = signConfirmationToken(INPUT, KEY, now);
    const apres = new Date(
      now.getTime() + (CONFIRMATION_TTL_SECONDS + 1) * 1000,
    );
    expect(verifyConfirmationToken(token, KEY, apres)).toEqual({
      ok: false,
      error: "expired",
    });
    const avant = new Date(now.getTime() + 29 * 24 * 3600 * 1000);
    expect(verifyConfirmationToken(token, KEY, avant).ok).toBe(true);
  });

  it("refuse les entrées mal formées", () => {
    for (const t of ["", "abc", "a.b.c", ".", "x".repeat(2000)]) {
      expect(verifyConfirmationToken(t, KEY).ok).toBe(false);
    }
  });
});
