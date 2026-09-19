"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  FileSignature,
  FileText,
  FolderOpen,
  Receipt,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAttachments } from "@/hooks/contracts";
import { useRegistre } from "@/hooks/fiscal";
import { pickFile } from "@/lib/document-files";
import {
  TEINTES,
  normaliserStatutDossier,
  type Teinte,
} from "@/components/safety-training/couleurs";
import { BadgeStatutDossier } from "@/components/safety-training/statut-dossier";
import { MenuPiece } from "@/components/safety-training/menu-piece";

const URL_AKTO = "/dashboard/hr/safety-health-training/training-plan/akto";

/** Les trois pièces d'un dossier de financement, avec leur couleur de repère. */
const TYPES_DOCUMENT = [
  { key: "devis", label: "Devis", teinte: "bleu" },
  { key: "convention", label: "Convention", teinte: "violet" },
  { key: "facture", label: "Facture", teinte: "vert" },
] as const satisfies readonly { key: string; label: string; teinte: Teinte }[];

type TypeDocument = (typeof TYPES_DOCUMENT)[number]["key"];

const CHAMPS_PIECES = TYPES_DOCUMENT.map((t) => t.key);

/** Ce dont la page a besoin d'un dossier ; le reste de la ligne n'est pas modifié ici. */
interface LigneDossier {
  id: string;
  reference: string;
  type: "AKTO" | "OPCO";
  title: string;
  status?: string;
}

interface DocumentAkto {
  id: string;
  slot: TypeDocument;
  name: string;
  storageKey: string;
  createdAt: string;
  size: number;
  dossierId: string;
  reference: string;
  title: string;
  financeur: "AKTO" | "OPCO";
  statut: ReturnType<typeof normaliserStatutDossier>;
}

