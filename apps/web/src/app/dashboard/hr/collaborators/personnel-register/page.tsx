"use client";

import { useMemo, useState } from "react";
import { useEmployees } from "@/hooks/employees";
import { useFichesEmploi } from "@/hooks/employees/use-fiche-emploi";
import type { Contract } from "@/lib/types";
import type { OffboardingProcess } from "@/data/hr-offboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Users,
  FileText,
  Calendar,
  UserCheck,
  Loader2,
} from "lucide-react";
import {
  EMPLOYEE_POSTE_OPTIONS,
  QUALIFICATION_OPTIONS,
} from "@/lib/hr-options";
import { dateVersChamp, formatDateFr } from "@/lib/employee-adapter";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";
import {
  OPTIONS_TYPE_CONTRAT,
  carteExpiree,
  construireLignes,
  differences,
  entreeDeBase,
  exporterRegistreExcel,
  exporterRegistrePdf,
  libelleContrat,
  type EnregistrementRegistre,
  type EntreeRegistre,
  type LigneRegistre,
  type StatutCadre,
} from "./registre-personnel";

const dateMs = (d: Date | undefined) =>
  d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;

const VIDE = "—";

/** Couleur du badge du type de contrat. */
const varianteContrat = (t: EntreeRegistre["contractType"]) =>
  t === "CDI" ? "info" : t === "CDD" ? "warning" : "neutral";

