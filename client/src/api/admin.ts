/**
 * @fileoverview Admin API client functions.
 *
 * All admin API calls require the `X-Admin-Secret` header.
 * The secret is retrieved from `sessionStorage` (never localStorage —
 * it clears when the tab closes).
 */

import { apiClient } from "./index";

// ─── Types ────────────────────────────────────────────────────────────────────

/** High-level platform statistics returned by the admin stats endpoint. */
export interface AdminStats {
  totalUsers: number;
  totalConfigs: number;
  sharedConfigs: number;
  totalRatings: number;
  totalComments: number;
  totalPageViews: number;
  recentUsers: number;
  recentConfigs: number;
}

/** Summary row for a user in the admin user list. */
export interface AdminUser {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  _count: { configurations: number; ratings: number; comments: number };
}

/** Detailed user record including their configurations. */
export interface AdminUserDetail extends AdminUser {
  configurations: AdminConfigSummary[];
}

/** Summary row for a configuration in the admin config list. */
export interface AdminConfigSummary {
  id: string;
  name: string;
  description?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  isShared: boolean;
  isReadOnly: boolean;
  shareToken?: string;
  sharedAt?: string;
  viewCount: number;
  cloneCount: number;
  tags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count: { ratings: number; comments: number };
}

/** Paginated list response from the admin users endpoint. */
export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

/** Paginated list response from the admin configs endpoint. */
export interface AdminConfigList {
  configs: AdminConfigSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Page view analytics response. */
export interface AdminPageViews {
  total: number;
  byPath: { path: string; count: number }[];
  daily: { day: string; count: number }[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Injects the `X-Admin-Secret` header into an axios config.
 *
 * @param secret - The admin secret from sessionStorage.
 * @returns AxiosRequestConfig headers object.
 */
function adminHeaders(secret: string) {
  return { headers: { "X-Admin-Secret": secret } };
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetches the admin dashboard overview stats.
 *
 * @param secret - Admin secret.
 * @returns AdminStats object.
 */
export async function fetchAdminStats(secret: string): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>(
    "/admin/stats",
    adminHeaders(secret),
  );
  return data;
}

/**
 * Fetches a paginated list of all users.
 *
 * @param secret - Admin secret.
 * @param page   - Page number (1-based, default 1).
 * @param limit  - Items per page (default 50, max 100).
 */
export async function fetchAdminUsers(
  secret: string,
  page = 1,
  limit = 50,
): Promise<AdminUserList> {
  const { data } = await apiClient.get<AdminUserList>(
    `/admin/users?page=${page}&limit=${limit}`,
    adminHeaders(secret),
  );
  return data;
}

/**
 * Fetches full detail for a single user.
 *
 * @param secret - Admin secret.
 * @param id     - User UUID.
 */
export async function fetchAdminUser(
  secret: string,
  id: string,
): Promise<AdminUserDetail> {
  const { data } = await apiClient.get<AdminUserDetail>(
    `/admin/users/${id}`,
    adminHeaders(secret),
  );
  return data;
}

/**
 * Permanently deletes a user and all their data.
 *
 * @param secret - Admin secret.
 * @param id     - User UUID.
 */
export async function deleteAdminUser(
  secret: string,
  id: string,
): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`, adminHeaders(secret));
}

/**
 * Fetches a paginated list of all configurations.
 *
 * @param secret     - Admin secret.
 * @param page       - Page number (1-based).
 * @param limit      - Items per page.
 * @param sharedOnly - If true, only return shared configs.
 */
export async function fetchAdminConfigs(
  secret: string,
  page = 1,
  limit = 50,
  sharedOnly = false,
): Promise<AdminConfigList> {
  const { data } = await apiClient.get<AdminConfigList>(
    `/admin/configs?page=${page}&limit=${limit}&shared=${sharedOnly}`,
    adminHeaders(secret),
  );
  return data;
}

/**
 * Hard-deletes a configuration.
 *
 * @param secret - Admin secret.
 * @param id     - Configuration UUID.
 */
export async function deleteAdminConfig(
  secret: string,
  id: string,
): Promise<void> {
  await apiClient.delete(`/admin/configs/${id}`, adminHeaders(secret));
}

/**
 * Force-unshares a configuration, removing the public share link.
 *
 * @param secret - Admin secret.
 * @param id     - Configuration UUID.
 */
export async function unshareAdminConfig(
  secret: string,
  id: string,
): Promise<{ id: string; name: string; isShared: boolean }> {
  const { data } = await apiClient.put(
    `/admin/configs/${id}/unshare`,
    {},
    adminHeaders(secret),
  );
  return data;
}

/**
 * Fetches page view analytics for the given number of past days.
 *
 * @param secret - Admin secret.
 * @param days   - Number of days to look back (default 30).
 */
export async function fetchAdminPageViews(
  secret: string,
  days = 30,
): Promise<AdminPageViews> {
  const { data } = await apiClient.get<AdminPageViews>(
    `/admin/pageviews?days=${days}`,
    adminHeaders(secret),
  );
  return data;
}
