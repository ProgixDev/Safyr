import {
  authRequest,
  apiRequest,
  MobileApiError,
} from "@/lib/api-client";
import {
  clearSession,
  setBearerToken,
  setSession,
  type Session,
} from "./auth.storage";

export { MobileApiError };

type BetterAuthUser = {
  id: string;
  email: string;
  name: string;
};

type SignInOtpResponse = {
  user?: BetterAuthUser;
  token?: string;
  redirect?: boolean;
};

type GetSessionResponse = {
  user: BetterAuthUser;
  session: { id: string; expiresAt: string; token: string };
} | null;

export async function requestEmailOtp(email: string): Promise<void> {
  await authRequest("/email-otp/send-verification-otp", {
    method: "POST",
    body: { email: email.trim(), type: "sign-in" },
    auth: false,
  });
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
): Promise<Session> {
  const { data, bearer } = await authRequest<SignInOtpResponse>(
    "/sign-in/email-otp",
    {
      method: "POST",
      body: { email: email.trim(), otp: otp.trim() },
      auth: false,
    },
  );

  if (bearer) {
    await setBearerToken(bearer);
  }

  const user = data.user;
  if (!user) {
    throw new MobileApiError(500, "AUTH_NO_USER", "Réponse inattendue");
  }

  const session: Session = {
    userId: user.id,
    fullName: user.name,
    email: user.email,
  };
  await setSession(session);
  return session;
}

export async function fetchCurrentSession(): Promise<Session | null> {
  try {
    const { data } = await authRequest<GetSessionResponse>("/get-session");
    if (!data || !data.user) return null;
    const session: Session = {
      userId: data.user.id,
      fullName: data.user.name,
      email: data.user.email,
    };
    await setSession(session);
    return session;
  } catch (error) {
    if (error instanceof MobileApiError && error.status === 401) {
      await clearSession();
      return null;
    }
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await authRequest("/sign-out", { method: "POST" });
  } catch {
    // ignore — clear local state regardless
  }
  await clearSession();
}

export { apiRequest };
