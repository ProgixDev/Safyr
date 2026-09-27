"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";
import "../auth.css";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated geometric pattern background */}
      <div className="absolute inset-0 auth-pattern-forgot" />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.12)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(53,122,183,0.08)_0%,transparent_50%)]" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#fb923c] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>

          {/* Form card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-[#fb923c]/20 via-[#f59e0b]/20 to-[#fb923c]/20 rounded-2xl blur-xl opacity-50" />

            <div className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-[#2d4160]/60 rounded-2xl p-8 xl:p-10">
              <ForgotPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
