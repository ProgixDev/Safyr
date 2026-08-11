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

export const mockEmailTemplates: EmailTemplate[] = [];

export const mockSentEmails: SentEmail[] = [];

export const mockNotifications: Notification[] = [];
