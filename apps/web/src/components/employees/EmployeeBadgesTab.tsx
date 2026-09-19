"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  FileSignature,
  Download,
  FlipHorizontal,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import QRCode from "qrcode";
import Image from "next/image";
import { useOrganization } from "@/hooks/organization";
import { useSignedUrl } from "@/hooks/storage";
import { useEmployeePhotoUrl } from "@/hooks/employees";
import { cn } from "@/lib/utils";

interface EmployeeBadgesTabProps {
  employee: Employee;
}

const STATUT_LABELS: Record<Employee["status"], string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  terminated: "Sorti",
};

/** Les dates absentes sont stockées à l'époque (1970) : on ne les affiche pas. */
function dateFr(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime()) || date.getFullYear() <= 1970) {
    return "—";
  }
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * jsPDF ne sait pas charger une image distante (URL signée) : on la convertit
 * en data URL, avec son format, pour que logo et photo apparaissent vraiment
 * dans le PDF.
 */
async function imageEnDataUrl(
  url: string | undefined,
): Promise<{ data: string; format: "PNG" | "JPEG" | "WEBP" } | null> {
  if (!url) return null;
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) return null;
    const blob = await reponse.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(String(lecteur.result));
      lecteur.onerror = () => reject(lecteur.error);
      lecteur.readAsDataURL(blob);
    });
    const format = data.startsWith("data:image/png")
      ? "PNG"
      : data.startsWith("data:image/webp")
        ? "WEBP"
        : "JPEG";
    return { data, format };
  } catch {
    return null;
  }
}

