"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Calendar, Euro, Clock } from "lucide-react";
import type { Employee } from "@/lib/types";
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
} from "@/hooks/contracts";
import type { Contract, CreateContractPayload } from "@safyr/api-client";

interface EmployeeContractsTabProps {
  employee: Employee;
}

const TYPE_LABELS: Record<Contract["type"], string> = {
  CDI: "CDI",
  CDD: "CDD",
  INTERIM: "Intérim",
  APPRENTICESHIP: "Apprentissage",
  INTERNSHIP: "Stage",
};

const STATUT_LABELS: Record<Contract["status"], string> = {
  draft: "Brouillon",
  active: "En cours",
  ended: "Terminé",
  terminated: "Rompu",
};

const STATUT_VARIANTS: Record<
  Contract["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  active: "default",
  ended: "secondary",
  terminated: "destructive",
};

type Formulaire = {
  type: Contract["type"];
  position: string;
  startDate: string;
  endDate: string;
  workingHours: string;
  grossSalary: string;
  trialPeriodEndDate: string;
  status: Contract["status"];
  notes: string;
};

const FORMULAIRE_VIDE: Formulaire = {
  type: "CDI",
  position: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  workingHours: "35",
  grossSalary: "",
  trialPeriodEndDate: "",
  status: "active",
  notes: "",
};

function formaterDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

