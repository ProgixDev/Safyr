// better-auth est ESM-only — wrappé en dynamic import pour rester
// compatible CommonJS (NestJS / Vercel serverless).

const statement = {
  employee: ["create", "read", "update", "delete"],
  payroll: ["read", "generate", "approve"],
  planning: ["read", "write", "publish"],
  billing: ["read", "write"],
  accounting: ["read", "write"],
  geolocation: ["read"],
  logbook: ["read", "write"],
} as const;

export async function buildAccessControl() {
  const [{ createAccessControl }, { defaultStatements, ownerAc }] =
    await Promise.all([
      import("better-auth/plugins/access"),
      import("better-auth/plugins/organization/access"),
    ]);

  const fullStatement = {
    ...defaultStatements,
    ...statement,
  } as const;

  const ac = createAccessControl(fullStatement);

  const owner = ac.newRole({
    ...ownerAc.statements,
    employee: ["create", "read", "update", "delete"],
    payroll: ["read", "generate", "approve"],
    planning: ["read", "write", "publish"],
    billing: ["read", "write"],
    accounting: ["read", "write"],
    geolocation: ["read"],
    logbook: ["read", "write"],
  });

  const agent = ac.newRole({
    employee: ["read"],
    planning: ["read"],
    logbook: ["read", "write"],
    geolocation: ["read"],
  });

  return {
    ac,
    safyrRoles: { owner, agent },
  };
}
