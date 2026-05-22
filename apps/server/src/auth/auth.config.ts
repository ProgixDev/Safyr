import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin,
  bearer,
  emailOTP,
  magicLink,
  organization,
  twoFactor,
  username,
} from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import type { PrismaClient } from "../../generated/prisma/client";
import type { Env } from "@/config/env";
import type { EmailService } from "@/email/email.service";
import { ac, safyrRoles } from "./auth.access-control";

interface AuthDeps {
  env: Env;
  prisma: PrismaClient;
  email: EmailService;
}

export function createAuth({ env, prisma, email }: AuthDeps) {
  const plugins = [
    organization({
      ac,
      roles: safyrRoles,
      schema: {
        organization: {
          additionalFields: {
            siret: { type: "string", required: false, input: true },
            ape: { type: "string", required: false, input: true },
            address: { type: "string", required: false, input: true },
            shareCapital: { type: "string", required: false, input: true },
            authorizationNumber: {
              type: "string",
              required: false,
              input: true,
            },
            email: { type: "string", required: false, input: true },
            phone: { type: "string", required: false, input: true },
            representativeId: { type: "string", required: false, input: true },
          },
        },
        member: {
          additionalFields: {
            firstName: { type: "string", required: false, input: true },
            lastName: { type: "string", required: false, input: true },
            phone: { type: "string", required: false, input: true },
            birthDate: { type: "date", required: false, input: true },
            birthPlace: { type: "string", required: false, input: true },
            nationality: { type: "string", required: false, input: true },
            address: { type: "string", required: false, input: true },
            position: { type: "string", required: false, input: true },
            appointmentDate: { type: "date", required: false, input: true },
            socialSecurityNumber: {
              type: "string",
              required: false,
              input: true,
            },
            email: { type: "string", required: false, input: true },
            employeeNumber: { type: "string", required: false, input: true },
            hireDate: { type: "date", required: false, input: true },
            contractType: { type: "string", required: false, input: true },
            workSchedule: { type: "string", required: false, input: true },
            status: { type: "string", required: false, input: true },
            gender: { type: "string", required: false, input: true },
            civilStatus: { type: "string", required: false, input: true },
            children: { type: "number", required: false, input: true },
            terminatedAt: { type: "date", required: false, input: true },
          },
        },
      },
    }),
    magicLink({
      sendMagicLink: async ({ email: to, url }) => {
        await email.sendMagicLink(to, { url });
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email: to, otp, type }) {
        await email.sendOtp(to, otp, { type });
      },
    }),
    bearer(),
    admin(),
    username(),
    twoFactor(),
    expo(),
  ];

  const isProd = env.NODE_ENV === "production";

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.ALLOWED_ORIGINS,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: false },
    plugins,
    advanced: {
      // En dev (localhost HTTP) on ne peut pas utiliser le préfixe __Secure-
      // ni Secure=true ni SameSite=None — le navigateur refuse le cookie.
      useSecureCookies: isProd,
      defaultCookieAttributes: {
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        httpOnly: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
