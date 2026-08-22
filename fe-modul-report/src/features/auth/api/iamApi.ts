import axiosClient from "../../../services/axiosClient";
import type { LoginResponse } from "../../employee/types/user";

/** Quyền hạt nhỏ do backend phát hành (đồng bộ với enums/IamCatalog.java). */
export const Permission = {
  DATA_UPLOAD: "data.upload",
  DATA_READ: "data.read",
  DATA_DOWNLOAD: "data.download",
  PIPELINE_EXECUTE: "pipeline.execute",
  JOB_READ: "job.read",
  SEARCH_EXECUTE: "search.execute",
  AI_CHAT: "ai.chat",
  REPORT_GENERATE: "report.generate",
  API_DESIGN: "api.design",
  APPROVAL_DECIDE: "approval.decide",
  AUDIT_READ: "audit.read",
  IAM_MANAGE: "iam.manage",
  ADMIN_MANAGE: "admin.manage",
} as const;

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxClearanceLevel: number;
  crossOrg: boolean;
  systemRole: boolean;
  active: boolean;
  permissions: string[];
}

export interface PermissionItem {
  code: string;
  name: string;
  category: string | null;
  description: string | null;
}

export interface OrganizationItem {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  description: string | null;
  active: boolean;
}

export interface UserAccess {
  userId: string;
  username: string;
  legacyRole: string | null;
  orgCode: string | null;
  clearanceLevel: number | null;
  effectiveClearanceLevel: number | null;
  mfaEnabled: boolean | null;
  active: boolean | null;
  revokedAt: string | null;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  roles: string[];
  permissions: string[];
  attributes: Record<string, string>;
}

