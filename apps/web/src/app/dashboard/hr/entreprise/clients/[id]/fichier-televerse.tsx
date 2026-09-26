"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  attachUploadedFile,
  createFiscalRecord,
  updateFiscalRecord,
  uploadFile,
  type FiscalRecord,
  type FiscalRecordType,
  type UploadResponse,
} from "@safyr/api-client";
import { Button } from "@/components/ui/button";
import { attachmentKeys } from "@/hooks/contracts";
import { fiscalKeys } from "@/hooks/fiscal";
import { cn } from "@/lib/utils";
import { FileCheck2, Loader2, RotateCw, Upload, X } from "lucide-react";

/**
 * Téléversement immédiat d'un fichier choisi dans une fenêtre de saisie.
 *
 * Le fichier part vers le stockage dès qu'il est choisi : au clic sur
 * « Créer », il ne reste qu'à le rattacher à la ligne (une requête JSON), au
 * lieu d'enchaîner enregistrement, envoi du fichier et rechargements.
 */
export type EtatTeleversement =
  | { statut: "vide" }
  | { statut: "envoi"; fichier: File }
  | { statut: "pret"; fichier: File; televerse: UploadResponse }
  | { statut: "erreur"; fichier: File; message: string };

export function useTeleversementImmediat() {
  const [etat, setEtat] = useState<EtatTeleversement>({ statut: "vide" });
  // Identifie l'envoi courant : le résultat d'un envoi périmé (fichier changé
  // ou retiré entre-temps) est ignoré.
  const courant = useRef(0);

  const envoyer = useCallback(async (fichier: File) => {
    const numero = ++courant.current;
    setEtat({ statut: "envoi", fichier });
    try {
      const televerse = await uploadFile(fichier);
      if (numero !== courant.current) return;
      setEtat({ statut: "pret", fichier, televerse });
    } catch (erreur) {
      if (numero !== courant.current) return;
      setEtat({
        statut: "erreur",
        fichier,
        message:
          erreur instanceof Error && erreur.message
            ? erreur.message
            : "Le téléversement a échoué.",
      });
    }
  }, []);

  const choisir = useCallback(
    (fichier: File | null) => {
      if (!fichier) return;
      void envoyer(fichier);
    },
    [envoyer],
  );

  const reessayer = useCallback(() => {
    if (etat.statut === "erreur") void envoyer(etat.fichier);
  }, [envoyer, etat]);

  const retirer = useCallback(() => {
    courant.current += 1;
    setEtat({ statut: "vide" });
  }, []);

  return { etat, choisir, reessayer, retirer };
}

const formaterTaille = (octets: number) =>
  octets < 1024 * 1024
    ? `${Math.max(1, Math.round(octets / 1024))} Ko`
    : `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;

/**
 * Sélecteur de fichier avec état visible : envoi en cours, fichier validé
 * (pastille verte devant le nom), échec avec « Réessayer », retrait.
 */
export function ChampFichierTeleverse({
  id,
  etat,
  fichierExistant,
  onChoisir,
  onRetirer,
  onReessayer,
}: {
  id: string;
  etat: EtatTeleversement;
  /** Nom du fichier déjà rattaché à la ligne (modification). */
  fichierExistant?: string;
  onChoisir: (fichier: File | null) => void;
  onRetirer: () => void;
  onReessayer: () => void;
}) {
  const saisie = useRef<HTMLInputElement>(null);

  const pastille = (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 dark:bg-green-800"
    >
      <FileCheck2 className="h-5 w-5 text-green-300" />
    </span>
  );

  return (
    <div>
      <input
        ref={saisie}
        id={id}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          onChoisir(e.target.files?.[0] ?? null);
          // Permet de re-choisir le même fichier.
          e.target.value = "";
        }}
      />

      {etat.statut === "vide" && !fichierExistant && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
          onClick={() => saisie.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Choisir un fichier
        </Button>
      )}

      {etat.statut === "vide" && fichierExistant && (
        <div className="flex items-center gap-3 rounded-md border p-2">
          {pastille}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fichierExistant}</p>
            <p className="text-xs text-muted-foreground">Fichier déjà joint</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => saisie.current?.click()}
          >
            Remplacer
          </Button>
        </div>
      )}

      {etat.statut === "envoi" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-md border p-2"
        >
          <Loader2 className="ml-2 h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{etat.fichier.name}</p>
            <p className="text-xs text-muted-foreground">Téléversement…</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Annuler le téléversement"
            onClick={onRetirer}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {etat.statut === "pret" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-md border border-green-600/40 p-2"
        >
          {pastille}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{etat.fichier.name}</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Fichier téléversé · {formaterTaille(etat.fichier.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Retirer le fichier"
            onClick={onRetirer}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {etat.statut === "erreur" && (
        <div
          role="alert"
          className={cn(
            "flex items-center gap-3 rounded-md border p-2",
            "border-destructive/50",
          )}
        >
          <div className="min-w-0 flex-1 pl-2">
            <p className="truncate text-sm font-medium">{etat.fichier.name}</p>
            <p className="text-xs text-destructive">
              Échec du téléversement : {etat.message}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={onReessayer}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Réessayer
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Retirer le fichier"
            onClick={onRetirer}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Enregistre une ligne de registre sans attendre les rechargements.
 *
 * Les mutations de `useRegistre` ne se terminent qu'une fois TOUS les
 * registres rechargés (leur `onSuccess` renvoie la promesse d'invalidation) :
 * la fenêtre restait ouverte pendant ces requêtes. Ici la promesse rend la
 * main dès que l'id serveur est connu ; la liste est mise à jour tout de suite
 * à partir de la réponse, puis rechargée en arrière-plan.
 */
export function useEnregistrerLigne(type: FiscalRecordType) {
  const qc = useQueryClient();
  return useCallback(
    async (
      ligne: { id: string },
      existante: boolean,
      infos: { period: string; label: string; status?: string },
    ): Promise<string> => {
      const meta: Record<string, unknown> = {};
      for (const [cle, valeur] of Object.entries(
        ligne as Record<string, unknown>,
      )) {
        if (cle !== "id") meta[cle] = valeur;
      }
      const record: FiscalRecord = existante
        ? await updateFiscalRecord(ligne.id, { ...infos, meta })
        : await createFiscalRecord({ type, ...infos, meta });
      qc.setQueryData<FiscalRecord[]>(fiscalKeys.list(type), (avant) => {
        if (!avant) return avant;
        return avant.some((r) => r.id === record.id)
          ? avant.map((r) => (r.id === record.id ? record : r))
          : [record, ...avant];
      });
      void qc.invalidateQueries({ queryKey: fiscalKeys.all });
      return record.id;
    },
    [qc, type],
  );
}

/** Rattache le fichier déjà téléversé à une ligne, puis recharge les pièces. */
export function useRattacherFichier(clientId: string) {
  const qc = useQueryClient();
  return useCallback(
    async (
      etat: Extract<EtatTeleversement, { statut: "pret" }>,
      slot: string,
    ) => {
      await attachUploadedFile(etat.fichier, etat.televerse, {
        scope: "client",
        scopeId: clientId,
        slot,
      });
      void qc.invalidateQueries({
        queryKey: attachmentKeys.list("client", clientId),
      });
    },
    [qc, clientId],
  );
}
