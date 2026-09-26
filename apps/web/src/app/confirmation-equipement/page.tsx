"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ApiError,
  confirmEquipmentReception,
  getEquipmentConfirmation,
  type EquipmentConfirmationDetail,
} from "@safyr/api-client";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Page publique (sans compte) : le salarié y confirme la réception d'un
// équipement depuis le lien reçu par e-mail. Le jeton du lien fait foi.

function messageErreur(erreur: unknown): string {
  if (erreur instanceof ApiError) {
    if (erreur.code === "NETWORK_ERROR" || erreur.code === "TIMEOUT") {
      return "Connexion impossible. Vérifiez votre réseau puis réessayez.";
    }
    if (erreur.status >= 500) {
      return "Le service est momentanément indisponible. Réessayez dans quelques minutes.";
    }
    return erreur.message;
  }
  return "Une erreur est survenue. Réessayez dans quelques minutes.";
}

function formaterDate(iso: string | null, avecHeure = false): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return avecHeure
    ? date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
    : date.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function Coque({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="mb-6 text-sm font-semibold tracking-wide text-muted-foreground">
          SAFYR
        </p>
        {children}
      </div>
    </main>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{valeur}</dd>
    </div>
  );
}

function Detail({ detail }: { detail: EquipmentConfirmationDetail }) {
  const remis = formaterDate(detail.assignedAt);
  return (
    <dl className="divide-y rounded-lg border px-4">
      <Ligne label="Société" valeur={detail.organizationName} />
      <Ligne label="Salarié" valeur={detail.employeeName} />
      <Ligne label="Équipement" valeur={detail.equipmentName} />
      {detail.quantity ? (
        <Ligne label="Quantité" valeur={String(detail.quantity)} />
      ) : null}
      {remis ? <Ligne label="Remis le" valeur={remis} /> : null}
    </dl>
  );
}

function Erreur({ message }: { message: string }) {
  return (
    <Coque>
      <div className="flex flex-col items-center gap-3 text-center">
        <TriangleAlert className="h-10 w-10 text-orange-500" />
        <h1 className="text-lg font-semibold">Confirmation impossible</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </Coque>
  );
}

function Signe({ detail }: { detail: EquipmentConfirmationDetail }) {
  const quand = formaterDate(detail.signedAt, true);
  return (
    <Coque>
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <h1 className="text-lg font-semibold">Réception confirmée</h1>
        <p className="text-sm text-muted-foreground">
          {quand
            ? `Merci, votre confirmation a été enregistrée le ${quand}.`
            : "Merci, votre confirmation a été enregistrée."}
        </p>
      </div>
      <div className="mt-6">
        <Detail detail={detail} />
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Vous pouvez fermer cette page.
      </p>
    </Coque>
  );
}

function Confirmation({ token }: { token: string }) {
  const requete = useQuery({
    queryKey: ["equipment-confirmation", token],
    queryFn: () => getEquipmentConfirmation(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const confirmation = useMutation({
    mutationFn: () => confirmEquipmentReception(token),
  });

  if (requete.isPending) {
    return (
      <Coque>
        <div className="flex items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      </Coque>
    );
  }
  if (requete.isError) {
    return <Erreur message={messageErreur(requete.error)} />;
  }

  // Le résultat de la confirmation prime ; sinon la fiche telle que chargée
  // (déjà signée : on l'indique, sans redemander).
  const detail = confirmation.data ?? requete.data;
  if (detail.signed) return <Signe detail={detail} />;

  return (
    <Coque>
      <h1 className="text-lg font-semibold">Confirmer la réception</h1>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">
        Vérifiez les informations ci-dessous puis confirmez que vous avez bien
        reçu cet équipement.
      </p>
      <Detail detail={detail} />
      {confirmation.isError ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {messageErreur(confirmation.error)}
        </p>
      ) : null}
      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={confirmation.isPending}
        onClick={() => confirmation.mutate()}
      >
        {confirmation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        Je confirme avoir reçu cet équipement
      </Button>
    </Coque>
  );
}

function Contenu() {
  const token = useSearchParams().get("token")?.trim();
  if (!token) {
    return (
      <Erreur message="Le lien est incomplet. Utilisez le lien reçu dans votre e-mail." />
    );
  }
  return <Confirmation token={token} />;
}

export default function ConfirmationEquipementPage() {
  return (
    <Suspense
      fallback={
        <Coque>
          <div className="flex items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        </Coque>
      }
    >
      <Contenu />
    </Suspense>
  );
}
