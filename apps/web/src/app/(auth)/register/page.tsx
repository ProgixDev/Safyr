import Link from "next/link";
import { Metadata } from "next";
import { RegisterForm } from "./register-form";
import "../auth.css";

export const metadata: Metadata = {
  title: "Créer un compte - Safyr",
  description: "Créez votre compte Safyr",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated geometric pattern background */}
      <div className="absolute inset-0 auth-pattern-register" />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(53,122,183,0.1)_0%,transparent_50%)]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(167,139,250,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-8 xl:p-16 pt-24">
          {/* Main message */}
          <div className="space-y-6">
            <h1 className="text-3xl xl:text-5xl font-bold text-white leading-tight">
              Rejoignez les leaders du secteur
            </h1>
            <p className="text-lg text-[#94a3b8] max-w-md leading-relaxed">
              Simplifiez votre pilotage RH, comptabilité et opérations avec une
              solution adaptée aux sociétés de sécurité privée.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {[
              "Mise en place en 24h",
              "Formation incluse",
              "Support dédié",
              "Sans engagement",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-[#94a3b8]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Right side - register form */}
        <div className="w-full lg:w-1/2 xl:w-[45%] flex items-start justify-center p-4 sm:p-6 lg:p-8 xl:p-12 pt-10 lg:pt-12 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Form card */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-linear-to-r from-[#a78bfa]/20 via-[#357AB7]/20 to-[#a78bfa]/20 rounded-2xl blur-xl opacity-50" />

              <div
                className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-[#2d4160]/60 rounded-2xl p-5 sm:p-6 xl:p-8 overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 180px)" }}
              >
                {/* Header */}
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                    Créer un compte
                  </h2>
                  <p className="text-[#64748b] text-sm">
                    Commencez votre essai gratuit
                  </p>
                </div>

                <RegisterForm />
              </div>
            </div>

            {/* Sign in link */}
            <p className="mt-5 text-center text-sm text-[#64748b]">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-[#a78bfa] hover:text-[#8b5cf6] font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>

            {/* Footer */}
            <p className="mt-4 text-center text-xs text-[#475569]">
              En créant un compte, vous acceptez nos{" "}
              <Link
                href="#"
                className="text-[#64748b] hover:text-[#94a3b8] underline underline-offset-2"
              >
                Conditions
              </Link>{" "}
              et notre{" "}
              <Link
                href="#"
                className="text-[#64748b] hover:text-[#94a3b8] underline underline-offset-2"
              >
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
