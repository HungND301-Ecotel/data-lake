package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.ServiceAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceAccountRepository extends JpaRepository<ServiceAccount, String> {
    Optional<ServiceAccount> findByClientId(String clientId);

    List<ServiceAccount> findAllByOrderByCreatedAtDesc();

    boolean existsByClientId(String clientId);
}
