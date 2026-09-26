import { createFetcher } from "./fetch";

const DEFAULT_ORIGIN = "http://localhost:4000";
const origin = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_ORIGIN;
export const apiBaseURL = `${origin.replace(/\/$/, "")}/api`;

export const apiFetch = createFetcher(apiBaseURL);
