export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category:
    | "recruitment"
    | "onboarding"
    | "training"
    | "disciplinary"
    | "general"
    | "other";
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SentEmail {
  id: string;
  templateId?: string;
  templateName?: string;
  subject: string;
  body: string;
  recipients: {
    type: "employee" | "client" | "partner" | "other";
    ids: string[];
    emails: string[];
    names: string[];
  };
  sentAt: string;
  sentBy: string;
  status: "sent" | "failed" | "pending";
  attachments?: string[];
  opened?: boolean;
  openedAt?: string;
  clicked?: boolean;
  clickedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "email" | "sms" | "push" | "in_app";
  recipientId: string;
  recipientName: string;
  recipientType: "employee" | "client" | "supervisor" | "other";
  title: string;
  message: string;
  status: "pending" | "sent" | "delivered" | "failed" | "read";
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
}

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: "TMPL-001",
    name: "Accusé de réception candidature",
    subject: "Candidature reçue - {{companyName}}",
    body: "Bonjour {{candidateName}},\n\nNous avons bien reçu votre candidature pour le poste de {{position}}.\n\nNous vous recontacterons dans les plus brefs délais.\n\nCordialement,\nService RH",
    category: "recruitment",
    variables: ["candidateName", "position", "companyName"],
    isDefault: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "TMPL-002",
    name: "Rappel formation expirante",
    subject: "Rappel - Formation {{certificationType}} expire bientôt",
    body: "Bonjour {{employeeName}},\n\nNous vous rappelons que votre certification {{certificationType}} expire le {{expiryDate}}.\n\nMerci de prendre rendez-vous pour le recyclage.\n\nCordialement,\nService RH",
    category: "training",
    variables: ["employeeName", "certificationType", "expiryDate"],
    isDefault: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "TMPL-003",
    name: "Invitation entretien annuel",
    subject: "Entretien annuel {{year}} - {{employeeName}}",
    body: "Bonjour {{employeeName}},\n\nVous êtes convié(e) à votre entretien annuel le {{date}} à {{time}}.\n\nLieu: {{location}}\n\nCordialement,\n{{managerName}}",
    category: "general",
    variables: [
      "employeeName",
      "year",
      "date",
      "time",
      "location",
      "managerName",
    ],
    isDefault: false,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "TMPL-004",
    name: "Avertissement disciplinaire",
    subject: "Avertissement {{type}} - {{employeeName}}",
    body: "Bonjour {{employeeName}},\n\nPar la présente, nous vous informons d'un avertissement {{type}} concernant: {{reason}}.\n\nDate: {{date}}\n\n{{details}}\n\nCordialement,\n{{issuedBy}}",
    category: "disciplinary",
    variables: [
      "employeeName",
      "type",
      "reason",
      "date",
      "details",
      "issuedBy",
    ],
    isDefault: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
];

export const mockSentEmails: SentEmail[] = [];

export const mockNotifications: Notification[] = [];
