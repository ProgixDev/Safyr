// Vercel Serverless entry — proxies to the compiled NestJS handler.
import type { IncomingMessage, ServerResponse } from "node:http";

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require("../apps/server/dist/serverless");

// nest build (commonjs) exposes `exports.default = handler`,
// but esbuild's CJS interop may wrap once more.
function pickHandler(m: unknown): Handler {
  if (typeof m === "function") return m as Handler;
  if (m && typeof (m as { default?: unknown }).default === "function") {
    return (m as { default: Handler }).default;
  }
  if (
    m &&
    typeof (m as { default?: { default?: unknown } }).default === "object" &&
    typeof (m as { default: { default?: unknown } }).default.default ===
      "function"
  ) {
    return (m as { default: { default: Handler } }).default.default;
  }
  throw new Error(
    `Cannot resolve serverless handler from module. Keys: ${
      m && typeof m === "object" ? Object.keys(m).join(",") : typeof m
    }`,
  );
}

const compiledHandler = pickHandler(mod);

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return compiledHandler(req, res);
}
