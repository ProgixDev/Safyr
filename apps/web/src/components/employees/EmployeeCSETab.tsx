"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Users, Calendar, Clock, Award, Plus } from "lucide-react";
import type { Employee } from "@/lib/types";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  ROLES_CSE,
  libelleRoleCse,
  roleCseActif,
  useRolesCse,
  type LigneRoleCse,
  type RoleCse,
} from "@/hooks/fiscal/use-cse-roles";
import { BADGE_TONS } from "@/lib/hr-status-badges";
import { cn } from "@/lib/utils";

interface EmployeeCSETabProps {
  employee: Employee;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "";

function formulaireDepuisRole(role: RoleCse) {
  const def = ROLES_CSE.find((r) => r.value === role) ?? ROLES_CSE[0];
  return {
    role,
    startDate: aujourdhui(),
    endDate: "",
    delegationHours: String(def.heuresParDefaut),
    isElected: def.elu,
    electionDate: "",
  };
}

export function EmployeeCSETab({ employee }: EmployeeCSETabProps) {
  // Les rôles CSE sont enregistrés en base (registre `cse_role`) : le bouton
  // « Assigner un rôle CSE » n'ouvrait rien et le rôle n'était jamais lu.
  const cse = useRolesCse();
  const roles = cse.roles
    .filter((r) => r.employeeId === employee.id)
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
  const rolesActifs = roles.filter((r) => roleCseActif(r));
  const heuresMensuelles = rolesActifs.reduce(
    (somme, r) => somme + (Number(r.delegationHours) || 0),
    0,
  );

  const [modalOuvert, setModalOuvert] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(formulaireDepuisRole("titulaire"));
  const [enCours, setEnCours] = useState(false);
  const [aSupprimer, setASupprimer] = useState<LigneRoleCse | null>(null);

  const ouvrirCreation = () => {
    setEditingId(null);
    setForm(formulaireDepuisRole("titulaire"));
    setModalOuvert(true);
  };

  const ouvrirModification = (ligne: LigneRoleCse) => {
    setEditingId(ligne.id);
    setForm({
      role: ligne.role,
      startDate: ligne.startDate ?? "",
      endDate: ligne.endDate ?? "",
      delegationHours: String(ligne.delegationHours ?? 0),
      isElected: ligne.isElected,
      electionDate: ligne.electionDate ?? "",
    });
    setModalOuvert(true);
  };

  const changerRole = (role: RoleCse) => {
    // Le crédit d'heures et le statut élu/désigné suivent le rôle choisi ;
    // ils restent modifiables ensuite.
    const def = ROLES_CSE.find((r) => r.value === role);
    setForm((prev) => ({
      ...prev,
      role,
      delegationHours: def ? String(def.heuresParDefaut) : prev.delegationHours,
      isElected: def ? def.elu : prev.isElected,
    }));
  };

  const heures = Number.parseFloat(form.delegationHours.replace(",", "."));
  const datesCoherentes =
    Boolean(form.startDate) &&
    (!form.endDate || form.endDate >= form.startDate);
  const doublon =
    !editingId &&
    !form.endDate &&
    roles.some((r) => r.role === form.role && roleCseActif(r));
  const formulaireValide =
    datesCoherentes && Number.isFinite(heures) && heures >= 0 && !doublon;

  const enregistrer = async () => {
    if (!formulaireValide) return;
    setEnCours(true);
    const nom = `${employee.firstName} ${employee.lastName}`.trim();
    const ligne: LigneRoleCse = {
      id: editingId ?? "",
      employeeId: employee.id,
      employeeName: nom,
      role: form.role,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      delegationHours: heures,
      isElected: form.isElected,
      electionDate: form.isElected ? form.electionDate || undefined : undefined,
    };
    try {
      await cse.enregistrer(ligne, {
        period: form.startDate.slice(0, 7),
        label: `${nom} — ${libelleRoleCse(form.role)}`,
        status: roleCseActif(ligne) ? "actif" : "termine",
      });
      setModalOuvert(false);
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec de l'enregistrement : ${erreur.message}`
          : "Échec de l'enregistrement.",
      );
    } finally {
      setEnCours(false);
    }
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    try {
      await cse.supprimerLigne(aSupprimer.id);
      setASupprimer(null);
    } catch {
      alert("Échec de la suppression. Réessayez.");
    }
  };

