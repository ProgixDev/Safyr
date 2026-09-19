import { describe, expect, it, mock } from "bun:test";

// Transport factice : aucun accès réseau, aucun vrai identifiant.
let verifyError: unknown = null;
let lastAuth: { user: string; pass: string } | null = null;
mock.module("nodemailer", () => ({
  default: {
    createTransport: (opts: { auth: { user: string; pass: string } }) => {
      lastAuth = opts.auth;
      return {
        verify: async () => {
          if (verifyError) throw verifyError;
          return true;
        },
        close: () => undefined,
        sendMail: async () => ({}),
      };
    },
  },
}));

const { MailboxService } = await import("../src/mailbox/mailbox.service");

const FAKE_PASSWORD = "mot-de-passe-factice-123";

function makePrisma() {
  const rows: Record<string, unknown>[] = [];
  return {
    rows,
    fiscalRecord: {
      findFirst: async () => rows[0] ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        rows.push({ id: "r1", updatedAt: new Date(), ...data });
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        rows[0] = { ...rows[0], ...data, updatedAt: new Date() };
      },
      deleteMany: async () => {
        rows.length = 0;
      },
    },
  };
}

function makeService() {
  const prisma = makePrisma();
  const service = new MailboxService(
    { BETTER_AUTH_SECRET: "secret-serveur-de-test-0123456789" } as never,
    prisma as never,
  );
  return { prisma, service };
}

describe("MailboxService", () => {
  it("chiffre le secret, ne le renvoie jamais et permet l'envoi", async () => {
    verifyError = null;
    const { prisma, service } = makeService();
    const status = await service.connect(
      "org_1",
      { provider: "gmail", email: "test@example.com", password: FAKE_PASSWORD },
      true,
    );
    expect(status.connected).toBe(true);
    expect(status.email).toBe("test@example.com");
    expect(JSON.stringify(status)).not.toContain(FAKE_PASSWORD);
    expect(JSON.stringify(prisma.rows)).not.toContain(FAKE_PASSWORD);

    const sender = await service.getSender("org_1");
    expect(sender?.address).toBe("test@example.com");
    expect(lastAuth?.pass).toBe(FAKE_PASSWORD);
  });

  it("n'enregistre rien quand le fournisseur refuse (Gmail : mot de passe d'application)", async () => {
    verifyError = Object.assign(new Error("535 refused"), {
      code: "EAUTH",
      responseCode: 535,
    });
    const { prisma, service } = makeService();
    const attempt = service.connect(
      "org_1",
      { provider: "gmail", email: "test@example.com", password: FAKE_PASSWORD },
      true,
    );
    await expect(attempt).rejects.toThrow(/mot de passe d'application/);
    expect(prisma.rows.length).toBe(0);
  });

  it("refuse un serveur local pour « autre » et limite les tentatives", async () => {
    verifyError = null;
    const { service } = makeService();
    await expect(
      service.connect(
        "org_1",
        {
          provider: "autre",
          email: "a@b.fr",
          password: FAKE_PASSWORD,
          host: "127.0.0.1",
          port: 587,
        },
        true,
      ),
    ).rejects.toThrow(/serveur de messagerie public/);
    for (let i = 0; i < 4; i++) {
      await service
        .connect(
          "org_1",
          {
            provider: "autre",
            email: "a@b.fr",
            password: "x",
            host: "127.0.0.1",
            port: 587,
          },
          true,
        )
        .catch(() => undefined);
    }
    await expect(
      service.connect(
        "org_1",
        { provider: "gmail", email: "a@b.fr", password: "x" },
        true,
      ),
    ).rejects.toThrow(/Trop de tentatives/);
  });

  it("déconnecte et ne renvoie plus de transport", async () => {
    verifyError = null;
    const { service } = makeService();
    await service.connect(
      "org_1",
      { provider: "ovh", email: "a@b.fr", password: FAKE_PASSWORD },
      true,
    );
    await service.disconnect("org_1", true);
    expect(await service.getSender("org_1")).toBeNull();
  });
});
