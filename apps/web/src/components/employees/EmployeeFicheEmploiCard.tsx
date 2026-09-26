"use client";

import { useState } from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/lib/types";
import { useFichesEmploi } from "@/hooks/employees/use-fiche-emploi";
import {
  FICHE_EMPLOI_VIDE,
  finEssaiProposee,
  heuresRetenues,
  recalculerFiche,
  type FicheEmploi,
} from "@/lib/fiche-emploi";
import {
  formaterEuros,
  formaterHeures,
  formaterTaux,
} from "@/lib/grille-salaires";
import { FicheEmploiFields } from "./FicheEmploiFields";

const dateFr = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR") : "—";

function Valeur({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{valeur || "—"}</p>
    </div>
  );
}

/**
 * Grille des salaires et période d'essai du salarié, saisies à la création
 * (étape « Emploi ») et modifiables ici. Enregistré dans le registre
 * `fiche_emploi`.
 */
export function EmployeeFicheEmploiCard({ employee }: { employee: Employee }) {
  const { ficheDe, enregistrerFiche, isLoading } = useFichesEmploi();
  const enregistree = ficheDe(employee.id);
  const [edition, setEdition] = useState<FicheEmploi | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const fiche = edition ?? enregistree ?? FICHE_EMPLOI_VIDE;
  const heures = heuresRetenues(fiche);

  const hire = employee.hireDate.getTime()
    ? employee.hireDate.toISOString().slice(0, 10)
    : "";

  const commencer = () => {
    const base = enregistree ?? FICHE_EMPLOI_VIDE;
    // Fiche vide : on propose l'essai d'après l'embauche et le contrat.
    setEdition(
      !base.debutEssai && !base.finEssai && hire
        ? {
            ...base,
            debutEssai: hire,
            finEssai: finEssaiProposee(
              hire,
              employee.contractType,
              base.categorie,
            ),
          }
        : base,
    );
    setErreur(null);
  };

  const enregistrer = async () => {
    if (!edition) return;
    setEnCours(true);
    setErreur(null);
    try {
      await enregistrerFiche(
        employee.id,
        `${employee.firstName} ${employee.lastName}`.trim(),
        recalculerFiche(edition),
      );
      setEdition(null);
    } catch {
      setErreur("L'enregistrement a échoué. Réessayez.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">
          Grille des salaires et période d&apos;essai
        </CardTitle>
        {edition ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEdition(null)}
              disabled={enCours}
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void enregistrer()}
              disabled={enCours}
            >
              {enCours ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={commencer}>
            <Pencil className="mr-2 h-4 w-4 text-orange-500" />
            Modifier
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {edition ? (
          <>
            <FicheEmploiFields
              fiche={edition}
              onChange={(next) => setEdition(next)}
            />
            {erreur && (
              <p className="mt-3 text-sm text-destructive">{erreur}</p>
            )}
          </>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !enregistree ? (
          <p className="text-sm text-muted-foreground">
            Aucune grille des salaires ni période d&apos;essai renseignée.
            Cliquez sur « Modifier » pour les saisir.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Valeur label="Catégorie" valeur={fiche.categorie} />
            <Valeur label="Niveau / Position" valeur={fiche.niveau} />
            <Valeur
              label="Échelon"
              valeur={fiche.echelon === "—" ? "Sans échelon" : fiche.echelon}
            />
            <Valeur
              label="Coefficient"
              valeur={
                fiche.coefficient !== null ? String(fiche.coefficient) : ""
              }
            />
            <Valeur
              label="Taux / h"
              valeur={
                fiche.tauxHoraire !== null
                  ? formaterTaux(fiche.tauxHoraire)
                  : ""
              }
            />
            <Valeur
              label="Salaire / mois"
              valeur={
                fiche.salaireMensuel !== null
                  ? formaterEuros(fiche.salaireMensuel)
                  : ""
              }
            />
            <Valeur
              label="Base"
              valeur={
                fiche.base === "autres"
                  ? `Autres${heures !== null ? ` (${formaterHeures(heures)})` : ""}`
                  : "151,67 h"
              }
            />
            <Valeur
              label="Début de période d'essai"
              valeur={dateFr(fiche.debutEssai)}
            />
            <Valeur
              label="Fin de période d'essai"
              valeur={dateFr(fiche.finEssai)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
