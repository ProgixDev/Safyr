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

export const mockSocialPosts: SocialPost[] = [];

export const mockEmailAutoReplies: EmailAutoReply[] = [];

export const mockCRMCustomers: CRMCustomer[] = [];
