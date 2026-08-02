/**
 * Liens vers les portails officiels utilisés par le logiciel.
 *
 * Centralisés ici pour éviter les URL divergentes (ou obsolètes) recopiées
 * dans chaque page.
 */

/**
 * Téléservices CNAPS (dont DRACAR — vérification des cartes professionnelles).
 * L'ancien domaine `dracar.cnaps-securite.fr` ne répond plus : le service est
 * accessible via les téléservices du ministère de l'Intérieur.
 */
export const CNAPS_TELESERVICES_URL =
  "https://teleservices-cnaps.interieur.gouv.fr/teleservices/ihm/#/home";

/** Espace professionnel impots.gouv.fr (TVA, CFE, prélèvement à la source). */
export const IMPOTS_PRO_URL = "https://cfspro.impots.gouv.fr/mire/accueil.do";

export const URSSAF_URL = "https://www.urssaf.fr";
export const INFOGREFFE_URL = "https://www.infogreffe.fr";

/** Ouvre un portail externe dans un nouvel onglet, sans fuite d'opener. */
export function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
