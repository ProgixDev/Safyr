import { apiBaseURL, apiFetch } from "../client";
import { ApiError } from "../fetch";

export interface UploadResponse {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface SignedUrlResponse {
  url: string;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<UploadResponse>("/storage/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getSignedUrl(key: string): Promise<string> {
  const data = await apiFetch<SignedUrlResponse>(`/storage/signed-url/${key}`);
  return data.url;
}

/**
 * Contenu brut d'un fichier rattaché (proxy API, sans passer par l'URL signée
 * du bucket, dont le CORS n'est pas garanti). 413 si le fichier dépasse la
 * limite des fonctions serverless, 404 si la clé n'est pas à l'organisation.
 */
export async function fetchAttachmentContent(
  key: string,
  signal?: AbortSignal,
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(
      `${apiBaseURL}/organization/attachments/content?key=${encodeURIComponent(key)}`,
      { credentials: "include", signal },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Network request failed");
  }
  if (!response.ok) {
    let code = "HTTP_ERROR";
    let message = response.statusText || "HTTP error";
    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // Corps non JSON : on garde le statut HTTP.
    }
    throw new ApiError(response.status, code, message);
  }
  return response.blob();
}
