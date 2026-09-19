"use client";

import { useState } from "react";
import { sendCommunicationEmail } from "@safyr/api-client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CourrierDialogProps {
  /** Salarié destinataire ; son e-mail vient de sa fiche. */
  destinataireNom: string;
  destinataireEmail: string;
  objetInitial: string;
  corpsInitial: string;
  titre?: string;
  /** Rappel réglementaire ou consigne affichée sous le message. */
  note?: string;
  onClose: () => void;
  /** Appelé après un envoi réussi, avec le texte réellement envoyé. */
  onEnvoye?: (objet: string, corps: string) => Promise<void> | void;
  /** Génère le document PDF à partir du texte, sans envoyer d'e-mail. */
  onGenerer?: (objet: string, corps: string) => Promise<void> | void;
  libelleGenerer?: string;
}

/**
 * Dialogue « Envoyer un courrier » : objet et message modifiables, e-mail du
 * salarié pré-rempli. Le message d'erreur renvoyé par le serveur est affiché
 * tel quel (une alerte du navigateur le masquait derrière la boîte).
 *
 * À monter seulement quand il est ouvert : les champs se réinitialisent à
 * chaque ouverture à partir des valeurs initiales.
 */
export function CourrierDialog({
  destinataireNom,
  destinataireEmail,
  objetInitial,
  corpsInitial,
  titre = "Envoyer un courrier",
  note,
  onClose,
  onEnvoye,
  onGenerer,
  libelleGenerer = "Générer le document",
}: CourrierDialogProps) {
  const [objet, setObjet] = useState(objetInitial);
  const [corps, setCorps] = useState(corpsInitial);
  const [email, setEmail] = useState(destinataireEmail);
  const [enCours, setEnCours] = useState<"envoi" | "generation" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [indiceServeur, setIndiceServeur] = useState(false);

  const emailValide = FORMAT_EMAIL.test(email.trim());
  const emailManquant = !destinataireEmail.trim();

  const envoyer = async () => {
    setErreur(null);
    setIndiceServeur(false);
    setEnCours("envoi");
    try {
      await sendCommunicationEmail({
        recipients: [email.trim()],
        subject: objet.trim(),
        body: corps,
      });
    } catch (e) {
      const status = (e as { status?: number } | null)?.status ?? 0;
      setErreur(
        `Échec de l'envoi du courrier : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
      // Un 5xx vient du serveur (le plus souvent la messagerie SMTP), pas du
      // contenu du courrier : on le dit pour éviter de le réécrire en vain.
      setIndiceServeur(status >= 500);
      setEnCours(null);
      return;
    }
    try {
      await onEnvoye?.(objet.trim(), corps);
      onClose();
    } catch (e) {
      // Le courrier est parti : on ne propose pas de le renvoyer.
      setErreur(
        `Le courrier a bien été envoyé à ${email.trim()}, mais l'étape suivante a échoué : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
      setEnCours(null);
    }
  };

  const generer = async () => {
    if (!onGenerer) return;
    setErreur(null);
    setIndiceServeur(false);
    setEnCours("generation");
    try {
      await onGenerer(objet.trim(), corps);
      onClose();
    } catch (e) {
      setErreur(
        `Échec de la génération du document : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
      setEnCours(null);
    }
  };

  const occupe = enCours !== null;

  return (
    <Modal
      open
      onOpenChange={(o) => !o && !occupe && onClose()}
      type="form"
      size="lg"
      title={titre}
      description={`À ${destinataireNom}`}
      actions={{
        primary: {
          label: enCours === "envoi" ? "Envoi…" : "Envoyer",
          onClick: () => void envoyer(),
          disabled: occupe || !emailValide || !objet.trim() || !corps.trim(),
        },
        secondary: {
          label: "Annuler",
          onClick: onClose,
          variant: "outline",
          disabled: occupe,
        },
        ...(onGenerer
          ? {
              tertiary: {
                label:
                  enCours === "generation" ? "Génération…" : libelleGenerer,
                onClick: () => void generer(),
                variant: "outline" as const,
                disabled: occupe || !objet.trim() || !corps.trim(),
              },
            }
          : {}),
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="courrier-email">Adresse e-mail du destinataire</Label>
          <Input
            id="courrier-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@exemple.fr"
          />
          {emailManquant && (
            <p className="text-sm text-destructive">
              Aucune adresse e-mail n&apos;est enregistrée sur la fiche de{" "}
              {destinataireNom}. Saisissez-la ici pour envoyer ce courrier, et
              pensez à la compléter sur sa fiche salarié.
            </p>
          )}
          {!emailManquant && !emailValide && (
            <p className="text-sm text-destructive">
              Cette adresse e-mail n&apos;est pas valide.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="courrier-objet">Objet</Label>
          <Input
            id="courrier-objet"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courrier-message">Message</Label>
          <Textarea
            id="courrier-message"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            rows={12}
          />
        </div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        {erreur && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p>{erreur}</p>
            {indiceServeur && (
              <p className="mt-1 text-xs">
                Le courrier n&apos;a pas été envoyé. L&apos;erreur vient du
                serveur d&apos;envoi d&apos;e-mails (messagerie indisponible ou
                paramètres SMTP refusés) : réessayez plus tard ou contactez le
                support.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