export function EmployeeContractsTab({ employee }: EmployeeContractsTabProps) {
  const { data: contracts = [], isLoading } = useContracts(employee.id);
  const creation = useCreateContract(employee.id);
  const modification = useUpdateContract(employee.id);
  const suppression = useDeleteContract(employee.id);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Contract | null>(null);
  const [aSupprimer, setASupprimer] = useState<Contract | null>(null);
  const [formulaire, setFormulaire] = useState<Formulaire>(FORMULAIRE_VIDE);
  const [erreur, setErreur] = useState<string | null>(null);

  const ouvrirCreation = () => {
    setEnEdition(null);
    setFormulaire({ ...FORMULAIRE_VIDE, position: employee.position ?? "" });
    setErreur(null);
    setModaleOuverte(true);
  };

  const ouvrirEdition = (contrat: Contract) => {
    setEnEdition(contrat);
    setFormulaire({
      type: contrat.type,
      position: contrat.position,
      startDate: contrat.startDate.split("T")[0],
      endDate: contrat.endDate ? contrat.endDate.split("T")[0] : "",
      workingHours: contrat.workingHours?.toString() ?? "",
      grossSalary: contrat.grossSalary?.toString() ?? "",
      trialPeriodEndDate: contrat.trialPeriodEndDate
        ? contrat.trialPeriodEndDate.split("T")[0]
        : "",
      status: contrat.status,
      notes: contrat.notes ?? "",
    });
    setErreur(null);
    setModaleOuverte(true);
  };

  const enregistrer = async () => {
    setErreur(null);

    if (!formulaire.position.trim()) {
      setErreur("Le poste est obligatoire.");
      return;
    }
    if (formulaire.type === "CDD" && !formulaire.endDate) {
      setErreur("Un CDD doit comporter une date de fin.");
      return;
    }

    const payload: CreateContractPayload = {
      type: formulaire.type,
      position: formulaire.position.trim(),
      startDate: formulaire.startDate,
      status: formulaire.status,
      ...(formulaire.endDate ? { endDate: formulaire.endDate } : {}),
      ...(formulaire.workingHours
        ? { workingHours: Number(formulaire.workingHours) }
        : {}),
      ...(formulaire.grossSalary
        ? { grossSalary: Number(formulaire.grossSalary) }
        : {}),
      ...(formulaire.trialPeriodEndDate
        ? { trialPeriodEndDate: formulaire.trialPeriodEndDate }
        : {}),
      ...(formulaire.notes.trim() ? { notes: formulaire.notes.trim() } : {}),
    };

    try {
      if (enEdition) {
        await modification.mutateAsync({
          contractId: enEdition.id,
          payload,
        });
      } else {
        await creation.mutateAsync(payload);
      }
      setModaleOuverte(false);
    } catch (e) {
      setErreur(
        `Échec de l'enregistrement : ${
          e instanceof Error ? e.message : "erreur inconnue"
        }`,
      );
    }
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    try {
      await suppression.mutateAsync(aSupprimer.id);
      setASupprimer(null);
    } catch (e) {
      setErreur(
        `Échec de la suppression : ${
          e instanceof Error ? e.message : "erreur inconnue"
        }`,
      );
    }
  };

  const enCours = creation.isPending || modification.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des contrats</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              CDD, CDI et avenants
            </p>
          </div>
          <Button onClick={ouvrirCreation}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contrat
          </Button>
        </CardHeader>
      </Card>

      {erreur && !modaleOuverte && (
        <p className="text-sm text-destructive">{erreur}</p>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </CardContent>
        </Card>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun contrat enregistré pour ce salarié.
            </p>
            <Button variant="outline" onClick={ouvrirCreation}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter le premier contrat
            </Button>
          </CardContent>
        </Card>
      ) : (
        contracts.map((contrat) => (
          <Card key={contrat.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{contrat.position}</CardTitle>
                  <Badge variant="outline">{TYPE_LABELS[contrat.type]}</Badge>
                  <Badge variant={STATUT_VARIANTS[contrat.status]}>
                    {STATUT_LABELS[contrat.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Du {formaterDate(contrat.startDate)}
                  {contrat.endDate
                    ? ` au ${formaterDate(contrat.endDate)}`
                    : " — sans terme"}
                </p>
              </div>
              <RowActionsMenu
                onEdit={() => ouvrirEdition(contrat)}
                onDelete={() => setASupprimer(contrat)}
              />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Temps de travail
                    </p>
                    <p className="font-medium">
                      {contrat.workingHours
                        ? `${contrat.workingHours} h / semaine`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Salaire brut
                    </p>
                    <p className="font-medium">
                      {contrat.grossSalary
                        ? `${contrat.grossSalary.toLocaleString("fr-FR")} €`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Fin de période d&apos;essai
                    </p>
                    <p className="font-medium">
                      {formaterDate(contrat.trialPeriodEndDate)}
                    </p>
                  </div>
                </div>
              </div>
              {contrat.notes && (
                <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">
                  {contrat.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Création / modification */}
      <Modal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        type="form"
        size="md"
        title={enEdition ? "Modifier le contrat" : "Nouveau contrat"}
        actions={{
          primary: {
            label: enCours ? "Enregistrement…" : "Enregistrer",
            onClick: () => void enregistrer(),
            disabled: enCours,
          },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setModaleOuverte(false),
          },
        }}
      >
        <div className="space-y-4">
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contrat-type">Type de contrat</Label>
              <Select
                value={formulaire.type}
                onValueChange={(v: Contract["type"]) =>
                  setFormulaire({ ...formulaire, type: v })
                }
              >
                <SelectTrigger id="contrat-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([valeur, libelle]) => (
                    <SelectItem key={valeur} value={valeur}>
                      {libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contrat-statut">Statut</Label>
              <Select
                value={formulaire.status}
                onValueChange={(v: Contract["status"]) =>
                  setFormulaire({ ...formulaire, status: v })
                }
              >
                <SelectTrigger id="contrat-statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUT_LABELS).map(([valeur, libelle]) => (
                    <SelectItem key={valeur} value={valeur}>
                      {libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="contrat-poste">Poste</Label>
            <Input
              id="contrat-poste"
              value={formulaire.position}
              onChange={(e) =>
                setFormulaire({ ...formulaire, position: e.target.value })
              }
              placeholder="Agent de sécurité"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contrat-debut">Date de début</Label>
              <Input
                id="contrat-debut"
                type="date"
                value={formulaire.startDate}
                onChange={(e) =>
                  setFormulaire({ ...formulaire, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contrat-fin">
                Date de fin {formulaire.type === "CDD" && "(obligatoire)"}
              </Label>
              <Input
                id="contrat-fin"
                type="date"
                value={formulaire.endDate}
                onChange={(e) =>
                  setFormulaire({ ...formulaire, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="contrat-heures">Heures / semaine</Label>
              <Input
                id="contrat-heures"
                type="number"
                value={formulaire.workingHours}
                onChange={(e) =>
                  setFormulaire({ ...formulaire, workingHours: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contrat-salaire">Salaire brut (€)</Label>
              <Input
                id="contrat-salaire"
                type="number"
                value={formulaire.grossSalary}
                onChange={(e) =>
                  setFormulaire({ ...formulaire, grossSalary: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contrat-essai">Fin période d&apos;essai</Label>
              <Input
                id="contrat-essai"
                type="date"
                value={formulaire.trialPeriodEndDate}
                onChange={(e) =>
                  setFormulaire({
                    ...formulaire,
                    trialPeriodEndDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contrat-notes">Notes</Label>
            <Textarea
              id="contrat-notes"
              value={formulaire.notes}
              onChange={(e) =>
                setFormulaire({ ...formulaire, notes: e.target.value })
              }
              placeholder="Clauses particulières, avenants…"
            />
          </div>
        </div>
      </Modal>

      {/* Suppression */}
      <Modal
        open={!!aSupprimer}
        onOpenChange={(open) => !open && setASupprimer(null)}
        type="confirmation"
        title="Supprimer le contrat"
        actions={{
          primary: {
            label: "Supprimer",
            variant: "destructive" as const,
            onClick: () => void confirmerSuppression(),
          },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setASupprimer(null),
          },
        }}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer le contrat{" "}
          <span className="font-semibold">{aSupprimer?.position}</span> ? Cette
          action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
