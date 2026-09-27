"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import "../auth.css";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Simulate verification (in real app this would be automatic from URL token)
  const handleVerify = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setVerified(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated geometric pattern background */}
      <div className="absolute inset-0 auth-pattern-verify" />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(96,165,250,0.12)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(53,122,183,0.08)_0%,transparent_50%)]" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#60a5fa] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>

          {/* Form card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-[#60a5fa]/20 via-[#3b82f6]/20 to-[#60a5fa]/20 rounded-2xl blur-xl opacity-50" />

            <div className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-[#2d4160]/60 rounded-2xl p-8 xl:p-10">
              {verified ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 size={32} className="text-green-400" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    E-mail vérifié
                  </h2>
                  <p className="text-[#64748b] mb-8">
                    Votre adresse e-mail a été vérifiée avec succès. Vous pouvez
                    maintenant accéder à votre compte.
                  </p>
                  <motion.button
                    onClick={() => (window.location.href = "/dashboard")}
                    className="w-full h-12 rounded-xl bg-linear-to-r from-[#60a5fa] to-[#3b82f6] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(96,165,250,0.4)] transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Accéder au tableau de bord
                  </motion.button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#60a5fa]/10 flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} className="text-[#60a5fa]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Vérifiez votre e-mail
                  </h2>
                  <p className="text-[#64748b] mb-6">
                    Nous avons envoyé un lien de vérification à votre adresse
                    e-mail. Cliquez sur le lien pour activer votre compte.
                  </p>

                  <div className="p-4 rounded-xl bg-[#1e293b]/80 border border-[#2d4160]/60 mb-6">
                    <p className="text-sm text-[#94a3b8] mb-3">
                      Vous n&apos;avez pas reçu l&apos;e-mail ?
                    </p>
                    <button
                      onClick={handleVerify}
                      disabled={loading}
                      className="text-sm text-[#60a5fa] hover:text-[#3b82f6] transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Renvoi en cours...
                        </>
                      ) : (
                        "Renvoyer l'e-mail de vérification"
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[#475569]">
                    Le lien expire dans 24 heures
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
