import { createSafyrAuthClient } from "@safyr/api-client/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const authClient = createSafyrAuthClient({ baseURL });

export const { useSession, signIn, signOut, magicLink } = authClient;
