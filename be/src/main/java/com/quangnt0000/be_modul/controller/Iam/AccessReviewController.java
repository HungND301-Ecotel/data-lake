package com.quangnt0000.be_modul.controller.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.service.Iam.AccessReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Rà soát quyền định kỳ - UC01.06. */
@RestController
@RequestMapping("/iam/access-reviews")
@RequiredArgsConstructor
public class AccessReviewController {

    private final AccessReviewService accessReviewService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('iam.manage','audit.read')")
    public ResponseEntity<?> list() {
        return accessReviewService.list();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> open(@RequestBody IamDtos.AccessReviewRequest request) {
        return accessReviewService.open(request, currentUserId());
    }

    @GetMapping("/{reviewId}/items")
    @PreAuthorize("hasAnyAuthority('iam.manage','audit.read')")
    public ResponseEntity<?> items(@PathVariable String reviewId) {
        return accessReviewService.items(reviewId);
    }

    @PostMapping("/items/{itemId}/decision")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> decide(@PathVariable String itemId,
                                    @RequestBody IamDtos.AccessDecisionRequest request) {
        return accessReviewService.decide(itemId, request, currentUserId());
    }

    @PostMapping("/{reviewId}/complete")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> complete(@PathVariable String reviewId) {
        return accessReviewService.complete(reviewId, currentUserId());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
