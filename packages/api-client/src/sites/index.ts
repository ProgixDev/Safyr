import { apiFetch } from "../client";
import type {
  CreatePostPayload,
  CreateSitePayload,
  Post,
  Site,
  UpdatePostPayload,
  UpdateSitePayload,
} from "./types";

export * from "./types";

export const listSites = () => apiFetch<Site[]>("/sites");

export const getSite = (siteId: string) => apiFetch<Site>(`/sites/${siteId}`);

export const createSite = (data: CreateSitePayload) =>
  apiFetch<Site>("/sites", { method: "POST", body: data });

export const updateSite = (siteId: string, data: UpdateSitePayload) =>
  apiFetch<Site>(`/sites/${siteId}`, { method: "PATCH", body: data });

export const deleteSite = (siteId: string) =>
  apiFetch<Site>(`/sites/${siteId}`, { method: "DELETE" });

export const createPost = (siteId: string, data: CreatePostPayload) =>
  apiFetch<Post>(`/sites/${siteId}/posts`, { method: "POST", body: data });

export const updatePost = (
  siteId: string,
  postId: string,
  data: UpdatePostPayload,
) =>
  apiFetch<Post>(`/sites/${siteId}/posts/${postId}`, {
    method: "PATCH",
    body: data,
  });

export const deletePost = (siteId: string, postId: string) =>
  apiFetch<Post>(`/sites/${siteId}/posts/${postId}`, { method: "DELETE" });
