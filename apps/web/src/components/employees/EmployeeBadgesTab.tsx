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
import { formatDateFr } from "@/lib/employee-adapter";
import type { jsPDF } from "jspdf";

interface EmployeeBadgesTabProps {
  employee: Employee;
}

const STATUT_LABELS: Record<Employee["status"], string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  terminated: "Sorti",
};

/** Taille de police du numéro affiché : plus il est long, plus elle est petite. */
function taillePolice(valeur: string): string {
  if (valeur.length <= 13) return "text-xs";
  if (valeur.length <= 22) return "text-[11px]";
  return "text-[10px]";
}

/**
 * Coupe `texte` en lignes de `largeur` mm au plus, au caractère près : un
 * numéro sans espace (carte pro, autorisation) ne se coupe pas avec
 * splitTextToSize et débordait du badge.
 */
function couperParCaracteres(
  doc: jsPDF,
  texte: string,
  largeur: number,
): string[] {
  const lignes: string[] = [];
  let courante = "";
  for (const c of texte) {
    if (courante && doc.getTextWidth(courante + c) > largeur) {
      lignes.push(courante);
      courante = c;
    } else {
      courante += c;
    }
  }
  if (courante) lignes.push(courante);
  return lignes;
}

/**
 * Écrit `texte` en réduisant la police (de `max` à `min` pt) jusqu'à ce qu'il
 * tienne sur une ligne de `largeur` mm ; à défaut, il passe sur plusieurs
 * lignes. Retourne le nombre de lignes écrites.
 */
