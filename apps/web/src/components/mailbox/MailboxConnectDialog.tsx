"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  ApiError,
  type ConnectMailboxPayload,
  type MailboxProvider,
} from "@safyr/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useConnectMailbox, useMailboxStatus } from "@/hooks/mailbox";
import { cn } from "@/lib/utils";

const PROVIDERS: { value: MailboxProvider; label: string }[] = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook / Microsoft 365" },
  { value: "ovh", label: "OVH" },
  { value: "autre", label: "Autre" },
];

/** Devine le fournisseur d'après le domaine de l'adresse saisie. */
function guessProvider(email: string): MailboxProvider | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain === "gmail.com" || domain === "googlemail.com") return "gmail";
  if (/^(outlook|hotmail|live|msn|office365)\./.test(domain)) return "outlook";
  return null;
}

function messageErreur(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "TIMEOUT") {
      return "Le serveur met trop de temps à répondre. Réessayez dans un instant.";
    }
    if (error.code === "NETWORK_ERROR") {
      return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
    }
    if (error.code === "INTERNAL_ERROR" || error.code === "HTTP_ERROR") {
      return "La connexion de la boîte mail a échoué côté serveur. Réessayez ou contactez le support.";
    }
    return error.message;
  }
  return "Une erreur est survenue. Réessayez.";
}

interface MailboxConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Message d'erreur d'envoi qui a provoqué l'ouverture (boîte absente ou refusée). */
  reason?: string | null;
}

/**
 * Fenêtre de connexion de la boîte mail de la société. Le mot de passe n'existe
 * que dans l'état local du formulaire : ni store, ni stockage navigateur, ni
 * URL, et il est vidé dès que l'enregistrement réussit.
 */
