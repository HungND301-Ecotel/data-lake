package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.UserAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAttributeRepository extends JpaRepository<UserAttribute, String> {
    List<UserAttribute> findByUserId(String userId);

    Optional<UserAttribute> findByUserIdAndKey(String userId, String key);

    void deleteByUserIdAndKey(String userId, String key);
}
