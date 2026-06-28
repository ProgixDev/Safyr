import { apiFetch } from "../client";

export interface SendEmailPayload {
  recipients: string[];
  subject: string;
  body: string;
  saveInArchive?: boolean;
}

export interface SendEmailResult {
  sent: number;
}

export async function sendCommunicationEmail(
  data: SendEmailPayload,
): Promise<SendEmailResult> {
  return apiFetch<SendEmailResult>("/organization/communication/send-email", {
    method: "POST",
    body: data,
  });
}