function ecrireAjuste(
  doc: jsPDF,
  texte: string,
  x: number,
  y: number,
  largeur: number,
  max: number,
  min: number,
  options: { align?: "left" | "center"; interligne?: number } = {},
): number {
  let taille = max;
  doc.setFontSize(taille);
  while (taille > min && doc.getTextWidth(texte) > largeur) {
    taille -= 0.25;
    doc.setFontSize(taille);
  }
  const lignes =
    doc.getTextWidth(texte) > largeur
      ? couperParCaracteres(doc, texte, largeur)
      : [texte];
  const pas = options.interligne ?? taille * 0.3528 * 1.15;
  lignes.forEach((ligne, k) =>
    doc.text(ligne, x, y + k * pas, { align: options.align ?? "left" }),
  );
  return lignes.length;
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

/**
 * Recadre l'image pour qu'elle REMPLISSE exactement son cadre (recadrage
 * « cover », coins arrondis, fond blanc sous les transparences) : jsPDF
 * étirerait sinon l'image, ou laisserait des bandes blanches. La largeur suit
 * le ratio de l'image dans la limite [largeurMin ; largeurMax] (mm).
 */
async function imageDansCadre(
  data: string,
  hauteurMm: number,
  largeurMin: number,
  largeurMax: number,
  rayonMm: number,
): Promise<{ data: string; largeurMm: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new window.Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("image illisible"));
      i.src = data;
    });
    if (!img.naturalWidth || !img.naturalHeight) return null;
    const ratio = img.naturalWidth / img.naturalHeight;
    const largeurMm = Math.min(
      largeurMax,
      Math.max(largeurMin, hauteurMm * ratio),
    );
    const PX_PAR_MM = 12;
    const w = Math.round(largeurMm * PX_PAR_MM);
    const h = Math.round(hauteurMm * PX_PAR_MM);
    const r = rayonMm * PX_PAR_MM;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const echelle = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * echelle;
    const dh = img.naturalHeight * echelle;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return { data: canvas.toDataURL("image/png"), largeurMm };
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
      const [logoBrut, photoBrute] = await Promise.all([
        imageEnDataUrl(logoUrl),
        imageEnDataUrl(photoUrl),
      ]);
      // Logo et photo sont recadrés pour remplir exactement leur cadre.
      const [logo, photo] = await Promise.all([
        logoBrut ? imageDansCadre(logoBrut.data, 10, 10, 22, 1.5) : null,
        photoBrute ? imageDansCadre(photoBrute.data, 24, 19, 19, 1.5) : null,
      ]);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });

      const bandeau = () => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 85.6, 15, "F");
        doc.setFillColor(53, 122, 183);
        doc.rect(0, 15, 85.6, 1, "F");
      };

      // ── Recto ──
      bandeau();
      let largeurLogo = 10;
      if (logo) {
        largeurLogo = logo.largeurMm;
        try {
          doc.addImage(logo.data, "PNG", 3, 2.5, logo.largeurMm, 10);
        } catch {
          // Image refusée par jsPDF : badge sans logo.
        }
      } else {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(3, 2.5, 10, 10, 1.5, 1.5, "F");
      }
      const xTitre = 3 + largeurLogo + 3;
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      ecrireAjuste(
        doc,
        companyName.toUpperCase(),
        xTitre,
        7.5,
        82 - xTitre,
        7.5,
        5,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(165, 243, 252);
      doc.text("BADGE PROFESSIONNEL", xTitre, 11.5);

      // Photo (ou initiales)
      if (photo) {
        try {
          doc.addImage(photo.data, "PNG", 62.5, 19.5, 19, 24);
        } catch {
          // Photo refusée par jsPDF : on retombe sur les initiales.
        }
      } else {
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(62.5, 19.5, 19, 24, 1.5, 1.5, "F");
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(initiales.toUpperCase(), 72, 33, { align: "center" });
      }

      // Nom sur une ligne si possible (police réduite), sinon deux lignes.
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      const lignesNom = ecrireAjuste(
        doc,
        nomComplet.toUpperCase(),
        4,
        22.5,
        54,
        10,
        7.5,
      );
      const yPoste = 22.5 + (lignesNom - 1) * 3.4 + 3.9;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(8, 145, 178);
      ecrireAjuste(doc, employee.position || "", 4, yPoste, 54, 7, 5.5);

      // Détails : la valeur se réduit puis passe à la ligne plutôt que de
      // déborder du badge (ou de passer sous la photo).
      const details: [string, string][] = [
        ["Matricule", employee.employeeNumber || "—"],
        ["Carte pro. CNAPS", cartePro],
        ["Né(e) le", formatDateFr(employee.dateOfBirth)],
        ["Entrée le", formatDateFr(employee.hireDate)],
      ];
      let y = yPoste + 4.4;
      for (const [libelle, valeur] of details) {
        doc.setFontSize(4.8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(libelle.toUpperCase(), 4, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        const largeurValeur = (y < 44 ? 60.5 : 81.6) - 27;
        const lignes = ecrireAjuste(
          doc,
          valeur,
          27,
          y,
          largeurValeur,
          6.5,
          4.8,
          { interligne: 2.2 },
        );
        y += 3.3 + (lignes - 1) * 2.2;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(4, 47.6, 81.6, 47.6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      ecrireAjuste(
        doc,
        `Autorisation administrative : ${authorizationNumber}${
          companyAddress ? ` — ${companyAddress}` : ""
        }`,
        4,
        50.2,
        77.6,
        4.5,
        3.8,
        { interligne: 1.9 },
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
      ecrireAjuste(
        doc,
        `Matricule : ${employee.employeeNumber || "—"}`,
        42.8,
        41.5,
        78,
        6.5,
        4.8,
        { align: "center", interligne: 2.4 },
      );
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      ecrireAjuste(
        doc,
        "Badge strictement personnel, à présenter à toute réquisition.",
        42.8,
        48.5,
        78,
        4.8,
        3.8,
        { align: "center", interligne: 2 },
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

  // Le numéro s'affiche EN ENTIER : police adaptée à sa longueur et retour à
  // la ligne au caractère près, jamais de troncature.
  const champ = (libelle: string, valeur: string, className?: string) => (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[9px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {libelle}
      </dt>
      <dd
        className={cn(
          "break-all font-semibold leading-tight text-slate-900 dark:text-slate-50",
          taillePolice(valeur),
        )}
      >
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
                  <div className="flex items-center gap-3 bg-linear-to-r from-[#0f172a] via-[#295F8E] to-[#357AB7] px-4 py-2.5">
                    {/* Cadre du logo : il épouse l'image, qui le remplit
                        entièrement (aucune marge blanche autour). */}
                    <div className="flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={companyName}
                          width={96}
                          height={44}
                          unoptimized
                          className="block h-11 w-auto min-w-11 max-w-24 object-cover"
                        />
                      ) : (
                        <span className="px-3 text-xs font-bold text-slate-400">
                          Logo
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-sm font-bold uppercase leading-tight tracking-wide text-white">
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
                      <dl className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                        {champ("Matricule", employee.employeeNumber || "—")}
                        {champ("Né(e) le", formatDateFr(employee.dateOfBirth))}
                        {champ("Entrée le", formatDateFr(employee.hireDate))}
                        {champ("Carte pro. CNAPS", cartePro, "col-span-3")}
                      </dl>
                    </div>
                  </div>

                  {/* Pied : autorisation administrative et siège */}
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="line-clamp-2 break-words text-[9px] leading-tight text-slate-600 dark:text-slate-300">
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
                  className="absolute left-0 top-0 flex aspect-[1.586/1] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-700 bg-linear-to-br from-[#0f172a] via-[#295F8E] to-[#235179] px-6 text-white shadow-2xl"
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
                    <p className="break-all text-[11px] font-semibold leading-tight">
                      Matricule : {employee.employeeNumber || "—"}
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