export default function PersonnelRegisterPage() {
  const { data: employes = [], isLoading } = useEmployees();
  const { ficheDe } = useFichesEmploi();
  // Registres lus en base pour compléter le dossier : sorties et contrats.
  const [sorties] = useListePersistante<OffboardingProcess>("sortie_salarie");
  const [contrats] = useListePersistante<Contract>("contrat_rh");

  // Le registre est calculé à partir des dossiers salariés : une ligne par
  // salarié. Seules les valeurs modifiées sur cet écran sont enregistrées (voir
  // handleSave) ; rien n'est écrit à l'affichage, sinon chaque visite
  // recréait tous les salariés en double.
  const [enregistrees, setEnregistrees] =
    useListePersistante<EnregistrementRegistre>("registre_personnel");
  const lignes = useMemo(
    () =>
      construireLignes({
        employes,
        ficheDe,
        sorties,
        contrats,
        enregistrees,
      }),
    [employes, ficheDe, sorties, contrats, enregistrees],
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingLigne = viewingId
    ? (lignes.find((l) => l.id === viewingId) ?? null)
    : null;
  const viewingEntry = viewingLigne?.entree ?? null;
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterContractType, setFilterContractType] = useState<string>("all");
  const [exportEnCours, setExportEnCours] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [erreurExport, setErreurExport] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    registrationNumber: "",
    entryDate: "",
    exitDate: "",
    contractType: "CDI" as EntreeRegistre["contractType"],
    contractWorkTime: "complet" as NonNullable<
      EntreeRegistre["contractWorkTime"]
    >,
    heures: "",
    statutCadre: "" as StatutCadre | "",
    position: "",
    qualification: "",
    nationality: "Française",
    sex: "M" as NonNullable<EntreeRegistre["sex"]>,
    birthDate: "",
    birthPlace: "",
    address: "",
    phone: "",
    email: "",
    socialSecurityNumber: "",
    cnapsProfessionalCardNumber: "",
    carteProExpiration: "",
    ssiapDiplomaNumber: "",
    notes: "",
  });

  const ligneFormulaire = lignes.find(
    (l) => l.entree.employeeId === formData.employeeId,
  );
  const nomFormulaire = ligneFormulaire
    ? `${ligneFormulaire.prenom} ${ligneFormulaire.nom}`.trim()
    : "";

  const handleEdit = (ligne: LigneRegistre) => {
    const entry = ligne.entree;
    setFormData({
      employeeId: entry.employeeId,
      registrationNumber: entry.registrationNumber,
      entryDate: dateVersChamp(entry.entryDate),
      exitDate: dateVersChamp(entry.exitDate),
      contractType: entry.contractType,
      contractWorkTime: entry.contractWorkTime || "complet",
      heures: entry.heures ? String(entry.heures) : "",
      statutCadre: entry.statutCadre ?? "",
      position: entry.position,
      qualification: entry.qualification,
      nationality: entry.nationality,
      sex: entry.sex || "M",
      birthDate: dateVersChamp(entry.birthDate),
      birthPlace: entry.birthPlace,
      address: entry.address || "",
      phone: entry.phone || "",
      email: entry.email || "",
      socialSecurityNumber: entry.socialSecurityNumber || "",
      cnapsProfessionalCardNumber: entry.cnapsProfessionalCardNumber || "",
      carteProExpiration: dateVersChamp(entry.carteProExpiration),
      ssiapDiplomaNumber: entry.ssiapDiplomaNumber || "",
      notes: entry.notes || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (ligne: LigneRegistre) => {
    setViewingId(ligne.id);
    setIsViewModalOpen(true);
  };

  const versDate = (v: string) => (v ? new Date(v) : undefined);

  const handleSave = () => {
    const employeeId = formData.employeeId;
    const rang = employes.findIndex((e) => e.id === employeeId);
    if (rang < 0) {
      setIsCreateModalOpen(false);
      return;
    }
    const base = entreeDeBase(employes[rang], rang, {
      ficheDe,
      sorties,
      contrats,
    });
    const heures = Number(formData.heures.replace(",", "."));
    const saisie: EntreeRegistre = {
      ...base,
      registrationNumber: formData.registrationNumber,
      entryDate: versDate(formData.entryDate) ?? base.entryDate,
      exitDate: versDate(formData.exitDate),
      contractType: formData.contractType,
      contractWorkTime: formData.contractWorkTime,
      heures:
        formData.contractWorkTime === "partiel" && heures > 0
          ? heures
          : undefined,
      statutCadre: formData.statutCadre || undefined,
      position: formData.position,
      qualification: formData.qualification,
      nationality: formData.nationality,
      sex: formData.sex,
      birthDate: versDate(formData.birthDate) ?? base.birthDate,
      birthPlace: formData.birthPlace,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      socialSecurityNumber: formData.socialSecurityNumber,
      cnapsProfessionalCardNumber: formData.cnapsProfessionalCardNumber,
      carteProExpiration: versDate(formData.carteProExpiration),
      ssiapDiplomaNumber: formData.ssiapDiplomaNumber,
      notes: formData.notes,
    };
    // Seules les valeurs qui diffèrent du dossier salarié sont enregistrées :
    // le dossier reste la référence pour tout le reste.
    const diff = differences(saisie, base);

    const doublons = enregistrees.filter((e) => e.employeeId === employeeId);
    const retenue = doublons.reduce<EnregistrementRegistre | undefined>(
      (r, e) => (!r || dateMs(e.updatedAt) >= dateMs(r.updatedAt) ? e : r),
      undefined,
    );
    const autres = (liste: EnregistrementRegistre[]) =>
      liste.filter((e) => e.employeeId !== employeeId);

    if (Object.keys(diff).length === 0) {
      // Rien ne diffère du dossier : les anciennes modifications sont retirées.
      if (doublons.length > 0) setEnregistrees((prec) => autres(prec));
    } else {
      const nouvelle: EnregistrementRegistre = {
        ...diff,
        id: retenue?.id ?? Date.now().toString(),
        employeeId,
        edite: true,
        createdAt: retenue?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      setEnregistrees((prec) => [...autres(prec), nouvelle]);
    }
    setIsCreateModalOpen(false);
  };

  // Apply filters
  let filteredLignes = lignes;

  if (filterStatus === "active") {
    filteredLignes = filteredLignes.filter((l) => !l.sorti);
  } else if (filterStatus === "exited") {
    filteredLignes = filteredLignes.filter((l) => l.sorti);
  }

  if (filterContractType !== "all") {
    filteredLignes = filteredLignes.filter(
      (l) => l.entree.contractType === filterContractType,
    );
  }

  const lancerExport = async (
    type: "pdf" | "excel",
    action: (l: LigneRegistre[]) => Promise<void>,
  ) => {
    setExportEnCours(type);
    setErreurExport(null);
    try {
      await action(filteredLignes);
    } catch {
      setErreurExport(
        "L'export a échoué. Réessayez dans un instant ; si le problème continue, rechargez la page.",
      );
    } finally {
      setExportEnCours(null);
    }
  };

  const jourIso = (d: Date | undefined) =>
    d && dateMs(d) ? d.toISOString().slice(0, 10) : "9999";

  const ENTETE = "bg-cyan-700 text-white whitespace-normal leading-tight";
  const ENTETE_SORTIE =
    "bg-rose-700 text-white whitespace-normal leading-tight";

  const columns: ColumnDef<LigneRegistre>[] = [
    {
      key: "nom",
      label: "Noms",
      headerClassName: ENTETE,
      sortValue: (l) => l.nom,
      render: (l) => (
        <Link
          href={`/dashboard/hr/collaborators/${l.entree.employeeId}`}
          className="font-semibold uppercase hover:underline"
        >
          {l.nom || VIDE}
        </Link>
      ),
    },
    {
      key: "prenom",
      label: "Prénoms",
      headerClassName: ENTETE,
      sortValue: (l) => l.prenom,
      render: (l) => l.prenom || VIDE,
    },
    {
      key: "naissance",
      label: "Date de naissance",
      headerClassName: ENTETE,
      sortValue: (l) => jourIso(l.entree.birthDate),
      render: (l) => (
        <div className="whitespace-nowrap">
          <div>{formatDateFr(l.entree.birthDate)}</div>
          {l.entree.birthPlace && (
            <div className="text-xs uppercase text-muted-foreground">
              {l.entree.birthPlace}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "nss",
      label: "NSS",
      headerClassName: ENTETE,
      sortValue: (l) => l.entree.socialSecurityNumber ?? "",
      render: (l) => (
        <span className="whitespace-nowrap font-mono text-xs">
          {l.entree.socialSecurityNumber || VIDE}
        </span>
      ),
    },
    {
      key: "embauche",
      label: "Date d'embauche",
      headerClassName: ENTETE,
      sortValue: (l) => jourIso(l.entree.entryDate),
      render: (l) => (
        <span className="whitespace-nowrap">
          {formatDateFr(l.entree.entryDate)}
        </span>
      ),
    },
    {
      key: "contrat",
      label: "Type de contrat",
      headerClassName: ENTETE,
      sortValue: (l) => l.typeContrat,
      render: (l) =>
        l.typeContrat === VIDE ? (
          VIDE
        ) : (
          <Badge
            variant={varianteContrat(l.entree.contractType)}
            className="whitespace-nowrap"
          >
            {l.typeContrat}
          </Badge>
        ),
    },
    {
      key: "emploi",
      label: "Emploi",
      headerClassName: ENTETE,
      sortValue: (l) => l.entree.position,
      render: (l) => l.entree.position || VIDE,
    },
    {
      key: "statut",
      label: "Statut",
      headerClassName: ENTETE,
      sortValue: (l) => l.entree.statutCadre ?? "",
      render: (l) =>
        l.entree.statutCadre ? (
          <Badge
            variant={l.entree.statutCadre === "Cadre" ? "cyan" : "neutral"}
            className="whitespace-nowrap"
          >
            {l.entree.statutCadre}
          </Badge>
        ) : (
          VIDE
        ),
    },
    {
      key: "sortie",
      label: "Date de sortie",
      headerClassName: ENTETE_SORTIE,
      cellClassName: "bg-rose-500/10",
      sortValue: (l) => jourIso(l.entree.exitDate),
      render: (l) => (
        <span
          className={
            l.sorti
              ? "whitespace-nowrap font-medium text-rose-600 dark:text-rose-400"
              : "whitespace-nowrap"
          }
        >
          {formatDateFr(l.entree.exitDate)}
        </span>
      ),
    },
    {
      key: "adresse",
      label: "Adresse",
      headerClassName: ENTETE,
      sortValue: (l) => l.entree.address ?? "",
      render: (l) => (
        <div className="min-w-48 max-w-72 whitespace-normal">
          {l.entree.address || VIDE}
        </div>
      ),
    },
    {
      key: "carte",
      label: "Carte Professionnelle",
      headerClassName: ENTETE,
      sortValue: (l) => l.entree.cnapsProfessionalCardNumber ?? "",
      render: (l) => (
        <span className="whitespace-nowrap font-mono text-xs">
          {l.entree.cnapsProfessionalCardNumber || VIDE}
        </span>
      ),
    },
    {
      key: "expiration",
      label: "Date expiration CAR",
      headerClassName: ENTETE,
      sortValue: (l) => jourIso(l.entree.carteProExpiration),
      render: (l) => {
        const expiree = carteExpiree(l.entree.carteProExpiration);
        return (
          <span
            className={
              expiree
                ? "whitespace-nowrap font-semibold text-red-600 dark:text-red-400"
                : "whitespace-nowrap"
            }
            title={expiree ? "Carte professionnelle expirée" : undefined}
          >
            {formatDateFr(l.entree.carteProExpiration)}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: ENTETE,
      sortable: false,
      render: (l) => (
        <RowActionsMenu
          onView={() => handleView(l)}
          onEdit={() => handleEdit(l)}
        />
      ),
    },
  ];

  // Calculate stats
  const activeCount = lignes.filter((l) => !l.sorti).length;
  const cdiCount = lignes.filter(
    (l) => l.entree.contractType === "CDI" && !l.sorti,
  ).length;
  const cddCount = lignes.filter(
    (l) => l.entree.contractType === "CDD" && !l.sorti,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre unique du personnel</h1>
          <p className="text-muted-foreground">
            Registre unique du personnel conforme à la réglementation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => lancerExport("pdf", exporterRegistrePdf)}
            variant="outline"
            disabled={exportEnCours !== null || filteredLignes.length === 0}
          >
            {exportEnCours === "pdf" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter PDF
          </Button>
          <Button
            onClick={() => lancerExport("excel", exporterRegistreExcel)}
            variant="outline"
            disabled={exportEnCours !== null || filteredLignes.length === 0}
          >
            {exportEnCours === "excel" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter Excel
          </Button>
          {/* Pas de création ici : le registre unique est une vue de
              consultation. Les entrées proviennent des dossiers salariés. */}
        </div>
      </div>
      {erreurExport && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {erreurExport}
        </p>
      )}

      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Total"
          value={lignes.length}
          subtext="Enregistrements totaux"
          color="gray"
        />

        <InfoCard
          icon={UserCheck}
          title="En poste"
          value={activeCount}
          subtext="Employés actifs"
          color="green"
        />

        <InfoCard
          icon={FileText}
          title="CDI"
          value={cdiCount}
          subtext="Contrats CDI actifs"
          color="blue"
        />

        <InfoCard
          icon={Calendar}
          title="CDD"
          value={cddCount}
          subtext="Contrats CDD actifs"
          color="orange"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registre ({filteredLignes.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">En poste</SelectItem>
                  <SelectItem value="exited">Sortis</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterContractType}
                onValueChange={setFilterContractType}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type de contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="interim">Intérim</SelectItem>
                  <SelectItem value="apprentice">Apprentissage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            onRowClick={handleView}
            columns={columns}
            data={filteredLignes}
            isLoading={isLoading}
            itemsPerPage={50}
            getRowId={(l) => l.id}
            getSearchValue={(l) =>
              [
                l.nom,
                l.prenom,
                l.entree.position,
                l.entree.socialSecurityNumber,
                l.entree.cnapsProfessionalCardNumber,
                l.entree.address,
              ].join(" ")
            }
            searchPlaceholder="Rechercher un salarié, un emploi, une carte…"
            rowClassName={() => "odd:bg-cyan-500/[0.06]"}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title="Modifier l'entrée"
        size="xl"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: handleSave,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Les informations viennent du dossier du salarié. Ce que vous
            modifiez ici complète ou corrige uniquement le registre.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employé</Label>
              <Input value={nomFormulaire} readOnly disabled />
            </div>

            <div>
              <Label htmlFor="registrationNumber">
                N° d&apos;enregistrement *
              </Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationNumber: e.target.value,
                  })
                }
                placeholder="Ex: 2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contractType">Type de contrat *</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contractType: value as EntreeRegistre["contractType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS_TYPE_CONTRAT.map((t) => (
                    <SelectItem key={t} value={t}>
                      {libelleContrat(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contractWorkTime">Temps de travail</Label>
              <Select
                value={formData.contractWorkTime}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contractWorkTime: value as NonNullable<
                      EntreeRegistre["contractWorkTime"]
                    >,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complet">Temps complet</SelectItem>
                  <SelectItem value="partiel">Temps partiel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="heures">Heures (temps partiel)</Label>
              <Input
                id="heures"
                inputMode="decimal"
                disabled={formData.contractWorkTime !== "partiel"}
                value={formData.heures}
                onChange={(e) =>
                  setFormData({ ...formData, heures: e.target.value })
                }
                placeholder="Ex: 24 ou 108"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Poste *</Label>
              <Select
                value={formData.position || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un poste…" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ...new Set([
                      ...(formData.position ? [formData.position] : []),
                      ...EMPLOYEE_POSTE_OPTIONS,
                    ]),
                  ].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Statut (cadre / non cadre)</Label>
              <Select
                value={formData.statutCadre || undefined}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    statutCadre: value as StatutCadre,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non renseigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cadre">Cadre</SelectItem>
                  <SelectItem value="Non cadre">Non cadre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <Label>Qualification * (plusieurs choix possibles)</Label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {QUALIFICATION_OPTIONS.map((q) => {
                  const current = formData.qualification
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const selected = current.includes(q);
                  return (
                    <Badge
                      key={q}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          qualification: (selected
                            ? current.filter((c) => c !== q)
                            : [...current, q]
                          ).join(", "),
                        })
                      }
                    >
                      {q}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité *</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
                placeholder="Ex: Française"
              />
            </div>

            <div>
              <Label htmlFor="sex">Sexe</Label>
              <Select
                value={formData.sex}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    sex: value as NonNullable<EntreeRegistre["sex"]>,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Date de naissance *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="birthPlace">Lieu de naissance *</Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace}
                onChange={(e) =>
                  setFormData({ ...formData, birthPlace: e.target.value })
                }
                placeholder="Ex: Paris (75)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryDate">Date d&apos;embauche *</Label>
              <Input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) =>
                  setFormData({ ...formData, entryDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="exitDate">Date de sortie</Label>
              <Input
                id="exitDate"
                type="date"
                value={formData.exitDate}
                onChange={(e) =>
                  setFormData({ ...formData, exitDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: e.target.value,
                })
              }
              placeholder="Ex: 15 rue de la République, 75001 Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    phone: value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Adresse mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder="Ex: exemple@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="socialSecurityNumber">NSS</Label>
              <Input
                id="socialSecurityNumber"
                value={formData.socialSecurityNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialSecurityNumber: e.target.value,
                  })
                }
                placeholder="Ex: 1 95 03 75 123 456 78"
              />
            </div>

            <div>
              <Label htmlFor="cnapsProfessionalCardNumber">
                Carte professionnelle
              </Label>
              <Input
                id="cnapsProfessionalCardNumber"
                value={formData.cnapsProfessionalCardNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cnapsProfessionalCardNumber: e.target.value,
                  })
                }
                placeholder="Ex: CAR-006-2025-07-27-20200172564"
              />
            </div>

            <div>
              <Label htmlFor="carteProExpiration">Date expiration CAR</Label>
              <Input
                id="carteProExpiration"
                type="date"
                value={formData.carteProExpiration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carteProExpiration: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ssiapDiplomaNumber">N° Diplôme SSIAP</Label>
            <Input
              id="ssiapDiplomaNumber"
              value={formData.ssiapDiplomaNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ssiapDiplomaNumber: e.target.value,
                })
              }
              placeholder="Ex: SSIAP1-2020-456"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'entrée"
        size="lg"
      >
        {viewingEntry && viewingLigne && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Employé</Label>
                <p className="text-sm font-medium">
                  {`${viewingLigne.prenom} ${viewingLigne.nom}`.trim() || VIDE}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  N° d&apos;enregistrement
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.registrationNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Type de contrat</Label>
                <p className="text-sm font-medium">
                  {viewingLigne.typeContrat}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Emploi</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.position || VIDE}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.statutCadre ?? VIDE}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Qualification</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.qualification || VIDE}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nationalité</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.nationality || VIDE}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Sexe</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.sex === "M"
                    ? "Masculin"
                    : viewingEntry.sex === "F"
                      ? "Féminin"
                      : VIDE}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date de naissance
                </Label>
                <p className="text-sm font-medium">
                  {formatDateFr(viewingEntry.birthDate)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Lieu de naissance
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.birthPlace || VIDE}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date d&apos;embauche
                </Label>
                <p className="text-sm font-medium">
                  {formatDateFr(viewingEntry.entryDate)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date de sortie</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.exitDate
                    ? formatDateFr(viewingEntry.exitDate)
                    : "En poste"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Adresse</Label>
              <p className="text-sm font-medium">
                {viewingEntry.address || VIDE}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {viewingEntry.phone && (
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="text-sm font-medium">{viewingEntry.phone}</p>
                </div>
              )}
              {viewingEntry.email && (
                <div>
                  <Label className="text-muted-foreground">Adresse mail</Label>
                  <p className="text-sm font-medium">{viewingEntry.email}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">NSS</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.socialSecurityNumber || VIDE}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Carte professionnelle
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.cnapsProfessionalCardNumber || VIDE}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Date expiration CAR
                </Label>
                <p
                  className={
                    carteExpiree(viewingEntry.carteProExpiration)
                      ? "text-sm font-semibold text-red-600 dark:text-red-400"
                      : "text-sm font-medium"
                  }
                >
                  {formatDateFr(viewingEntry.carteProExpiration)}
                </p>
              </div>
            </div>

            {viewingEntry.ssiapDiplomaNumber && (
              <div>
                <Label className="text-muted-foreground">
                  N° Diplôme SSIAP
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.ssiapDiplomaNumber}
                </p>
              </div>
            )}

            {viewingEntry.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm">{viewingEntry.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
