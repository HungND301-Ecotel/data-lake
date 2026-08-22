package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.AccessReviewItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccessReviewItemRepository extends JpaRepository<AccessReviewItem, String> {
    List<AccessReviewItem> findByReviewIdOrderByUsernameAsc(String reviewId);

    long countByReviewIdAndDecision(String reviewId, String decision);
}
