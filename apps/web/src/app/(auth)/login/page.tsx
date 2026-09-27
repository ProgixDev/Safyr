import Link from "next/link";
import { Metadata } from "next";
import { LoginForm } from "./login-form";
import "../auth.css";

export const metadata: Metadata = {
  title: "Connexion - Safyr",
  description: "Connectez-vous à votre espace Safyr",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated geometric pattern background */}
      <div className="absolute inset-0 auth-pattern-login" />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(53,122,183,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(167,139,250,0.1)_0%,transparent_50%)]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(53,122,183,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(53,122,183,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-8 xl:p-16 pt-24">
          {/* Main message */}
          <div className="space-y-6">
            <h1 className="text-3xl xl:text-5xl font-bold text-white leading-tight">
              La plateforme tout-en-un pour sociétés de sécurité
            </h1>
            <p className="text-lg text-[#94a3b8] max-w-md leading-relaxed">
              Gérez vos agents, la paie, la facturation, le planning et la
              géolocalisa­tion depuis une interface unique et sécurisée.
            </p>
          </div>
        </div>

        {/* Right side - login form */}
        <div className="w-full lg:w-1/2 xl:w-[45%] flex items-start justify-center p-4 sm:p-6 lg:p-8 xl:p-12 pt-10 lg:pt-12 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Form card */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-linear-to-r from-[#357AB7]/20 via-[#a78bfa]/20 to-[#357AB7]/20 rounded-2xl blur-xl opacity-50" />

              <div className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-[#2d4160]/60 rounded-2xl p-5 sm:p-6 xl:p-10">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Bon retour
                  </h2>
                  <p className="text-[#64748b] text-sm">
                    Connectez-vous à votre espace de travail
                  </p>
                </div>

                <LoginForm />

                {/* Sign up link */}
                <p className="mt-6 text-center text-sm text-[#64748b]">
                  Pas encore de compte ?{" "}
                  <Link
                    href="/register"
                    className="text-[#357AB7] hover:text-[#295F8E] font-medium transition-colors"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-[#475569]">
              En vous connectant, vous acceptez nos{" "}
              <a
                href="#"
                className="text-[#64748b] hover:text-[#94a3b8] underline underline-offset-2"
              >
                Conditions
              </a>{" "}
              et notre{" "}
              <a
                href="#"
                className="text-[#64748b] hover:text-[#94a3b8] underline underline-offset-2"
              >
                Politique de confidentialité
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
