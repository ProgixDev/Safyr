"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Download, FileSpreadsheet, FileText } from "lucide-react";

import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import {
  exporterCsvExcel,
  exporterPdf,
  type ColonneExport,
} from "@/lib/export-table";
import {
  CHAMPS_FICHIERS_PROCEDURE,
  TYPE_SANCTION_PAR_DEFAUT,
  dateFr,
  horodatage,
  type LigneProcedure,
  type LigneSanction,
  type LigneSanctionManuelle,
} from "./discipline-shared";
import { BADGE_VERT, BADGE_VIOLET, TEINTES } from "./discipline-theme";

const teinte = TEINTES.registre;

type Origine = "sanction" | "procedure" | "saisie";

/** Une ligne du registre, quelle que soit son origine. */
interface LigneRegistreSanction {
  /** Unique dans le registre : préfixé par l'origine. */
  cle: string;
  /** Identifiant de l'enregistrement d'origine (pour la suppression). */
  id: string;
  origine: Origine;
  employeeId: string;
  employeeName: string;
  date: string;
  type: string;
  reason: string;
  description: string;
  issuedBy: string;
  statut: string;
}

const ORIGINES: Record<Origine, string> = {
  sanction: "Sanction",
  procedure: "Procédure disciplinaire",
  saisie: "Saisie directe (ancien registre)",
};

const STATUTS_SANCTION = { active: "Active", lifted: "Levée" } as const;
const STATUTS_PROCEDURE = {
  ongoing: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
} as const;

const CHAMPS_FICHIERS_SANCTION = ["document"] as const;

const COLONNES_EXPORT: ColonneExport<LigneRegistreSanction>[] = [
  { titre: "Employé", valeur: (l) => l.employeeName },
  { titre: "Date", valeur: (l) => dateFr(l.date) },
  { titre: "Origine", valeur: (l) => ORIGINES[l.origine] },
  { titre: "Type de sanction", valeur: (l) => l.type },
  { titre: "Motif", valeur: (l) => l.reason },
  { titre: "Description", valeur: (l) => l.description },
  { titre: "Émis par", valeur: (l) => l.issuedBy },
  { titre: "Statut", valeur: (l) => l.statut },
];

