import Constants from "expo-constants";
import { getBearerToken } from "@/features/auth/auth.storage";

const DEFAULT_ORIGIN = "http://localhost:4000";

function resolveOrigin(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return (fromExtra ?? fromEnv ?? DEFAULT_ORIGIN).replace(/\/$/, "");
}

export const API_ORIGIN = resolveOrigin();
export const API_BASE = `${API_ORIGIN}/api`;

export class MobileApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "MobileApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
};

async function buildHeaders(
  body: unknown,
  custom: Record<string, string> | undefined,
  auth: boolean,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...custom,
  };
  if (auth) {
    const token = await getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    if (response.ok) return undefined as T;
    throw new MobileApiError(
      response.status,
      "HTTP_ERROR",
      response.statusText || "Erreur HTTP",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new MobileApiError(
      response.status,
      "PARSE_ERROR",
      "Réponse JSON invalide",
    );
  }

  const value = parsed as
    | { success: true; data: T }
    | {
        success: false;
        error: { code: string; message: string; details?: unknown };
      };

  if (typeof value === "object" && value && "success" in value) {
    if (value.success === false) {
      throw new MobileApiError(
        response.status,
        value.error.code,
        value.error.message,
        value.error.details,
      );
    }
    return value.data;
  }

  if (!response.ok) {
    throw new MobileApiError(
      response.status,
      "HTTP_ERROR",
      response.statusText || "Erreur HTTP",
    );
  }

  return parsed as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const body = options.body;
  const headers = await buildHeaders(body, options.headers, options.auth !== false);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    throw new MobileApiError(0, "NETWORK_ERROR", "Connexion impossible", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  return parseEnvelope<T>(response);
}

export async function authRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; bearer: string | null }> {
  const body = options.body;
  const headers = await buildHeaders(body, options.headers, options.auth ?? true);

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}/api/auth${path}`, {
      method: options.method ?? "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    throw new MobileApiError(0, "NETWORK_ERROR", "Connexion impossible", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  const bearer = response.headers.get("set-auth-token");

  const text = await response.text();
  if (!response.ok) {
    let message = response.statusText || "Erreur d'authentification";
    let code = "AUTH_ERROR";
    try {
      const parsed = JSON.parse(text) as {
        message?: string;
        code?: string;
      };
      if (parsed.message) message = parsed.message;
      if (parsed.code) code = parsed.code;
    } catch {
      // ignore parse error
    }
    throw new MobileApiError(response.status, code, message);
  }

  const data = text ? (JSON.parse(text) as T) : (undefined as T);
  return { data, bearer };
}
