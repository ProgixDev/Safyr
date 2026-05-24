"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type LoginMode = "password" | "otp" | "magic-link";
type Status = "idle" | "sending" | "verifying" | "error";
const LOGIN_DRAFT_KEY = "safyr-login-draft";

interface LoginDraft {
  mode: LoginMode;
  email: string;
  otpRequested: boolean;
  otpRequestedEmail: string | null;
}

function getLoginDraft(): LoginDraft {
  const defaults: LoginDraft = {
    mode: "password",
    email: "",
    otpRequested: false,
    otpRequestedEmail: null,
  };

  if (typeof window === "undefined") return defaults;

  const rawDraft = sessionStorage.getItem(LOGIN_DRAFT_KEY);
  if (!rawDraft) return defaults;

  try {
    const draft = JSON.parse(rawDraft) as Partial<LoginDraft>;
    const mode: LoginMode =
      draft.mode === "magic-link" || draft.mode === "otp" || draft.mode === "password"
        ? draft.mode
        : "password";
    return {
      mode,
      email: typeof draft.email === "string" ? draft.email : "",
      otpRequested: Boolean(draft.otpRequested),
      otpRequestedEmail:
        typeof draft.otpRequestedEmail === "string"
          ? draft.otpRequestedEmail
          : null,
    };
  } catch {
    sessionStorage.removeItem(LOGIN_DRAFT_KEY);
    return defaults;
  }
}