export function EmployeeBadgesTab({ employee }: EmployeeBadgesTabProps) {
  const selectedBadgeType = "access";
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Le badge reprend l'identité de l'entreprise : changer le logo ou l'adresse
  // sur la fiche Entreprise se répercute ici, sans rien coder en dur.
  const { data: organization } = useOrganization();
  const { data: logoUrl } = useSignedUrl(organization?.logo);
  // La photo est stockée en clé de bucket privé : on la résout en URL signée.
  const photoUrl = useEmployeePhotoUrl(employee.photo);

  const companyName = organization?.name ?? "—";
  const companyAddress = organization?.address ?? "";
  const companyPhone = organization?.phone ?? "";
  const authorizationNumber = organization?.authorizationNumber ?? "—";
  const cartePro = employee.cartePro?.trim() || "—";
  const initiales = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`;
  const nomComplet = `${employee.firstName} ${employee.lastName}`.trim();
  const anneeValidite = new Date().getFullYear();

  // Generate QR code on mount and when employee or badge type changes
  useEffect(() => {
    let annule = false;
    const qrData = `${companyName}-${employee.employeeNumber}-${selectedBadgeType}-${employee.id}`;
    QRCode.toDataURL(qrData, {
      width: 256,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!annule) setQrCodeUrl(url);
      })
      .catch((err) => console.error(err));
    return () => {
      annule = true;
    };
  }, [employee.id, employee.employeeNumber, companyName, selectedBadgeType]);

  /**
   * Génère le badge en PDF au format carte (85,6 × 54 mm), recto puis verso,
   * avec la même charte que l'aperçu (bandeau sombre à liseré cyan).
   */
  const handleDownloadBadge = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const [logo, photo] = await Promise.all([
        imageEnDataUrl(logoUrl),
        imageEnDataUrl(photoUrl),
      ]);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });

      const bandeau = () => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 85.6, 15, "F");
        doc.setFillColor(34, 211, 238);
        doc.rect(0, 15, 85.6, 1, "F");
      };

      // ── Recto ──
      bandeau();
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(3, 2.5, 10, 10, 1.5, 1.5, "F");
      if (logo) {
        try {
          doc.addImage(logo.data, logo.format, 3.6, 3.1, 8.8, 8.8);
        } catch {
          // Format d'image non supporté par jsPDF : badge sans logo.
        }
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(companyName.toUpperCase(), 16, 7.5, { maxWidth: 66 });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(165, 243, 252);
      doc.text("BADGE PROFESSIONNEL", 16, 11.5);

      // Photo (ou initiales)
      if (photo) {
        try {
          doc.addImage(photo.data, photo.format, 62.5, 19.5, 19, 24);
        } catch {
          // Photo non convertible : on retombe sur les initiales.
        }
      } else {
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(62.5, 19.5, 19, 24, 1.5, 1.5, "F");
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(initiales.toUpperCase(), 72, 33, { align: "center" });
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const lignesNom = doc.splitTextToSize(nomComplet.toUpperCase(), 54);
      doc.text(lignesNom.slice(0, 2), 4, 23);
      const yPoste = 23 + Math.min(lignesNom.length, 2) * 4.2 + 0.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(8, 145, 178);
      doc.text(employee.position || "", 4, yPoste, { maxWidth: 54 });

      const details: [string, string][] = [
        ["Matricule", employee.employeeNumber || "—"],
        ["Carte pro. CNAPS", cartePro],
        ["Né(e) le", dateFr(employee.dateOfBirth)],
      ];
      let y = 37;
      for (const [libelle, valeur] of details) {
        doc.setFontSize(5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(libelle.toUpperCase(), 4, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(15, 23, 42);
        doc.text(valeur, 28, y);
        y += 3.6;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(4, 49.3, 81.6, 49.3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Autorisation administrative : ${authorizationNumber}${
          companyAddress ? ` — ${companyAddress}` : ""
        }`,
        4,
        51.8,
        { maxWidth: 77 },
      );

      // ── Verso ──
      doc.addPage([85.6, 54], "landscape");
      bandeau();
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Code QR de vérification", 42.8, 9.5, { align: "center" });
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, "PNG", 33.8, 19, 18, 18);
      }
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(`Matricule : ${employee.employeeNumber}`, 42.8, 41.5, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Valide jusqu'au 31/12/${anneeValidite}`, 42.8, 45, {
        align: "center",
      });
      doc.setFontSize(4.5);
      doc.text(
        "Badge strictement personnel, à présenter à toute réquisition.",
        42.8,
        50.5,
        { align: "center", maxWidth: 78 },
      );

      doc.save(
        `badge-${employee.lastName}-${employee.employeeNumber}.pdf`.replace(
          /\s+/g,
          "-",
        ),
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const champ = (libelle: string, valeur: string) => (
    <div className="min-w-0">
      <dt className="text-[9px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {libelle}
      </dt>
      <dd className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">
        {valeur}
      </dd>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Badge Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Aperçu du badge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {/* Flip Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlipped(!isFlipped)}
              className="gap-2"
            >
              <FlipHorizontal className="h-4 w-4" />
              {isFlipped ? "Voir recto" : "Voir verso"}
            </Button>

            {/* Badge Card with flip animation */}
            <div
              className="relative w-full max-w-lg"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Recto */}
                <div
                  className={cn(
                    "flex aspect-[1.586/1] w-full flex-col overflow-hidden rounded-2xl border shadow-2xl",
                    "border-slate-200 bg-white text-slate-900",
                    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50",
                  )}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Bandeau de marque : logo + entreprise */}
                  <div className="flex items-center gap-3 bg-linear-to-r from-[#0f172a] via-[#155e75] to-[#22d3ee] px-4 py-2.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={companyName}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          Logo
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold uppercase tracking-wide text-white">
                        {companyName}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-100">
                        Badge professionnel
                      </p>
                    </div>
                    <ShieldCheck className="h-6 w-6 shrink-0 text-white/80" />
                  </div>

                  {/* Identité */}
                  <div className="flex min-h-0 flex-1 gap-4 px-4 py-3">
                    <div className="h-32 w-24 shrink-0 self-start overflow-hidden sm:h-36 sm:w-28 rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={employee.firstName}
                          width={112}
                          height={144}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                          {initiales.toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="space-y-1">
                        <h2 className="text-lg font-extrabold leading-tight tracking-tight">
                          {nomComplet.toUpperCase()}
                        </h2>
                        <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                          {employee.position}
                        </p>
                        <span className="inline-flex items-center rounded-full border border-green-600/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:border-green-500/40 dark:text-green-300">
                          {STATUT_LABELS[employee.status] ?? employee.status}
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {champ("Matricule", employee.employeeNumber || "—")}
                        {champ("Carte pro. CNAPS", cartePro)}
                        {champ("Né(e) le", dateFr(employee.dateOfBirth))}
                        {champ("Entrée le", dateFr(employee.hireDate))}
                      </dl>
                    </div>
                  </div>

                  {/* Pied : autorisation administrative et siège */}
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="truncate text-[9px] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">
                        Autorisation administrative :
                      </span>{" "}
                      {authorizationNumber}
                      {companyAddress ? ` — ${companyAddress}` : ""}
                    </p>
                  </div>
                </div>

                {/* Verso : QR code de vérification */}
                <div
                  className="absolute left-0 top-0 flex aspect-[1.586/1] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-700 bg-linear-to-br from-[#0f172a] via-[#155e75] to-[#0891b2] px-6 text-white shadow-2xl"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="text-center">
                    <h3 className="text-sm font-bold tracking-wide">
                      Code QR de vérification
                    </h3>
                    <p className="text-[11px] text-cyan-100">
                      Badge d&apos;accès — {companyName}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-2 shadow-lg">
                    {qrCodeUrl ? (
                      <Image
                        src={qrCodeUrl}
                        alt="QR Code"
                        width={128}
                        height={128}
                        unoptimized
                        className="h-32 w-32"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center bg-slate-200">
                        <span className="text-xs text-slate-500">
                          Génération...
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-semibold">
                      Matricule : {employee.employeeNumber}
                    </p>
                    <p className="text-[10px] text-cyan-100">
                      Valide jusqu&apos;au 31/12/{anneeValidite}
                    </p>
                    <p className="mt-1 text-[9px] text-cyan-100/80">
                      Badge strictement personnel, à présenter à toute
                      réquisition
                      {companyPhone ? ` — ${companyPhone}` : ""}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={() => void handleDownloadBadge()}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger le badge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
