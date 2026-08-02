export interface SocialPost {
  id: string;
  platform: "LinkedIn" | "Facebook" | "Instagram" | "YouTube" | "X";
  content: string;
  scheduledDate: string;
  publishedDate?: string;
  status: "Planifié" | "Publié" | "Échec" | "Annulé";
  performance?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagement: number;
  };
  media?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailAutoReply {
  id: string;
  trigger: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "Prospect" | "Client" | "Ancien client" | "Lead";
  lastContact: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const mockSocialPosts: SocialPost[] = [
  {
    id: "POST-001",
    platform: "LinkedIn",
    content:
      "Nous recrutons des agents de sécurité qualifiés! Rejoignez notre équipe et développez vos compétences dans un environnement professionnel. Postes disponibles: Agent de sécurité, Chef d'équipe, Superviseur. #Recrutement #Sécurité",
    scheduledDate: "2024-12-25T09:00:00Z",
    status: "Planifié",
    media: ["/marketing/recruitment-post.jpg"],
    createdAt: "2024-12-20T10:00:00Z",
    updatedAt: "2024-12-20T10:00:00Z",
  },
  {
    id: "POST-002",
    platform: "Facebook",
    content:
      "Formation SSIAP disponible - Inscriptions ouvertes. Formez-vous aux métiers de la sécurité incendie avec nos experts certifiés.",
    scheduledDate: "2024-12-20T10:00:00Z",
    publishedDate: "2024-12-20T10:00:00Z",
    status: "Publié",
    performance: {
      views: 1250,
      likes: 89,
      shares: 12,
      comments: 15,
      engagement: 8.1,
    },
    media: ["/marketing/ssiap-training.jpg"],
    createdAt: "2024-12-18T09:00:00Z",
    updatedAt: "2024-12-20T10:00:00Z",
  },
  {
    id: "POST-003",
    platform: "Instagram",
    content:
      "Journée sécurité - Nos équipes en action. Découvrez le quotidien de nos agents de sécurité professionnels.",
    scheduledDate: "2024-12-18T14:00:00Z",
    publishedDate: "2024-12-18T14:00:00Z",
    status: "Publié",
    performance: {
      views: 2100,
      likes: 156,
      shares: 23,
      comments: 28,
      engagement: 8.5,
    },
    media: ["/marketing/team-action-1.jpg", "/marketing/team-action-2.jpg"],
    createdAt: "2024-12-15T10:00:00Z",
    updatedAt: "2024-12-18T14:00:00Z",
  },
  {
    id: "POST-004",
    platform: "LinkedIn",
    content:
      "Félicitations à nos agents qui ont obtenu leur certification SSIAP2! Continuez à exceller dans votre profession.",
    scheduledDate: "2024-12-22T08:00:00Z",
    publishedDate: "2024-12-22T08:00:00Z",
    status: "Publié",
    performance: {
      views: 890,
      likes: 67,
      shares: 8,
      comments: 12,
      engagement: 9.8,
    },
    media: ["/marketing/certification-celebration.jpg"],
    createdAt: "2024-12-21T10:00:00Z",
    updatedAt: "2024-12-22T08:00:00Z",
  },
  {
    id: "POST-005",
    platform: "Facebook",
    content:
      "Nos services de sécurité pour entreprises. Protection 24/7, équipes qualifiées, réactivité garantie.",
    scheduledDate: "2024-12-26T11:00:00Z",
    status: "Planifié",
    media: ["/marketing/services-overview.jpg"],
    createdAt: "2024-12-23T09:00:00Z",
    updatedAt: "2024-12-23T09:00:00Z",
  },
];

export const mockEmailAutoReplies: EmailAutoReply[] = [
  {
    id: "AUTO-001",
    trigger: "Candidature reçue",
    subject: "Accusé de réception - Candidature",
    body: "Bonjour,\n\nMerci pour votre candidature. Nous avons bien reçu votre dossier et l'étudierons dans les plus brefs délais.\n\nNous vous recontacterons prochainement.\n\nCordialement,\nService RH - Safyr",
    isActive: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "AUTO-002",
    trigger: "Demande d'information",
    subject: "Réponse automatique - Demande d'information",
    body: "Bonjour,\n\nNous avons bien reçu votre demande d'information. Un membre de notre équipe vous contactera dans les 48 heures.\n\nEn attendant, vous pouvez consulter notre site web pour plus d'informations.\n\nCordialement,\nÉquipe Safyr",
    isActive: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "AUTO-003",
    trigger: "Devis demandé",
    subject: "Accusé de réception - Demande de devis",
    body: "Bonjour,\n\nMerci pour votre demande de devis. Notre équipe commerciale prépare votre proposition personnalisée et vous la transmettra sous 5 jours ouvrés.\n\nCordialement,\nÉquipe Commerciale - Safyr",
    isActive: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "AUTO-004",
    trigger: "Contact général",
    subject: "Accusé de réception - Contact",
    body: "Bonjour,\n\nNous avons bien reçu votre message. Nous vous répondrons dans les plus brefs délais.\n\nCordialement,\nÉquipe Safyr",
    isActive: false,
    createdAt: "2024-01-15",
    updatedAt: "2024-06-01",
  },
];

export const mockCRMCustomers: CRMCustomer[] = [
  {
    id: "CRM-001",
    name: "Centre Commercial Rosny 2",
    email: "contact@rosny2.fr",
    phone: "+33 1 48 30 12 34",
    company: "Rosny 2 Shopping Center",
    status: "Client",
    lastContact: "2024-12-20",
    notes: "Client fidèle depuis 5 ans. Contrat renouvelé annuellement.",
    tags: ["client", "fidèle", "commercial"],
    createdAt: "2019-01-15",
    updatedAt: "2024-12-20",
  },
  {
    id: "CRM-002",
    name: "Tour Montparnasse",
    email: "securite@tourmontparnasse.fr",
    phone: "+33 1 45 38 52 14",
    company: "Tour Montparnasse",
    status: "Client",
    lastContact: "2024-12-18",
    notes: "Site prestigieux. Service 24/7 requis.",
    tags: ["client", "premium", "24/7"],
    createdAt: "2020-03-10",
    updatedAt: "2024-12-18",
  },
  {
    id: "CRM-003",
    name: "Entreprise TechCorp",
    email: "rh@techcorp.fr",
    phone: "+33 1 42 15 78 90",
    company: "TechCorp SAS",
    status: "Prospect",
    lastContact: "2024-12-15",
    notes: "Intéressé par nos services de sécurité pour leur nouveau siège.",
    tags: ["prospect", "tech", "nouveau"],
    createdAt: "2024-12-10",
    updatedAt: "2024-12-15",
  },
  {
    id: "CRM-004",
    name: "Hôpital Saint-Louis",
    email: "direction@hopital-saintlouis.fr",
    phone: "+33 1 42 49 49 49",
    company: "Hôpital Saint-Louis",
    status: "Client",
    lastContact: "2024-12-22",
    notes: "Contrat de sécurité médicale. Équipe spécialisée.",
    tags: ["client", "santé", "spécialisé"],
    createdAt: "2021-06-01",
    updatedAt: "2024-12-22",
  },
  {
    id: "CRM-005",
    name: "Université Paris-Sorbonne",
    email: "securite@sorbonne.fr",
    phone: "+33 1 40 46 20 20",
    company: "Université Paris-Sorbonne",
    status: "Ancien client",
    lastContact: "2024-11-30",
    notes: "Contrat non renouvelé. Budget réduit.",
    tags: ["ancien client", "éducation"],
    createdAt: "2018-09-01",
    updatedAt: "2024-11-30",
  },
  {
    id: "CRM-006",
    name: "Startup InnovTech",
    email: "contact@innovtech.fr",
    phone: "+33 1 55 12 34 56",
    company: "InnovTech",
    status: "Lead",
    lastContact: "2024-12-19",
    notes: "Lead qualifié. Rendez-vous prévu en janvier.",
    tags: ["lead", "startup", "qualifié"],
    createdAt: "2024-12-05",
    updatedAt: "2024-12-19",
  },
];