export function SanctionsSection() {
  const employees = useEmployeeOptions();
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  // Le registre n'est plus saisi : il reprend automatiquement les sanctions
  // et les procédures disciplinaires enregistrées (mêmes lignes que celles
  // écrites par les écrans de création), plus l'ancienne saisie directe.
  const sanctions = useRegistre<LigneSanction>(
    "avertissement",
    CHAMPS_FICHIERS_SANCTION,
  );
  const procedures = useRegistre<LigneProcedure>(
    "procedure_disciplinaire",
    CHAMPS_FICHIERS_PROCEDURE,
  );
  const anciennes = useRegistre<LigneSanctionManuelle>(
    "sanction",
    CHAMPS_FICHIERS_SANCTION,
  );

  const [aConsulter, setAConsulter] = useState<LigneRegistreSanction | null>(
    null,
  );

  const lignes = useMemo<LigneRegistreSanction[]>(() => {
    const nom = (id: string | undefined) =>
      employees.find((e) => e.id === id)?.name ?? "Employé inconnu";

    const desSanctions = sanctions.lignes.map<LigneRegistreSanction>((l) => ({
      cle: `sanction-${l.id}`,
      id: l.id,
      origine: "sanction",
      employeeId: l.employeeId ?? "",
      employeeName: nom(l.employeeId),
      date: l.date ?? "",
      type: l.type || TYPE_SANCTION_PAR_DEFAUT,
      reason: l.reason ?? "",
      description: l.description ?? "",
      issuedBy: l.issuedBy ?? "",
      statut: STATUTS_SANCTION[l.status ?? "active"] ?? "",
    }));

    const desProcedures = procedures.lignes.map<LigneRegistreSanction>((l) => {
      const etapes = l.steps ?? [];
      const etapeCourante = etapes[(l.currentStep ?? 1) - 1];
      return {
        cle: `procedure-${l.id}`,
        id: l.id,
        origine: "procedure",
        employeeId: l.employeeId ?? "",
        employeeName: nom(l.employeeId),
        date: l.startDate ?? "",
        type: l.sanctionType || "Procédure disciplinaire",
        reason: l.reason ?? "",
        description: etapeCourante
          ? `Étape ${l.currentStep} sur ${etapes.length} : ${etapeCourante.title}`
          : "",
        issuedBy: l.issuedBy ?? "",
        statut: STATUTS_PROCEDURE[l.status ?? "ongoing"] ?? "",
      };
    });

    const desAnciennes = anciennes.lignes.map<LigneRegistreSanction>((l) => ({
      cle: `saisie-${l.id}`,
      id: l.id,
      origine: "saisie",
      employeeId: l.employeeId ?? "",
      employeeName: nom(l.employeeId),
      date: l.date ?? "",
      type: l.type ?? "",
      reason: l.reason ?? "",
      description: l.description ?? "",
      issuedBy: l.issuedBy ?? "",
      statut: "",
    }));

    return [...desSanctions, ...desProcedures, ...desAnciennes].sort(
      (a, b) => horodatage(b.date) - horodatage(a.date),
    );
  }, [sanctions.lignes, procedures.lignes, anciennes.lignes, employees]);

  const enChargement =
    sanctions.isLoading || procedures.isLoading || anciennes.isLoading;

  const suppressionAncienne = (ligne: LigneRegistreSanction) => {
    if (
      confirm(
        "Supprimer cette ancienne saisie du registre ? Les sanctions et procédures ne sont pas concernées.",
      )
    ) {
      void anciennes.supprimerLigne(ligne.id);
    }
  };

  const nomFichier = () =>
    `registre-des-sanctions-${new Date().toISOString().slice(0, 10)}`;

  const exporterEnPdf = () =>
    exporterPdf(nomFichier(), COLONNES_EXPORT, lignes, {
      titre: "Registre des sanctions",
      orientation: "landscape",
    });

  const exporterEnExcel = () =>
    exporterCsvExcel(nomFichier(), COLONNES_EXPORT, lignes, {
      titre: "Registre des sanctions",
    });

  const exporterLignePdf = async (ligne: LigneRegistreSanction) => {
    const { default: jsPDF } = await import("jspdf");
    const {
      PDF_FOOTER_RESERVED_MM,
      applyPdfFooters,
      drawPdfHeader,
      loadPdfBranding,
    } = await import("@/lib/pdf-branding");
    const branding = await loadPdfBranding();
    const doc = new jsPDF();
    let y =
      drawPdfHeader(doc, branding, { title: "SANCTION DISCIPLINAIRE" }) + 6;
    doc.setFontSize(11);
    const champs: [string, string][] = [
      ["Employé", ligne.employeeName],
      ["Date", dateFr(ligne.date)],
      ["Origine", ORIGINES[ligne.origine]],
      ["Type de sanction", ligne.type],
      ["Motif", ligne.reason],
      ["Émis par", ligne.issuedBy],
      ["Statut", ligne.statut],
      ["Description", ligne.description],
    ];
    for (const [libelle, valeur] of champs) {
      const texte = doc.splitTextToSize(`${libelle} : ${valeur || "—"}`, 170);
      if (y + texte.length * 6 > 297 - PDF_FOOTER_RESERVED_MM) {
        doc.addPage();
        y = 20;
      }
      doc.text(texte, 20, y);
      y += texte.length * 6 + 3;
    }
    applyPdfFooters(doc, branding);
    doc.save(`sanction-${ligne.id}.pdf`);
  };

  const columns: ColumnDef<LigneRegistreSanction>[] = [
    {
      key: "employeeName",
      label: "Employé",
      render: (ligne) => (
        <div className="font-medium">
          <Link
            href={`/dashboard/hr/employees/${ligne.employeeId}`}
            className="text-primary hover:underline"
          >
            {ligne.employeeName}
          </Link>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (ligne) => dateFr(ligne.date),
    },
    {
      key: "origine",
      label: "Origine",
      render: (ligne) => (
        <Badge
          variant="outline"
          className={ligne.origine === "procedure" ? BADGE_VIOLET : BADGE_VERT}
        >
          {ORIGINES[ligne.origine]}
        </Badge>
      ),
    },
    {
      key: "type",
      label: "Type de sanction",
      render: (ligne) => ligne.type,
    },
    {
      key: "reason",
      label: "Motif",
      render: (ligne) => ligne.reason,
    },
    {
      key: "issuedBy",
      label: "Émis par",
      render: (ligne) => ligne.issuedBy,
    },
    {
      key: "statut",
      label: "Statut",
      render: (ligne) => ligne.statut,
    },
    {
      key: "actions",
      label: "Actions",
      render: (ligne) => (
        <RowActionsMenu
          onView={() => setAConsulter(ligne)}
          onDelete={
            ligne.origine === "saisie"
              ? () => suppressionAncienne(ligne)
              : undefined
          }
          extraItems={[
            {
              label: "Exporter en PDF",
              icon: Download,
              tone: "download" as const,
              onClick: () => void exporterLignePdf(ligne),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`rounded-xl p-3 ${teinte.pastille}`}>
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${teinte.titre}`}>
              Registre des sanctions
            </h1>
            <p className="text-muted-foreground">
              Alimenté automatiquement par les sanctions et les procédures
              disciplinaires enregistrées
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className={teinte.bouton}
            onClick={() => void exporterEnPdf()}
            disabled={lignes.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button
            variant="outline"
            size="lg"
            className={teinte.bouton}
            onClick={exporterEnExcel}
            disabled={lignes.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
        </div>
      </div>

      <Card className={teinte.carte}>
        <CardHeader className={`rounded-t-xl ${teinte.entete}`}>
          <CardTitle className={teinte.titre}>
            Registre des sanctions ({lignes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={lignes}
            isLoading={enChargement}
            columns={columns}
            getRowId={(l) => l.cle}
            searchKeys={["employeeName", "type", "reason"]}
            searchPlaceholder="Rechercher une sanction..."
          />
        </CardContent>
      </Card>

      <Modal
        open={!!aConsulter}
        onOpenChange={(open) => !open && setAConsulter(null)}
        type="details"
        size="md"
        title="Détail de la sanction"
      >
        {aConsulter && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Employé : </span>
              {aConsulter.employeeName ||
                getEmployeeName(aConsulter.employeeId)}
            </p>
            <p>
              <span className="text-muted-foreground">Date : </span>
              {dateFr(aConsulter.date) || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Origine : </span>
              {ORIGINES[aConsulter.origine]}
            </p>
            <p>
              <span className="text-muted-foreground">Type de sanction : </span>
              {aConsulter.type || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Motif : </span>
              {aConsulter.reason || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Statut : </span>
              {aConsulter.statut || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Émis par : </span>
              {aConsulter.issuedBy || "—"}
            </p>
            <p className="whitespace-pre-wrap">
              <span className="text-muted-foreground">Description : </span>
              {aConsulter.description || "—"}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
