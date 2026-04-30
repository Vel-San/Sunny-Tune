/// <reference types="vite/client" />
import axios from "axios";
import { log } from "../lib/logger";
import type {
  CollectionRecord,
  CommentRecord,
  CommunityStats,
  ConfigRecord,
  ConfigSnapshot,
  ConfigSnapshotMeta,
  ConfigsPage,
  ExploreResponse,
  FavoriteRecord,
  NotificationRecord,
  RatingRecord,
  RatingSummary,
  SPConfig,
  UserRecord,
  VehicleEntry,
} from "../types/config";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Enriched error that preserves the HTTP status code from the server response.
 * status = 0 means a network-level failure (server unreachable, timeout, etc).
 * Distinguishing these from 401 is critical so we never wipe auth tokens on
 * a transient network hiccup during a server restart.
 */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sp_user_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const message: string =
      err?.response?.data?.error ?? err?.message ?? "Unknown error";
    // Preserve the HTTP status so callers (e.g. authStore) can distinguish
    // a 401 "bad token" from a transient network error (status 0).
    const status: number = err?.response?.status ?? 0;
    // Log at warn for 4xx (expected errors), error for 5xx/network failures
    const url: string = err?.config?.url ?? "";
    if (status === 0 || status >= 500) {
      log.error("API request failed", { url, status, message });
    } else if (status >= 400) {
      log.warn("API request rejected", { url, status, message });
    }
    return Promise.reject(new ApiError(message, status));
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function registerUser(): Promise<{
  token: string;
  userId: string;
}> {
  const { data } = await apiClient.post<{ token: string; userId: string }>(
    "/users/register",
  );
  return data;
}

export async function fetchMe(): Promise<UserRecord> {
  const { data } = await apiClient.get<UserRecord>("/users/me");
  return data;
}

export async function revokeToken(): Promise<{ token: string }> {
  const { data } = await apiClient.post<{ token: string }>(
    "/users/revoke-token",
  );
  return data;
}

export async function updateUsername(
  username: string | null,
): Promise<{ id: string; username: string | null }> {
  const { data } = await apiClient.patch<{
    id: string;
    username: string | null;
  }>("/users/me", { username });
  return data;
}

// ─── Configs ──────────────────────────────────────────────────────────────────

export async function fetchConfigs(page = 1, limit = 24): Promise<ConfigsPage> {
  const { data } = await apiClient.get<ConfigsPage>("/configs", {
    params: { page, limit },
  });
  return data;
}

export async function fetchAllConfigs(): Promise<ConfigRecord[]> {
  // Convenience helper: fetches all configs (up to 100) for use in modals/selects
  const { data } = await apiClient.get<ConfigsPage>("/configs", {
    params: { page: 1, limit: 100 },
  });
  return data.configs;
}

export async function fetchConfig(id: string): Promise<ConfigRecord> {
  const { data } = await apiClient.get<ConfigRecord>(`/configs/${id}`);
  return data;
}

export async function createConfig(payload: {
  name: string;
  description?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  config: SPConfig;
  tags?: string[];
  category?: string;
}): Promise<ConfigRecord> {
  const { data } = await apiClient.post<ConfigRecord>("/configs", payload);
  return data;
}

export async function updateConfig(
  id: string,
  payload: {
    name: string;
    description?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    config: SPConfig;
    tags?: string[];
    category?: string;
  },
): Promise<ConfigRecord> {
  const { data } = await apiClient.put<ConfigRecord>(`/configs/${id}`, payload);
  return data;
}

export async function deleteConfig(id: string): Promise<void> {
  await apiClient.delete(`/configs/${id}`);
}

export async function shareConfig(
  id: string,
  meta?: { tags?: string[]; category?: string },
): Promise<{ shareToken: string }> {
  const { data } = await apiClient.post<{ shareToken: string }>(
    `/configs/${id}/share`,
    meta ?? {},
  );
  return data;
}

export async function cloneConfig(id: string): Promise<ConfigRecord> {
  const { data } = await apiClient.post<ConfigRecord>(`/configs/${id}/clone`);
  return data;
}

export async function fetchSharedConfig(
  shareToken: string,
): Promise<ConfigRecord> {
  const { data } = await apiClient.get<ConfigRecord>(`/shared/${shareToken}`);
  return data;
}

// ─── Explore ──────────────────────────────────────────────────────────────────

