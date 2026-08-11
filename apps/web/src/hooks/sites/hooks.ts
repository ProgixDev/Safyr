import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  createSite,
  deletePost,
  deleteSite,
  getSite,
  listSites,
  updatePost,
  updateSite,
  type CreatePostPayload,
  type CreateSitePayload,
  type UpdatePostPayload,
  type UpdateSitePayload,
} from "@safyr/api-client";
import { siteKeys } from "./keys";

export function useSites() {
  return useQuery({
    queryKey: siteKeys.list(),
    queryFn: listSites,
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: siteKeys.detail(id),
    queryFn: () => getSite(id),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: siteKeys.all });
}

export function useCreateSite() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: CreateSitePayload) => createSite(data),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateSite(siteId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: UpdateSitePayload) => updateSite(siteId, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSite() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (siteId: string) => deleteSite(siteId),
    onSuccess: () => invalidate(),
  });
}

export function useCreatePost(siteId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: CreatePostPayload) => createPost(siteId, data),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePost(siteId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: UpdatePostPayload;
    }) => updatePost(siteId, postId, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePost(siteId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (postId: string) => deletePost(siteId, postId),
    onSuccess: () => invalidate(),
  });
}

/**
 * Variantes prenant le site en paramètre : sur l'écran Planning › Postes, la
 * liste couvre tous les sites, le site n'est donc pas connu au montage.
 */
export function useCreateSitePost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      siteId,
      data,
    }: {
      siteId: string;
      data: CreatePostPayload;
    }) => createPost(siteId, data),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateSitePost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      siteId,
      postId,
      data,
    }: {
      siteId: string;
      postId: string;
      data: UpdatePostPayload;
    }) => updatePost(siteId, postId, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSitePost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ siteId, postId }: { siteId: string; postId: string }) =>
      deletePost(siteId, postId),
    onSuccess: () => invalidate(),
  });
}
