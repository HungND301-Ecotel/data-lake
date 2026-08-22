package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.AccessReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccessReviewRepository extends JpaRepository<AccessReview, String> {
    List<AccessReview> findAllByOrderByCreatedAtDesc();
}