export function MailboxConnectDialog({
  open,
  onOpenChange,
  reason,
}: MailboxConnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* Le formulaire est démonté à la fermeture : son état repart de zéro. */}
        <MailboxConnectForm
          reason={reason ?? null}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function MailboxConnectForm({
  reason,
  onClose,
}: {
  reason: string | null;
  onClose: () => void;
}) {
  const { data: status } = useMailboxStatus();
  const connect = useConnectMailbox();

  const [provider, setProvider] = useState<MailboxProvider>(
    status?.provider ?? "gmail",
  );
  const [providerChoisi, setProviderChoisi] = useState(false);
  const [email, setEmail] = useState(status?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [host, setHost] = useState(
    status?.provider === "autre" ? (status.host ?? "") : "",
  );
  const [port, setPort] = useState(
    status?.provider === "autre" && status.port ? String(status.port) : "465",
  );
  const [secure, setSecure] = useState(
    status?.provider === "autre" ? (status.secure ?? true) : true,
  );
  const [error, setError] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const pending = connect.isPending;

  const changeEmail = (value: string) => {
    setEmail(value);
    // On ne remplace pas un choix fait à la main.
    const guess = guessProvider(value);
    if (!providerChoisi && guess) setProvider(guess);
  };

  const changeSecure = (value: boolean) => {
    setSecure(value);
    // Couples usuels : 465 avec SSL, 587 avec STARTTLS.
    if (value && port === "587") setPort("465");
    if (!value && port === "465") setPort("587");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);

    const adresse = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    if (!password) {
      setError("Saisissez le mot de passe de la boîte mail.");
      return;
    }
    if (provider === "autre" && !host.trim()) {
      setError("Indiquez le serveur d'envoi (SMTP).");
      return;
    }

    const payload: ConnectMailboxPayload = {
      provider,
      email: adresse,
      password,
      ...(provider === "autre"
        ? { host: host.trim(), port: Number(port), secure }
        : {}),
    };
    connect.mutate(payload, {
      onSuccess: (result) => {
        setPassword("");
        setShowPassword(false);
        setConnectedEmail(result.email ?? adresse);
      },
      onError: (e) => setError(messageErreur(e)),
    });
  };

  if (connectedEmail) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            Boîte mail connectée : {connectedEmail}
          </DialogTitle>
          <DialogDescription>
            {reason
              ? "Vous pouvez maintenant réessayer l'envoi de votre e-mail. Il partira depuis cette boîte."
              : "Les e-mails de votre société (courriers, sanctions, procédures…) partiront désormais depuis cette adresse."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </>
    );
  }

  if (status && !status.canManage) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Connecter la boîte mail de votre société</DialogTitle>
          <DialogDescription>
            {reason ? `${reason} ` : ""}
            Seul un propriétaire ou un administrateur de la société peut
            connecter la boîte mail. Demandez-lui de le faire.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4" autoComplete="off">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          Connecter la boîte mail de votre société
        </DialogTitle>
        <DialogDescription>
          Les e-mails envoyés depuis Safyr (courriers aux organismes, sanctions,
          procédures disciplinaires…) partiront de cette boîte, et les réponses
          y arriveront.
        </DialogDescription>
      </DialogHeader>

      {reason && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {reason}
        </p>
      )}

      <div className="grid gap-2">
        <Label id="mailbox-provider-label">Fournisseur de messagerie</Label>
        <div
          role="radiogroup"
          aria-labelledby="mailbox-provider-label"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={provider === p.value}
              onClick={() => {
                setProvider(p.value);
                setProviderChoisi(true);
              }}
              className={cn(
                "rounded-md border px-2 py-2 text-sm transition-colors",
                provider === p.value
                  ? "border-primary bg-primary/10 font-medium"
                  : "hover:bg-accent",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="mailbox-email">Adresse e-mail</Label>
        <Input
          id="mailbox-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="contact@votre-societe.fr"
          value={email}
          onChange={(e) => changeEmail(e.target.value)}
          disabled={pending}
        />
      </div>

      {provider === "gmail" && (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm">
          <p className="mb-1 flex items-center gap-2 font-medium">
            <ShieldCheck className="size-4" />
            Gmail : utilisez un « mot de passe d&apos;application »
          </p>
          <p className="mb-1 text-muted-foreground">
            Gmail refuse le mot de passe habituel pour l&apos;envoi depuis une
            application.
          </p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>
              Activez la validation en 2 étapes sur votre{" "}
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                compte Google
              </a>
              .
            </li>
            <li>
              Ouvrez{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Mots de passe d&apos;application
              </a>{" "}
              et créez-en un nommé « Safyr ».
            </li>
            <li>Copiez le code de 16 caractères et collez-le ci-dessous.</li>
          </ol>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="mailbox-password">
          {provider === "gmail" ? "Mot de passe d'application" : "Mot de passe"}
        </Label>
        <div className="relative">
          <Input
            id="mailbox-password"
            name="mailbox-secret"
            type={showPassword ? "text" : "password"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Il est chiffré avant d&apos;être enregistré et n&apos;est jamais
          affiché ensuite.
        </p>
      </div>

      {provider === "autre" && (
        <div className="grid gap-3 rounded-md border px-3 py-3 sm:grid-cols-[1fr_7rem]">
          <div className="grid gap-2">
            <Label htmlFor="mailbox-host">Serveur d&apos;envoi (SMTP)</Label>
            <Input
              id="mailbox-host"
              placeholder="smtp.exemple.fr"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={host}
              onChange={(e) => setHost(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mailbox-port">Port</Label>
            <Input
              id="mailbox-port"
              inputMode="numeric"
              autoComplete="off"
              value={port}
              onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))}
              disabled={pending}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              id="mailbox-secure"
              checked={secure}
              onCheckedChange={changeSecure}
              disabled={pending}
            />
            <Label htmlFor="mailbox-secure">
              Connexion SSL (port 465) — désactivée : STARTTLS (port 587)
            </Label>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Plus tard
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Vérification en cours…" : "Vérifier et connecter"}
        </Button>
      </DialogFooter>
    </form>
  );
}