const formaterTaille = (octets: number) =>
  octets >= 1024 * 1024
    ? `${(octets / (1024 * 1024)).toFixed(1)} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;

export default function DocumentsAktoPage() {
  const registre = useRegistre<LigneDossier>("akto", CHAMPS_PIECES);
  const { data: pieces = [] } = useAttachments("akto");
  const dossiers = registre.lignes;

  const documents: DocumentAkto[] = pieces.flatMap((piece) => {
    const dossier = dossiers.find((d) => d.id === piece.scopeId);
    const type = TYPES_DOCUMENT.find((t) => t.key === piece.slot);
    // Pièce d'un dossier supprimé, ou emplacement inconnu : rien à afficher.
    if (!dossier || !type) return [];
    return [
      {
        id: piece.id,
        slot: type.key,
        name: piece.name,
        storageKey: piece.storageKey,
        createdAt: piece.createdAt,
        size: piece.size,
        dossierId: dossier.id,
        reference: dossier.reference,
        title: dossier.title,
        financeur: dossier.type,
        statut: normaliserStatutDossier(dossier.status),
      },
    ];
  });

  const nombreDe = (type: TypeDocument) =>
    documents.filter((d) => d.slot === type).length;
  const dossiersIncomplets = dossiers.filter((dossier) =>
    TYPES_DOCUMENT.some(
      (t) =>
        !documents.some((d) => d.dossierId === dossier.id && d.slot === t.key),
    ),
  ).length;

  // --- Téléversement ---
  const [ouvert, setOuvert] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [type, setType] = useState<TypeDocument>("devis");
  const [dossierId, setDossierId] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  const ouvrirTeleversement = () => {
    setType("devis");
    setDossierId("");
    setFichier(null);
    setOuvert(true);
  };

  const remplace = documents.find(
    (d) => d.dossierId === dossierId && d.slot === type,
  );

  const televerser = async () => {
    if (!dossierId || !fichier) return;
    setEnvoiEnCours(true);
    try {
      await registre.attacherFichier(dossierId, type, fichier);
      setOuvert(false);
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const remplacer = async (document: DocumentAkto) => {
    try {
      const nouveau = await pickFile();
      if (!nouveau) return;
      await registre.attacherFichier(
        document.dossierId,
        document.slot,
        nouveau,
      );
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const supprimer = (document: DocumentAkto) => {
    if (confirm(`Supprimer « ${document.name} » ?`)) {
      void registre.retirerPiece(document.dossierId, document.slot);
    }
  };

  const columns: ColumnDef<DocumentAkto>[] = [
    {
      key: "slot",
      label: "Type de document",
      sortable: true,
      render: (document) => {
        const type = TYPES_DOCUMENT.find((t) => t.key === document.slot)!;
        return (
          <Badge variant="outline" className={TEINTES[type.teinte]}>
            {type.label}
          </Badge>
        );
      },
    },
    {
      key: "name",
      label: "Fichier",
      sortable: true,
      render: (document) => (
        <span className="font-medium" title={document.name}>
          {document.name}
        </span>
      ),
    },
    {
      key: "reference",
      label: "Dossier",
      sortable: true,
      render: (document) => (
        <div>
          <p className="text-sm font-medium">{document.reference}</p>
          <p className="text-xs text-muted-foreground">{document.title}</p>
        </div>
      ),
    },
    {
      key: "financeur",
      label: "Financeur",
      render: (document) => (
        <Badge
          variant={document.financeur === "AKTO" ? "default" : "secondary"}
        >
          {document.financeur}
        </Badge>
      ),
    },
    {
      key: "statut",
      label: "Statut du dossier",
      render: (document) => <BadgeStatutDossier statut={document.statut} />,
    },
    {
      key: "createdAt",
      label: "Ajouté le",
      sortable: true,
      render: (document) =>
        new Date(document.createdAt).toLocaleDateString("fr-FR"),
    },
    {
      key: "size",
      label: "Taille",
      render: (document) => (
        <span className="text-xs text-muted-foreground">
          {formaterTaille(document.size)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-1">
            <Link href={URL_AKTO}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Dossiers AKTO et OPCO
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Documents AKTO</h1>
          <p className="text-muted-foreground">
            Devis, conventions de formation et factures rattachés aux dossiers
            AKTO et OPCO
          </p>
        </div>
        <Button onClick={ouvrirTeleversement} disabled={dossiers.length === 0}>
          <Upload className="mr-2 h-4 w-4" />
          Téléverser un document
        </Button>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={FileText}
          title="Devis"
          value={nombreDe("devis")}
          color="blue"
        />
        <InfoCard
          icon={FileSignature}
          title="Conventions"
          value={nombreDe("convention")}
          color="purple"
        />
        <InfoCard
          icon={Receipt}
          title="Factures"
          value={nombreDe("facture")}
          color="green"
        />
        <InfoCard
          icon={FileCheck2}
          title="Dossiers incomplets"
          value={dossiersIncomplets}
          subtext="Il manque au moins une pièce"
          color="orange"
        />
      </InfoCardContainer>

      {dossiers.length === 0 && !registre.isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <FolderOpen className="h-5 w-5 text-blue-500" />
          <span>
            Aucun dossier AKTO ou OPCO : créez d&apos;abord un dossier pour
            pouvoir y rattacher des documents.{" "}
            <Link href={URL_AKTO} className="text-primary underline">
              Aller aux dossiers
            </Link>
          </span>
        </div>
      )}

      <DataTable
        data={documents}
        isLoading={registre.isLoading}
        columns={columns}
        searchKeys={["name", "reference", "title"]}
        getSearchValue={(d) => `${d.name} ${d.reference} ${d.title}`}
        searchPlaceholder="Rechercher un document ou un dossier..."
        getRowId={(d) => d.id}
        filters={[
          {
            key: "slot",
            label: "Type de document",
            options: TYPES_DOCUMENT.map((t) => ({
              value: t.key,
              label: t.label,
            })),
          },
          {
            key: "financeur",
            label: "Financeur",
            options: [
              { value: "AKTO", label: "AKTO" },
              { value: "OPCO", label: "OPCO" },
            ],
          },
        ]}
        actions={(document) => (
          <MenuPiece
            fichier={{ name: document.name, key: document.storageKey }}
            onUpload={() => void remplacer(document)}
            onDelete={() => supprimer(document)}
          />
        )}
      />

      <Modal
        open={ouvert}
        onOpenChange={setOuvert}
        type="form"
        title="Téléverser un document AKTO"
        size="lg"
        actions={{
          primary: {
            label: envoiEnCours ? "Envoi en cours..." : "Téléverser",
            onClick: () => void televerser(),
            disabled: !dossierId || !fichier || envoiEnCours,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setOuvert(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="type-document">Type de document</Label>
            <Select
              value={type}
              onValueChange={(valeur) => setType(valeur as TypeDocument)}
            >
              <SelectTrigger id="type-document">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENT.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Dossier AKTO / OPCO lié</Label>
            <Combobox
              options={dossiers.map((d) => ({
                value: d.id,
                label: `${d.reference} — ${d.title}`,
              }))}
              value={dossierId}
              onValueChange={setDossierId}
              placeholder="Sélectionner un dossier"
              searchPlaceholder="Rechercher un dossier..."
              emptyMessage="Aucun dossier trouvé."
            />
          </div>

          <div>
            <Label htmlFor="fichier-akto">Fichier</Label>
            <Input
              id="fichier-akto"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
          </div>

          {remplace && (
            <p className="rounded-md border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
              Ce dossier a déjà un document de ce type (« {remplace.name} ») :
              il sera remplacé par le nouveau fichier.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
