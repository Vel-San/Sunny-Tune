/// <reference types="vite/client" />
import axios from "axios";
import type {
  CommentRecord,
  CommunityStats,
  ConfigRecord,
  ExploreResponse,
  RatingRecord,
  RatingSummary,
  SPConfig,
  UserRecord,
} from "../types/config";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

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
    return Promise.reject(new Error(message));
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

// ─── Configs ──────────────────────────────────────────────────────────────────

export async function fetchConfigs(): Promise<ConfigRecord[]> {
  const { data } = await apiClient.get<ConfigRecord[]>("/configs");
  return data;
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

export async function shareConfig(id: string): Promise<{ shareToken: string }> {
  const { data } = await apiClient.post<{ shareToken: string }>(
    `/configs/${id}/share`,
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
  sort?: "rating" | "recent" | "views" | "clones" | "comments";
  page?: number;
  limit?: number;
}): Promise<ExploreResponse> {
  const query: Record<string, string> = {};
  if (params.q) query.q = params.q;
  if (params.make) query.make = params.make;
  if (params.model) query.model = params.model;
  if (params.year) query.year = params.year.toString();
  if (params.tags?.length) query.tags = params.tags.join(",");
  if (params.category) query.category = params.category;
  if (params.sort) query.sort = params.sort;
  if (params.page) query.page = params.page.toString();
  if (params.limit) query.limit = params.limit.toString();
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
): Promise<CommentRecord> {
  const { data } = await apiClient.post<CommentRecord>(
    `/community/configs/${configId}/comments`,
    { body, ...(authorName ? { authorName } : {}) },
  );
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/community/comments/${commentId}`);
}