  const colonnes: ColumnDef<LigneRoleCse>[] = [
    {
      key: "role",
      label: "Rôle",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            {r.isElected ? (
              <Award className="h-4 w-4 text-primary" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <span className="font-semibold">{libelleRoleCse(r.role)}</span>
            <div className="text-xs text-muted-foreground">
              {r.isElected
                ? `Élu${r.electionDate ? ` le ${formatDate(r.electionDate)}` : ""}`
                : "Désigné"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Mandat",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          {formatDate(r.startDate)} —{" "}
          {r.endDate ? formatDate(r.endDate) : "En cours"}
        </div>
      ),
    },
    {
      key: "delegationHours",
      label: "Heures de délégation",
      sortable: true,
      render: (r) => (
        <span className="font-medium">{r.delegationHours} h / mois</span>
      ),
    },
    {
      key: "statut",
      label: "Statut",
      render: (r) => (
        <Badge
          variant="outline"
          className={cn(roleCseActif(r) ? BADGE_TONS.vert : BADGE_TONS.gris)}
        >
          {roleCseActif(r) ? "Actif" : "Terminé"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {roles.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Pas de rôle CSE assigné
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cet employé n&apos;a pas de fonction au sein du CSE
              </p>
              <Button onClick={ouvrirCreation}>
                <Plus className="mr-2 h-4 w-4" />
                Assigner un rôle CSE
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Rôles au sein du CSE
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comité Social et Économique
                </p>
              </div>
              <Button onClick={ouvrirCreation}>
                <Plus className="mr-2 h-4 w-4" />
                Assigner un rôle CSE
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Mandats en cours</p>
                    <p className="text-sm text-muted-foreground">
                      {rolesActifs.length === 0
                        ? "Aucun"
                        : rolesActifs
                            .map((r) => libelleRoleCse(r.role))
                            .join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Heures de délégation mensuelles
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {heuresMensuelles} heures / mois
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mandats</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={roles}
                columns={colonnes}
                itemsPerPage={10}
                actions={(ligne) => (
                  <RowActionsMenu
                    onEdit={() => ouvrirModification(ligne)}
                    onDelete={() => setASupprimer(ligne)}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Les heures effectivement utilisées se déclarent dans le module Temps. */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Consommation des heures de délégation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Les heures de délégation se déclarent et se valident dans
                      Temps &amp; activités.
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/hr/time-activity/cse-hours">
                    Heures de délégation CSE
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Gestion CSE
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Le Comité Social et Économique (CSE) bénéficie d&apos;heures de
                délégation pour exercer ses missions. Les salariés ayant un rôle
                CSE en cours sont proposés dans la liste des élus.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                <li>Réunions CSE et préparation</li>
                <li>Consultations et enquêtes</li>
                <li>Formation des élus</li>
                <li>Activités sociales et culturelles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigner / modifier un rôle */}
      <Modal
        open={modalOuvert}
        onOpenChange={setModalOuvert}
        type="form"
        size="lg"
        title={editingId ? "Modifier le rôle CSE" : "Assigner un rôle CSE"}
        description={`Fonction de ${employee.firstName} ${employee.lastName} au sein du CSE`}
        actions={{
          primary: {
            label: enCours ? "Enregistrement…" : "Enregistrer",
            onClick: () => void enregistrer(),
            disabled: !formulaireValide || enCours,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setModalOuvert(false),
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cse-role">Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) => changerRole(v as RoleCse)}
              >
                <SelectTrigger id="cse-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_CSE.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {doublon && (
                <p className="text-xs text-destructive">
                  Ce salarié a déjà ce rôle en cours : indiquez une date de fin
                  ou modifiez le mandat existant.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cse-debut">
                Début du mandat <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cse-debut"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cse-fin">Fin du mandat</Label>
              <Input
                id="cse-fin"
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
              {form.endDate && form.endDate < form.startDate && (
                <p className="text-xs text-destructive">
                  La fin du mandat doit suivre son début.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cse-heures">
                Heures de délégation (par mois)
              </Label>
              <Input
                id="cse-heures"
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                value={form.delegationHours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    delegationHours: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Valeur indicative selon le rôle : à ajuster selon
                l&apos;effectif et l&apos;accord d&apos;entreprise.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cse-elu">Origine du mandat</Label>
              <Select
                value={form.isElected ? "elu" : "designe"}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, isElected: v === "elu" }))
                }
              >
                <SelectTrigger id="cse-elu" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elu">Élu</SelectItem>
                  <SelectItem value="designe">Désigné</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.isElected && (
              <div className="space-y-2">
                <Label htmlFor="cse-election">Date d&apos;élection</Label>
                <Input
                  id="cse-election"
                  type="date"
                  value={form.electionDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      electionDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Suppression */}
      <Modal
        open={aSupprimer !== null}
        onOpenChange={(open) => {
          if (!open) setASupprimer(null);
        }}
        type="warning"
        closable
        title="Retirer le rôle CSE"
        description="Cette action est définitive."
        actions={{
          primary: {
            label: "Retirer",
            variant: "destructive",
            onClick: () => void confirmerSuppression(),
          },
          secondary: { label: "Annuler", onClick: () => setASupprimer(null) },
        }}
      >
        {aSupprimer && (
          <p className="text-sm">
            Retirer le rôle{" "}
            <strong>« {libelleRoleCse(aSupprimer.role)} »</strong> de{" "}
            {employee.firstName} {employee.lastName} ?
          </p>
        )}
      </Modal>
    </div>
  );
}
