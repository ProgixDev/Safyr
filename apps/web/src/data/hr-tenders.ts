export interface Tender {
  id: string;
  reference: string;
  title: string;
  client: string;
  source: "BOAMP" | "Marchés Publics" | "Autre";
  sourceUrl: string;
  publicationDate: string;
  deadline: string;
  status: "À créer" | "En cours" | "Soumis" | "Gagné" | "Perdu" | "Annulé";
  dossierCreated: boolean;
  documents: string[];
  estimatedValue?: number;
  actualValue?: number;
  createdAt?: string;
  submittedAt?: string;
  wonAt?: string;
  lostAt?: string;
  notes?: string;
}

export const mockTenders: Tender[] = [];
