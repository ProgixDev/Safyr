"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { ApiError } from "@safyr/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDisconnectMailbox, useMailboxStatus } from "@/hooks/mailbox";
import { MailboxConnectDialog } from "./MailboxConnectDialog";

function formatVerifiedAt(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/** Carte « Boîte mail de la société » de la page Mon entreprise. */
export function MailboxSettingsCard() {
  const { data: status, isLoading } = useMailboxStatus();
  const disconnect = useDisconnectMailbox();
  const [connectOpen, setConnectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifiedAt = formatVerifiedAt(status?.lastVerifiedAt);

  const confirmDisconnect = () => {
    setError(null);
    disconnect.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
      onError: (e) => {
        setConfirmOpen(false);
        setError(
          e instanceof ApiError
            ? e.message
            : "La déconnexion de la boîte mail a échoué. Réessayez.",
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Boîte mail de la société
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : status?.connected ? (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <p>
                Connectée : <span className="font-medium">{status.email}</span>
              </p>
              <p className="text-muted-foreground">
                Les e-mails de la société partent depuis cette adresse
                {verifiedAt ? ` — dernière vérification le ${verifiedAt}` : ""}.
              </p>
            </div>
          </div>
        ) : (
          <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Aucune boîte mail connectée : les e-mails (courriers, sanctions,
            procédures…) ne pourront pas être envoyés.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {status?.canManage === false ? (
          <p className="text-sm text-muted-foreground">
            Seul un propriétaire ou un administrateur peut modifier la boîte
            mail.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={status?.connected ? "outline" : "default"}
              onClick={() => setConnectOpen(true)}
              disabled={isLoading}
            >
              {status?.connected ? "Modifier" : "Connecter"}
            </Button>
            {status?.connected && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(true)}
              >
                Déconnecter
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <MailboxConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déconnecter la boîte mail ?</DialogTitle>
            <DialogDescription>
              Les e-mails de la société ne pourront plus être envoyés depuis{" "}
              {status?.email ?? "cette boîte"} tant qu&apos;une boîte mail
              n&apos;est pas reconnectée. Le mot de passe enregistré sera
              supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisconnect}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