export function LoginForm() {
  const router = useRouter();
  const [draft] = useState<LoginDraft>(() => getLoginDraft());
  const [mode, setMode] = useState<LoginMode>(draft.mode);
  const [email, setEmail] = useState(draft.email);
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(draft.otpRequested);
  const [otpRequestedEmail, setOtpRequestedEmail] = useState(
    draft.otpRequestedEmail,
  );
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem(
      LOGIN_DRAFT_KEY,
      JSON.stringify({ mode, email, otpRequested, otpRequestedEmail }),
    );
  }, [mode, email, otpRequested, otpRequestedEmail]);

  const requestOtp = async () => {
    const targetEmail = email.trim();
    setStatus("sending");
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: targetEmail,
      type: "sign-in",
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Impossible d'envoyer le code");
      return false;
    }

    setOtpRequested(true);
    setOtpRequestedEmail(targetEmail);
    setMagicLinkSent(false);
    setStatus("idle");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === "password") {
      setStatus("verifying");
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message ?? "Email ou mot de passe invalide");
        return;
      }
      sessionStorage.removeItem(LOGIN_DRAFT_KEY);
      router.replace("/dashboard");
      return;
    }

    if (mode === "otp") {
      if (!otpRequested) {
        await requestOtp();
        return;
      }

      setStatus("verifying");
      const verificationEmail = otpRequestedEmail ?? email.trim();
      const { error } = await authClient.signIn.emailOtp({
        email: verificationEmail,
        otp,
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message ?? "Code invalide");
        return;
      }

      sessionStorage.removeItem(LOGIN_DRAFT_KEY);
      router.replace("/dashboard");
      return;
    }

    setStatus("sending");
    const targetEmail = email.trim();
    const { error } = await authClient.signIn.magicLink({
      email: targetEmail,
      callbackURL: `${window.location.origin}/dashboard`,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Impossible d'envoyer le lien");
      return;
    }

    sessionStorage.removeItem(LOGIN_DRAFT_KEY);
    setMagicLinkSent(true);
    setStatus("idle");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#2d4160]/60 bg-[#111c30]/60 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setStatus("idle");
            setErrorMessage(null);
            setMagicLinkSent(false);
            setOtpRequested(false);
            setOtp("");
          }}
          className={`h-10 min-h-10 rounded-lg text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] ${
            mode === "password"
              ? "bg-[#22d3ee] text-[#0f172a]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          Mot de passe
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("otp");
            setStatus("idle");
            setErrorMessage(null);
            setMagicLinkSent(false);
          }}
          className={`h-10 min-h-10 rounded-lg text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] ${
            mode === "otp"
              ? "bg-[#22d3ee] text-[#0f172a]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          Code OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("magic-link");
            setStatus("idle");
            setErrorMessage(null);
            setOtpRequested(false);
            setOtpRequestedEmail(null);
            setOtp("");
          }}
          className={`h-10 min-h-10 rounded-lg text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] ${
            mode === "magic-link"
              ? "bg-[#22d3ee] text-[#0f172a]"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          Lien magique
        </button>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#94a3b8]"
        >
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            const nextEmail = e.target.value;
            setEmail(nextEmail);
            setMagicLinkSent(false);

            if (
              mode === "otp" &&
              otpRequested &&
              nextEmail.trim() !== (otpRequestedEmail ?? email.trim())
            ) {
              setOtpRequested(false);
              setOtpRequestedEmail(null);
              setOtp("");
              setStatus("idle");
              setErrorMessage(null);
            }
          }}
          placeholder="vous@entreprise.com"
          className="w-full h-12 px-4 rounded-xl bg-[#1e293b]/80 border border-[#2d4160]/60 text-white placeholder:text-[#475569] focus:outline-none focus:border-[#22d3ee]/50 focus:ring-2 focus:ring-[#22d3ee]/20 transition-[border-color,box-shadow] duration-200"
        />
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#94a3b8]"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-12 px-4 rounded-xl bg-[#1e293b]/80 border border-[#2d4160]/60 text-white placeholder:text-[#475569] focus:outline-none focus:border-[#22d3ee]/50 focus:ring-2 focus:ring-[#22d3ee]/20 transition-[border-color,box-shadow] duration-200"
          />
        </div>
      )}

      {mode === "otp" && otpRequested && (
        <div className="space-y-2">
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-[#94a3b8]"
          >
            Code reçu par e-mail
          </label>
          <div className="flex justify-center">
            <InputOTP
              id="otp"
              required
              maxLength={6}
              value={otp}
              onChange={setOtp}
              inputMode="numeric"
              pattern="[0-9]*"
              containerClassName="justify-center"
              className="text-white tabular-nums"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-12 w-12 bg-[#1e293b]/80" />
                <InputOTPSlot index={1} className="h-12 w-12 bg-[#1e293b]/80" />
                <InputOTPSlot index={2} className="h-12 w-12 bg-[#1e293b]/80" />
              </InputOTPGroup>
              <InputOTPSeparator className="text-[#64748b]" />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="h-12 w-12 bg-[#1e293b]/80" />
                <InputOTPSlot index={4} className="h-12 w-12 bg-[#1e293b]/80" />
                <InputOTPSlot index={5} className="h-12 w-12 bg-[#1e293b]/80" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      )}

      {mode === "otp" && otpRequested && (
        <button
          type="button"
          onClick={() => {
            void requestOtp();
          }}
          className="inline-flex h-10 min-h-10 items-center text-sm text-[#22d3ee] hover:text-[#06b6d4] transition-[color,transform] duration-150 ease-out active:scale-[0.96]"
        >
          Renvoyer le code
        </button>
      )}

      {mode === "magic-link" && magicLinkSent && (
        <p className="text-sm text-[#94a3b8] text-pretty">
          Lien envoyé. Vérifiez votre boîte de réception.
        </p>
      )}

      {errorMessage && (
        <p className="text-sm text-red-400 text-pretty" role="alert">
          {errorMessage}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={
          status === "sending" ||
          status === "verifying" ||
          (mode === "otp" && otpRequested && otp.trim().length === 0)
        }
        className="w-full h-12 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] text-[#0f172a] font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-[box-shadow,opacity,transform] duration-300 will-change-transform disabled:opacity-70 disabled:cursor-not-allowed"
        whileHover={{
          scale: status === "sending" || status === "verifying" ? 1 : 1.01,
        }}
        whileTap={{
          scale: status === "sending" || status === "verifying" ? 1 : 0.96,
        }}
      >
        {status === "sending" || status === "verifying" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {status === "verifying" ? "Vérification..." : "Envoi..."}
          </>
        ) : (
          <>
            {mode === "password"
              ? "Se connecter"
              : mode === "otp"
                ? otpRequested
                  ? "Valider le code"
                  : "Recevoir un code"
                : "Recevoir un lien de connexion"}
          </>
        )}
      </motion.button>

      <p className="text-xs text-[#64748b] text-center text-pretty">
        Le code OTP est la méthode par défaut. Vous pouvez aussi utiliser un
        lien magique.
      </p>
    </form>
  );
}
