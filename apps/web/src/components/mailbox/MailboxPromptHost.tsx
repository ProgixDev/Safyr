"use client";

import { useEffect, useState } from "react";
import {
  MAILBOX_REQUIRED_EVENT,
  type MailboxRequiredDetail,
} from "@safyr/api-client";
import { useMailboxStatus } from "@/hooks/mailbox";
import { MailboxConnectDialog } from "./MailboxConnectDialog";

const SESSION_KEY = "safyr:mailbox-prompt-seen";

// Repli en mémoire si sessionStorage est indisponible (navigation privée…).
let seenInMemory = false;

function alreadySeen(): boolean {
  if (seenInMemory) return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen(): void {
  seenInMemory = true;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Sans stockage, le repli en mémoire suffit pour la durée de la page.
  }
}

/**
 * Monté dans le layout RH. Ouvre la fenêtre de connexion de la boîte mail :
 * - automatiquement, une seule fois par session, si la société n'a pas de boîte
 *   connectée et que l'utilisateur peut la connecter (propriétaire/admin) ;
 * - quand un envoi d'e-mail échoue faute de boîte utilisable (événement émis
 *   par sendCommunicationEmail), avec le message de l'erreur.
 */
export function MailboxPromptHost() {
  const { data: status } = useMailboxStatus();
  const [dismissed, setDismissed] = useState(alreadySeen);
  const [autoOpen, setAutoOpen] = useState(false);
  const [forcedReason, setForcedReason] = useState<string | null>(null);

  // Verrouillé à l'ouverture : la fenêtre doit rester affichée pour montrer le
  // succès, alors que la boîte est déjà « connectée » côté serveur.
  const eligible =
    !!status && !status.connected && status.canManage && !dismissed;
  if (eligible && !autoOpen) setAutoOpen(true);

  useEffect(() => {
    const onRequired = (event: Event) => {
      const detail = (event as CustomEvent<MailboxRequiredDetail>).detail;
      setForcedReason(detail?.message ?? "");
    };
    window.addEventListener(MAILBOX_REQUIRED_EVENT, onRequired);
    return () => window.removeEventListener(MAILBOX_REQUIRED_EVENT, onRequired);
  }, []);

  const open = autoOpen || forcedReason !== null;

  return (
    <MailboxConnectDialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        markSeen();
        setDismissed(true);
        setAutoOpen(false);
        setForcedReason(null);
      }}
      reason={forcedReason || null}
    />
  );
}