export interface ServiceAccountItem {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  orgCode: string | null;
  clearanceLevel: number | null;
  roles: string[];
  active: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface AccessReviewItem {
  id: string;
  name: string;
  scopeOrgCode: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  dueAt: string | null;
  completedAt: string | null;
  totalItems: number;
  pendingItems: number;
}

export interface AccessReviewLine {
  id: string;
  userId: string;
  username: string;
  orgCode: string | null;
  roleCode: string;
  clearanceLevel: number | null;
  decision: "PENDING" | "KEEP" | "REVOKE";
  decidedBy: string | null;
  decidedAt: string | null;
  reason: string | null;
}

export interface AuthAuditItem {
  id: string;
  occurredAt: string;
  actor: string;
  actorOrg: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  result: "SUCCESS" | "DENIED" | "FAILURE";
  policyDecision: string | null;
  sourceIp: string | null;
  correlationId: string | null;
  details: string | null;
}

interface Listing<T> {
  total: number;
  items: T[];
}

export const iamApi = {
  // ---- Xác thực ---------------------------------------------------------
  verifyMfa: async (mfaToken: string, code: string): Promise<LoginResponse> =>
    (await axiosClient.post("/iam/auth/mfa/verify", { mfaToken, code })).data,

  refresh: async (refreshToken: string): Promise<LoginResponse> =>
    (await axiosClient.post("/iam/auth/refresh", { refreshToken })).data,

  enrollMfa: async (): Promise<{ secret: string; otpAuthUri: string }> =>
    (await axiosClient.post("/iam/auth/mfa/enroll")).data,

  activateMfa: async (code: string): Promise<void> => {
    await axiosClient.post("/iam/auth/mfa/activate", { code });
  },

  disableMfa: async (userId: string, reason: string): Promise<void> => {
    await axiosClient.post(`/iam/auth/users/${userId}/mfa/disable`, { reason });
  },

  logoutEverywhere: async (): Promise<void> => {
    await axiosClient.post("/iam/auth/logout-all");
  },

  // ---- Danh mục ---------------------------------------------------------
  listRoles: async (): Promise<Listing<RoleItem>> =>
    (await axiosClient.get("/iam/roles")).data,

  createRole: async (payload: Partial<RoleItem>): Promise<RoleItem> =>
    (await axiosClient.post("/iam/roles", payload)).data,

  updateRole: async (id: string, payload: Partial<RoleItem>): Promise<RoleItem> =>
    (await axiosClient.put(`/iam/roles/${id}`, payload)).data,

  deactivateRole: async (id: string): Promise<RoleItem> =>
    (await axiosClient.delete(`/iam/roles/${id}`)).data,

  listPermissions: async (): Promise<Listing<PermissionItem>> =>
    (await axiosClient.get("/iam/permissions")).data,

  listOrganizations: async (): Promise<Listing<OrganizationItem>> =>
    (await axiosClient.get("/iam/organizations")).data,

  createOrganization: async (
    payload: Pick<OrganizationItem, "code" | "name"> & { description?: string }
  ): Promise<OrganizationItem> =>
    (await axiosClient.post("/iam/organizations", payload)).data,

  // ---- Người dùng -------------------------------------------------------
  listUsers: async (): Promise<Listing<UserAccess>> =>
    (await axiosClient.get("/iam/users")).data,

  myAccess: async (): Promise<UserAccess> =>
    (await axiosClient.get("/iam/users/me/access")).data,

  assignRoles: async (userId: string, roleCodes: string[], reason?: string): Promise<UserAccess> =>
    (await axiosClient.put(`/iam/users/${userId}/roles`, { roleCodes, reason })).data,

  setClearance: async (userId: string, clearanceLevel: number, reason: string): Promise<UserAccess> =>
    (await axiosClient.put(`/iam/users/${userId}/clearance`, { clearanceLevel, reason })).data,

  setOrganization: async (userId: string, orgCode: string, reason?: string): Promise<UserAccess> =>
    (await axiosClient.put(`/iam/users/${userId}/organization`, { orgCode, reason })).data,

  upsertAttribute: async (
    userId: string,
    key: string,
    value: string,
    expiresAt?: string
  ): Promise<UserAccess> =>
    (await axiosClient.put(`/iam/users/${userId}/attributes`, { key, value, expiresAt })).data,

  deleteAttribute: async (userId: string, key: string): Promise<UserAccess> =>
    (await axiosClient.delete(`/iam/users/${userId}/attributes/${key}`)).data,

  revokeUser: async (userId: string, reason: string): Promise<UserAccess> =>
    (await axiosClient.post(`/iam/users/${userId}/revoke`, { reason })).data,

  reinstateUser: async (userId: string, reason: string): Promise<UserAccess> =>
    (await axiosClient.post(`/iam/users/${userId}/reinstate`, { reason })).data,

  // ---- Service account --------------------------------------------------
  listServiceAccounts: async (): Promise<Listing<ServiceAccountItem>> =>
    (await axiosClient.get("/iam/service-accounts")).data,

  createServiceAccount: async (payload: {
    clientId: string;
    name: string;
    description?: string;
    orgCode?: string;
    clearanceLevel?: number;
    roleCodes: string[];
    expiresAt?: string;
  }): Promise<{ clientId: string; clientSecret: string; expiresAt: string | null }> =>
    (await axiosClient.post("/iam/service-accounts", payload)).data,

  rotateServiceAccountSecret: async (
    id: string
  ): Promise<{ clientId: string; clientSecret: string; expiresAt: string | null }> =>
    (await axiosClient.post(`/iam/service-accounts/${id}/rotate-secret`)).data,

  revokeServiceAccount: async (id: string, reason: string): Promise<ServiceAccountItem> =>
    (await axiosClient.post(`/iam/service-accounts/${id}/revoke`, { reason })).data,

  // ---- Rà soát quyền ----------------------------------------------------
  listAccessReviews: async (): Promise<Listing<AccessReviewItem>> =>
    (await axiosClient.get("/iam/access-reviews")).data,

  openAccessReview: async (payload: {
    name: string;
    scopeOrgCode?: string;
    dueAt?: string;
  }): Promise<AccessReviewItem> =>
    (await axiosClient.post("/iam/access-reviews", payload)).data,

  accessReviewItems: async (reviewId: string): Promise<Listing<AccessReviewLine>> =>
    (await axiosClient.get(`/iam/access-reviews/${reviewId}/items`)).data,

  decideAccessReviewItem: async (
    itemId: string,
    decision: "KEEP" | "REVOKE",
    reason?: string
  ): Promise<void> => {
    await axiosClient.post(`/iam/access-reviews/items/${itemId}/decision`, { decision, reason });
  },

  completeAccessReview: async (reviewId: string): Promise<AccessReviewItem> =>
    (await axiosClient.post(`/iam/access-reviews/${reviewId}/complete`)).data,

  // ---- Audit ------------------------------------------------------------
  searchAuthAudit: async (params: {
    actor?: string;
    action?: string;
    result?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<Listing<AuthAuditItem> & { page: number; size: number }> =>
    (await axiosClient.get("/iam/audit", { params })).data,
};

export default iamApi;
