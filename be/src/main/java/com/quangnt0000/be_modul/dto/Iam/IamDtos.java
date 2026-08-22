package com.quangnt0000.be_modul.dto.Iam;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Các kiểu request/response của module M01.
 *
 * <p>Gom vào một file dưới dạng record để dễ đối chiếu hợp đồng API; không có
 * hành vi nghiệp vụ nào ở đây.
 */
public final class IamDtos {

    private IamDtos() {
    }

    // ---- Đăng nhập -------------------------------------------------------

    /**
     * Kết quả đăng nhập. Khi {@code mfaRequired} là true, chỉ có
     * {@code mfaToken} được trả về và client phải gọi tiếp bước xác minh MFA.
     */
    public record LoginResult(
            boolean mfaRequired,
            String mfaToken,
            String token,
            String refreshToken,
            String role,
            List<String> roles,
            List<String> permissions,
            String orgCode,
            Integer clearanceLevel,
            Long expiresIn
    ) {
    }

    public record MfaVerifyRequest(String mfaToken, String code) {
    }

    public record RefreshRequest(String refreshToken) {
    }

    public record MfaEnrollResponse(String secret, String otpAuthUri) {
    }

    public record MfaActivateRequest(String code) {
    }

    // ---- Quản trị người dùng --------------------------------------------

    public record AssignRolesRequest(List<String> roleCodes, String reason) {
    }

    public record SetClearanceRequest(Integer clearanceLevel, String reason) {
    }

    public record SetOrganizationRequest(String orgCode, String reason) {
    }

    public record AttributeRequest(String key, String value, LocalDateTime expiresAt) {
    }

    public record RevokeRequest(String reason) {
    }

    public record UserAccessResponse(
            String userId,
            String username,
            String legacyRole,
            String orgCode,
            Integer clearanceLevel,
            Integer effectiveClearanceLevel,
            Boolean mfaEnabled,
            Boolean active,
            LocalDateTime revokedAt,
            LocalDateTime lastLoginAt,
            LocalDateTime lockedUntil,
            List<String> roles,
            List<String> permissions,
            Map<String, String> attributes
    ) {
    }

    // ---- Vai trò và quyền -----------------------------------------------

    public record RoleResponse(
            String id,
            String code,
            String name,
            String description,
            Integer maxClearanceLevel,
            Boolean crossOrg,
            Boolean systemRole,
            Boolean active,
            List<String> permissions
    ) {
    }

    public record RoleRequest(
            String code,
            String name,
            String description,
            Integer maxClearanceLevel,
            Boolean crossOrg,
            List<String> permissions
    ) {
    }

    public record PermissionResponse(String code, String name, String category, String description) {
    }

    public record OrganizationRequest(String code, String name, String parentId, String description) {
    }

    public record OrganizationResponse(
            String id, String code, String name, String parentId,
            String description, Boolean active
    ) {
    }

    // ---- Service account -------------------------------------------------

    public record ServiceAccountRequest(
            String clientId,
            String name,
            String description,
            String orgCode,
            Integer clearanceLevel,
            List<String> roleCodes,
            LocalDateTime expiresAt
    ) {
    }

    /** {@code clientSecret} chỉ xuất hiện một lần, lúc tạo hoặc xoay vòng. */
    public record ServiceAccountSecretResponse(String clientId, String clientSecret,
                                               LocalDateTime expiresAt) {
    }

    public record ServiceAccountResponse(
            String id, String clientId, String name, String description, String orgCode,
            Integer clearanceLevel, List<String> roles, Boolean active,
            LocalDateTime expiresAt, LocalDateTime lastUsedAt, LocalDateTime createdAt
    ) {
    }

    public record ClientCredentialsRequest(String clientId, String clientSecret) {
    }

    public record ServiceTokenResponse(String accessToken, String tokenType, Long expiresIn,
                                       List<String> scope) {
    }

    // ---- Rà soát quyền ---------------------------------------------------

    public record AccessReviewRequest(String name, String scopeOrgCode, LocalDateTime dueAt) {
    }

    public record AccessReviewResponse(
            String id, String name, String scopeOrgCode, String status,
            String createdBy, LocalDateTime createdAt, LocalDateTime dueAt,
            LocalDateTime completedAt, long totalItems, long pendingItems
    ) {
    }

    public record AccessReviewItemResponse(
            String id, String userId, String username, String orgCode, String roleCode,
            Integer clearanceLevel, String decision, String decidedBy,
            LocalDateTime decidedAt, String reason
    ) {
    }

    public record AccessDecisionRequest(String decision, String reason) {
    }

    // ---- Audit -----------------------------------------------------------

    public record AuthAuditResponse(
            String id, LocalDateTime occurredAt, String actor, String actorOrg, String action,
            String resourceType, String resourceId, String result, String policyDecision,
            String sourceIp, String correlationId, String details
    ) {
    }
}