export async function fetchExplore(params: {
  q?: string;
  make?: string;
  model?: string;
  year?: number;
  tags?: string[];
  category?: string;
  branch?: string;
  sort?:
    | "trending"
    | "rating"
    | "recent"
    | "views"
    | "clones"
    | "comments"
    | "likes";
  page?: number;
  limit?: number;
  spVersion?: string;
}): Promise<ExploreResponse> {
  const query: Record<string, string> = {};
  if (params.q) query.q = params.q;
  if (params.make) query.make = params.make;
  if (params.model) query.model = params.model;
  if (params.year) query.year = params.year.toString();
  if (params.tags?.length) query.tags = params.tags.join(",");
  if (params.category) query.category = params.category;
  if (params.branch) query.branch = params.branch;
  if (params.sort) query.sort = params.sort;
  if (params.page) query.page = params.page.toString();
  if (params.limit) query.limit = params.limit.toString();
  if (params.spVersion) query.spVersion = params.spVersion;
  const { data } = await apiClient.get<ExploreResponse>("/explore", {
    params: query,
  });
  return data;
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
  const { data } = await apiClient.get<CommunityStats>("/explore/stats");
  return data;
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export async function rateConfig(
  configId: string,
  value: number,
): Promise<RatingRecord> {
  const { data } = await apiClient.put<RatingRecord>(
    `/community/configs/${configId}/rate`,
    { value },
  );
  return data;
}

export async function deleteRating(configId: string): Promise<void> {
  await apiClient.delete(`/community/configs/${configId}/rate`);
}

export async function fetchMyRating(
  configId: string,
): Promise<RatingRecord | null> {
  const { data } = await apiClient.get<RatingRecord | null>(
    `/community/configs/${configId}/my-rating`,
  );
  return data;
}

export async function fetchRatingSummary(
  configId: string,
): Promise<RatingSummary> {
  const { data } = await apiClient.get<RatingSummary>(
    `/public/configs/${configId}/ratings`,
  );
  return data;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(
  configId: string,
): Promise<CommentRecord[]> {
  const { data } = await apiClient.get<CommentRecord[]>(
    `/community/configs/${configId}/comments`,
  );
  return data;
}

export async function postComment(
  configId: string,
  body: string,
  authorName?: string,
  parentId?: string,
): Promise<CommentRecord> {
  const { data } = await apiClient.post<CommentRecord>(
    `/community/configs/${configId}/comments`,
    {
      body,
      ...(authorName ? { authorName } : {}),
      ...(parentId ? { parentId } : {}),
    },
  );
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/community/comments/${commentId}`);
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function fetchFavorites(): Promise<FavoriteRecord[]> {
  const { data } = await apiClient.get<FavoriteRecord[]>("/favorites");
  return data;
}

export async function addFavorite(configId: string): Promise<void> {
  await apiClient.post(`/favorites/${configId}`);
}

export async function removeFavorite(configId: string): Promise<void> {
  await apiClient.delete(`/favorites/${configId}`);
}

export async function fetchFavoriteStatus(configId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ isFavorited: boolean }>(
    `/favorites/status/${configId}`,
  );
  return data.isFavorited;
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export async function addLike(configId: string): Promise<void> {
  await apiClient.post(`/likes/${configId}`);
}

export async function removeLike(configId: string): Promise<void> {
  await apiClient.delete(`/likes/${configId}`);
}

export async function fetchLikeStatus(configId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ isLiked: boolean }>(
    `/likes/status/${configId}`,
  );
  return data.isLiked;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const { data } = await apiClient.get<NotificationRecord[]>("/notifications");
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return data.count;
}

export async function markNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/mark-read");
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function submitReport(
  targetType: "config" | "comment",
  targetId: string,
  reason: string,
): Promise<void> {
  await apiClient.post("/reports", { targetType, targetId, reason });
}

// ─── Config history (version snapshots) ──────────────────────────────────────

export async function fetchConfigHistory(
  configId: string,
): Promise<ConfigSnapshotMeta[]> {
  const { data } = await apiClient.get<ConfigSnapshotMeta[]>(
    `/configs/${configId}/history`,
  );
  return data;
}

export async function fetchConfigSnapshot(
  configId: string,
  snapshotId: string,
): Promise<ConfigSnapshot> {
  const { data } = await apiClient.get<ConfigSnapshot>(
    `/configs/${configId}/history/${snapshotId}`,
  );
  return data;
}

// ─── Verified vehicles ────────────────────────────────────────────────────────

export async function fetchVehicles(): Promise<VehicleEntry[]> {
  const { data } = await apiClient.get<VehicleEntry[]>("/explore/vehicles");
  return data;
}

// ─── Collections ─────────────────────────────────────────────────────────────

export async function fetchCollections(): Promise<CollectionRecord[]> {
  const { data } = await apiClient.get<CollectionRecord[]>("/collections");
  return data;
}

export async function fetchCollection(id: string): Promise<CollectionRecord> {
  const { data } = await apiClient.get<CollectionRecord>(`/collections/${id}`);
  return data;
}

export async function createCollection(payload: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): Promise<CollectionRecord> {
  const { data } = await apiClient.post<CollectionRecord>(
    "/collections",
    payload,
  );
  return data;
}

export async function updateCollection(
  id: string,
  payload: { name: string; description?: string; isPublic?: boolean },
): Promise<CollectionRecord> {
  const { data } = await apiClient.put<CollectionRecord>(
    `/collections/${id}`,
    payload,
  );
  return data;
}

export async function deleteCollection(id: string): Promise<void> {
  await apiClient.delete(`/collections/${id}`);
}

export async function addToCollection(
  collectionId: string,
  configId: string,
): Promise<void> {
  await apiClient.post(`/collections/${collectionId}/items`, { configId });
}

export async function removeFromCollection(
  collectionId: string,
  configId: string,
): Promise<void> {
  await apiClient.delete(`/collections/${collectionId}/items/${configId}`);
}
