/**
 * Type interne de ligne `fiscal_record` qui porte la boîte mail d'une
 * organisation. Volontairement absent de `FiscalRecordTypeSchema` : le CRUD
 * générique des registres ne doit ni le créer ni le lire (il contient un
 * secret chiffré). `FiscalService` l'exclut explicitement de ses requêtes.
 */
export const MAILBOX_RECORD_TYPE = "mailbox_config";
