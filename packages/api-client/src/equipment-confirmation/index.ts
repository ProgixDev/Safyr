import { apiFetch } from "../client";
import { signalerBoiteMailRequise } from "../communication";

/** Détail minimal affiché sur la page publique de confirmation. */
export interface EquipmentConfirmationDetail {
  organizationName: string;
  employeeName: string;
  equipmentName: string;
  quantity: number | null;
  assignedAt: string | null;
  signed: boolean;
  signedAt: string | null;
}

/** Envoie au salarié le mail de remise, avec son lien de confirmation. */
export async function sendEquipmentConfirmationEmail(data: {
  recordId: string;
  recipient: string;
  /** Origine du site (ex. window.location.origin) : base du lien du mail. */
  origin: string;
}): Promise<{ sent: true }> {
  try {
    return await apiFetch<{ sent: true }>(
      "/organization/equipment-confirmation/send",
      { method: "POST", body: data },
    );
  } catch (error) {
    signalerBoiteMailRequise(error);
    throw error;
  }
}

/** Page publique (sans compte) : détail de la remise désignée par le jeton. */
export const getEquipmentConfirmation = (token: string) =>
  apiFetch<EquipmentConfirmationDetail>(
    `/public/equipment-confirmation?token=${encodeURIComponent(token)}`,
  );

/** Page publique : le salarié confirme la réception. */
export const confirmEquipmentReception = (token: string) =>
  apiFetch<EquipmentConfirmationDetail>("/public/equipment-confirmation", {
    method: "POST",
    body: { token },
  });
