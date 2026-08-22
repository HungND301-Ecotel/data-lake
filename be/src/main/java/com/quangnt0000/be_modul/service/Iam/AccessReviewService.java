package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.modal.Iam.AccessReview;
import com.quangnt0000.be_modul.modal.Iam.AccessReviewItem;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.repository.Iam.AccessReviewItemRepository;
import com.quangnt0000.be_modul.repository.Iam.AccessReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Rà soát quyền định kỳ - UC01.06.
 *
 * <p>Mở đợt rà soát sẽ chụp lại toàn bộ gán vai trò đang hiệu lực. Quyết định
 * THU HỒI được áp dụng ngay lên tài khoản và tăng phiên bản token, nên người
 * dùng mất quyền mà không phải chờ token hết hạn.
 */
@Service
@RequiredArgsConstructor
public class AccessReviewService {

    private static final String PENDING = "PENDING";
    private static final String KEEP = "KEEP";
    private static final String REVOKE = "REVOKE";

    private final AccessReviewRepository reviewRepository;
    private final AccessReviewItemRepository itemRepository;
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final AuthAuditService auditService;

    @Transactional
    public ResponseEntity<?> open(IamDtos.AccessReviewRequest request, String actorId) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu tên đợt rà soát");
        }

        AccessReview review = reviewRepository.save(AccessReview.builder()
                .name(request.name())
                .scopeOrgCode(request.scopeOrgCode())
                .status("OPEN")
                .createdBy(actorId)
                .createdAt(LocalDateTime.now())
                .dueAt(request.dueAt())
                .build());

        List<AccessReviewItem> items = new ArrayList<>();
        for (User user : userRepository.findAll()) {
            if (request.scopeOrgCode() != null
                    && !request.scopeOrgCode().equals(user.getOrgCode())) {
                continue;
            }
            if (!Boolean.TRUE.equals(user.getStatus())) {
                continue;
            }
            Set<Role> roles = tokenService.effectiveRoles(user);
            for (Role role : roles) {
                items.add(AccessReviewItem.builder()
                        .reviewId(review.getId())
                        .userId(user.getId())
                        .username(user.getUsername())
                        .orgCode(user.getOrgCode())
                        .roleCode(role.getCode())
                        .clearanceLevel(tokenService.effectiveClearance(user, roles))
                        .decision(PENDING)
                        .build());
            }
        }
        itemRepository.saveAll(items);

        auditService.record(actorId, request.scopeOrgCode(), "ACCESS_REVIEW_OPENED",
                "access_review", review.getId(), AuthAuditService.SUCCESS, null,
                Map.of("items", items.size(), "scope",
                        request.scopeOrgCode() == null ? "ALL" : request.scopeOrgCode()));

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(review));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> list() {
        List<IamDtos.AccessReviewResponse> items = reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> items(String reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy đợt rà soát");
        }
        List<IamDtos.AccessReviewItemResponse> items =
                itemRepository.findByReviewIdOrderByUsernameAsc(reviewId).stream()
                        .map(item -> new IamDtos.AccessReviewItemResponse(
                                item.getId(), item.getUserId(), item.getUsername(),
                                item.getOrgCode(), item.getRoleCode(), item.getClearanceLevel(),
                                item.getDecision(), item.getDecidedBy(), item.getDecidedAt(),
                                item.getReason()))
                        .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    @Transactional
    public ResponseEntity<?> decide(String itemId, IamDtos.AccessDecisionRequest request,
                                    String actorId) {
        AccessReviewItem item = itemRepository.findById(itemId).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy mục rà soát");
        }
        String decision = request.decision() == null ? "" : request.decision().toUpperCase();
        if (!KEEP.equals(decision) && !REVOKE.equals(decision)) {
            return ResponseEntity.badRequest().body("Quyết định phải là KEEP hoặc REVOKE");
        }
        if (REVOKE.equals(decision) && (request.reason() == null || request.reason().isBlank())) {
            return ResponseEntity.badRequest().body("Thu hồi quyền phải kèm lý do");
        }

        item.setDecision(decision);
        item.setDecidedBy(actorId);
        item.setDecidedAt(LocalDateTime.now());
        item.setReason(request.reason());
        itemRepository.save(item);

        if (REVOKE.equals(decision)) {
            applyRevocation(item, actorId);
        }

        auditService.record(actorId, item.getOrgCode(), "ACCESS_REVIEW_DECIDED",
                "access_review_item", itemId, AuthAuditService.SUCCESS, null,
                Map.of("decision", decision, "userId", item.getUserId(),
                        "roleCode", item.getRoleCode(),
                        "reason", request.reason() == null ? "" : request.reason()));

        return ResponseEntity.ok(Map.of("id", itemId, "decision", decision));
    }

    @Transactional
    public ResponseEntity<?> complete(String reviewId, String actorId) {
        AccessReview review = reviewRepository.findById(reviewId).orElse(null);
        if (review == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy đợt rà soát");
        }
        long pending = itemRepository.countByReviewIdAndDecision(reviewId, PENDING);
        if (pending > 0) {
            return ResponseEntity.badRequest()
                    .body("Còn " + pending + " mục chưa quyết định");
        }
        review.setStatus("COMPLETED");
        review.setCompletedAt(LocalDateTime.now());
        review.setCompletedBy(actorId);
        reviewRepository.save(review);

        auditService.success(actorId, "ACCESS_REVIEW_COMPLETED", "access_review", reviewId, null);
        return ResponseEntity.ok(toResponse(review));
    }

    /** Gỡ đúng vai trò bị thu hồi và vô hiệu token đang lưu hành của người đó. */
    private void applyRevocation(AccessReviewItem item, String actorId) {
        User user = userRepository.findById(item.getUserId()).orElse(null);
        if (user == null) {
            return;
        }
        Set<Role> remaining = user.getRoles().stream()
                .filter(role -> !role.getCode().equals(item.getRoleCode()))
                .collect(Collectors.toSet());

        if (remaining.size() != user.getRoles().size()) {
            user.setRoles(remaining);
        } else if (item.getRoleCode().equalsIgnoreCase(user.getRole())) {
            // Vai trò đến từ trường chuỗi cũ; xoá để người dùng không còn quyền đó.
            user.setRole(null);
        }
        user.setTokenVersion((user.getTokenVersion() == null ? 0 : user.getTokenVersion()) + 1);
        userRepository.save(user);

        auditService.record(actorId, user.getOrgCode(), "ROLE_REVOKED", "user", user.getId(),
                AuthAuditService.SUCCESS, "access_review",
                Map.of("roleCode", item.getRoleCode()));
    }

    private IamDtos.AccessReviewResponse toResponse(AccessReview review) {
        long total = itemRepository.findByReviewIdOrderByUsernameAsc(review.getId()).size();
        long pending = itemRepository.countByReviewIdAndDecision(review.getId(), PENDING);
        return new IamDtos.AccessReviewResponse(
                review.getId(), review.getName(), review.getScopeOrgCode(), review.getStatus(),
                review.getCreatedBy(), review.getCreatedAt(), review.getDueAt(),
                review.getCompletedAt(), total, pending);
    }
}
