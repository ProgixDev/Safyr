export interface OCRDocument {
  id: string;
  type:
    | "Facture fournisseur"
    | "Avoir"
    | "Dépense diverse"
    | "Note de frais"
    | "Devis / Contrat client"
    | "Relevé bancaire"
    | "Justificatif de paiement"
    | "Bordereau"
    | "Arrêt maladie"
    | "Justificatif d'absence"
    | "Fiche mutuelle / prévoyance"
    | "Contrat / Avenant";
  fileName: string;
  uploadDate: string;
  status: "En attente" | "En traitement" | "Traité" | "Erreur";
  confidence: number; // 0-100
  extractedData?: {
    amount?: number;
    date?: string;
    supplier?: string;
    account?: string;
  };
  assignedTo?: string; // Module destination
}

export const mockOCRDocuments: OCRDocument[] = [];
