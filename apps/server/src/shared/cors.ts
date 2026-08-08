/**
 * Origines autorisées (CORS).
 *
 * `ALLOWED_ORIGINS` liste les origines exactes. Le problème constaté en
 * production : l'application web est joignable sur plusieurs domaines Vercel
 * (`safyr-web`, `safyr-web-gold`, `safyr`, plus une URL par déploiement de
 * prévisualisation) alors qu'une seule était déclarée. Le navigateur bloquait
 * alors le pré-vol des requêtes POST/PATCH/DELETE : les listes s'affichaient
 * (GET simple) mais **aucune création n'aboutissait** — d'où les remarques
 * « quand on ajoute un client, rien ne s'ajoute ».
 *
 * On accepte donc en plus des motifs avec `*` dans `ALLOWED_ORIGINS`, où `*`
 * remplace un seul segment de domaine. Valeur recommandée en production :
 *
 *   ALLOWED_ORIGINS=https://safyr.vercel.app,https://safyr-*.vercel.app
 *
 * Le motif reste volontairement étroit (`safyr-*` et non `*`) : avec
 * `credentials: true`, autoriser tout `*.vercel.app` reviendrait à laisser
 * n'importe quel site hébergé chez Vercel appeler l'API avec les cookies de
 * session de l'utilisateur.
 */

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, "[^.]*")}$`);
}

export function buildCorsOriginMatcher(allowed: string[]) {
  const exact = new Set(allowed.filter((o) => !o.includes("*")));
  const patterns = allowed
    .filter((o) => o.includes("*"))
    .map((o) => patternToRegExp(o));

  return (
    origin: string | undefined,
    callback: (err: Error | null, allow: boolean) => void,
  ): void => {
    // Requêtes sans origine (serveur à serveur, curl, health checks).
    if (!origin) {
      callback(null, true);
      return;
    }
    const ok =
      exact.has(origin) || patterns.some((pattern) => pattern.test(origin));
    callback(null, ok);
  };
}

export const CORS_OPTIONS = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Organization-Id",
    "X-Requested-With",
    "Accept",
  ],
} as const;
