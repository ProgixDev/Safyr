import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Les types générés par `next build` (.next/types) ne sont pas du code
    // source : sans ce motif, un build local ajoutait plus de 330 erreurs
    // fantômes au rapport de lint.
    "**/.next/**",
  ]),
]);

export default eslintConfig;
