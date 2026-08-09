"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { FileSignature, Download, FlipHorizontal, Loader2 } from "lucide-react";
import type { Employee } from "@/lib/types";
import QRCode from "qrcode";
import Image from "next/image";
import { useOrganization } from "@/hooks/organization";
import { useSignedUrl } from "@/hooks/storage";
import { useEmployeePhotoUrl } from "@/hooks/employees";

interface EmployeeBadgesTabProps {
  employee: Employee;
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
  const authorizationNumber = organization?.authorizationNumber ?? "—";
  const cartePro = employee.cartePro?.trim() || "—";

  const generateQRCode = async (data: string) => {
    try {
      const url = await QRCode.toDataURL(data, {
        width: 256,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(url);
      return url;
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  // Generate QR code on mount and when employee or badge type changes
  useEffect(() => {
    const generateQR = async () => {
      const qrData = `${companyName}-${employee.employeeNumber}-${selectedBadgeType}-${employee.id}`;
      await generateQRCode(qrData);
    };
    generateQR();
  }, [employee.id, employee.employeeNumber, companyName, selectedBadgeType]);

  /**
   * Génère le badge en PDF au format carte (85,6 × 54 mm), recto puis verso.
   * Le bouton se contentait auparavant d'un console.log.
   */
  const handleDownloadBadge = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });

      // ── Recto ──
      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 4, 4, 14, 14, undefined, "FAST");
        } catch {
          // Format d'image non supporté par jsPDF : on garde le badge sans logo.
        }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(companyName.toUpperCase(), 4, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.text(companyAddress, 4, 25, { maxWidth: 45 });

      if (photoUrl) {
        try {
          doc.addImage(photoUrl, 62, 4, 20, 20, undefined, "FAST");
        } catch {
          // Photo distante non convertible : badge genere sans photo.
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        `${employee.firstName.toUpperCase()} ${employee.lastName.toUpperCase()}`,
        42.8,
        34,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(employee.position, 42.8, 38, { align: "center" });

      doc.setFontSize(5);
      doc.text(`Matricule : ${employee.employeeNumber}`, 4, 44);
      doc.text(
        `Né(e) le : ${employee.dateOfBirth.toLocaleDateString("fr-FR")}`,
        4,
        46.5,
      );
      doc.text(`Carte professionnelle : ${cartePro}`, 4, 49);
      doc.text(`Autorisation administrative : ${authorizationNumber}`, 4, 51.5);

      // ── Verso ──
      doc.addPage([85.6, 54], "landscape");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Code QR de vérification", 42.8, 8, { align: "center" });
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 31, 11, 24, 24);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(`Matricule : ${employee.employeeNumber}`, 42.8, 40, {
        align: "center",
      });
      doc.text(`Valide jusqu'au 31/12/${new Date().getFullYear()}`, 42.8, 44, {
        align: "center",
      });

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
                {/* Front Side */}
                <div
                  className="bg-white shadow-xl w-full aspect-[1.586/1] p-0 overflow-hidden border border-gray-200"
                  style={{
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Top Section with Logo and Photo */}
                  <div className="flex items-start justify-between p-3 pb-2">
                    {/* Logo Section */}
                    <div className="flex flex-col items-start">
                      <div className="w-20 h-20 mb-1">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={companyName}
                            width={80}
                            height={80}
                            unoptimized
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center border border-dashed border-gray-300 text-[9px] text-gray-400">
                            Logo
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase leading-tight text-gray-900">
                          {companyName}
                        </p>
                        <p className="text-[9px] font-semibold leading-tight text-gray-800">
                          Siège social
                        </p>
                        <p className="text-[8px] leading-tight mt-0.5 text-gray-700">
                          {companyAddress || "Adresse non renseignée"}
                        </p>
                      </div>
                    </div>

                    {/* Photo - Square */}
                    <div className="shrink-0">
                      <div className="h-24 w-24 border border-gray-300 overflow-hidden">
                        {photoUrl ? (
                          <Image
                            src={photoUrl}
                            alt={employee.firstName}
                            width={96}
                            height={96}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-lg font-semibold text-gray-400">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name and Title */}
                  <div className="px-3 pt-1 pb-2 text-center">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {employee.firstName.toUpperCase()}{" "}
                      {employee.lastName.toUpperCase()}
                    </h2>
                    <p className="text-sm font-semibold text-blue-700 mt-0.5">
                      {employee.position}
                    </p>
                  </div>

                  {/* Professional Card Info */}
                  <div className="px-3 pb-2">
                    <h3 className="text-[10px] font-bold mb-1 text-gray-900">
                      Carte professionnelle :
                    </h3>
                    <div className="text-[9px] space-y-0.5 text-gray-900">
                      <div>
                        <span className="font-semibold">Matricule : </span>
                        <span>{employee.employeeNumber}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Né le : </span>
                        <span>
                          {employee.dateOfBirth.toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Carte : </span>
                        <span>{cartePro}</span>
                      </div>
                      <div>
                        <span className="font-semibold">
                          Autorisation administrative :{" "}
                        </span>
                        <span>{authorizationNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Side with QR Code */}
                <div
                  className="absolute top-0 left-0 bg-white shadow-xl w-full aspect-[1.586/1] flex flex-col items-center justify-center border border-gray-200"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full py-4">
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-bold mb-1 text-gray-900">
                        Code QR de vérification
                      </h3>
                      <p className="text-xs text-gray-700">
                        Badge d&apos;accès
                      </p>
                    </div>

                    <div className="border-2 border-gray-800 p-2 bg-white">
                      {qrCodeUrl ? (
                        <Image
                          src={qrCodeUrl}
                          alt="QR Code"
                          width={144}
                          height={144}
                          unoptimized
                          className="w-36 h-36"
                        />
                      ) : (
                        <div className="w-36 h-36 bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            Génération...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-center">
                      <p className="text-[10px] text-gray-700 font-semibold">
                        Matricule: {employee.employeeNumber}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        Valide jusqu&apos;au 31/12/{new Date().getFullYear()}
                      </p>
                    </div>
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
