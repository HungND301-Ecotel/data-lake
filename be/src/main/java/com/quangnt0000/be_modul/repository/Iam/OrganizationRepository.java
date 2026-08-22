package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationRepository extends JpaRepository<Organization, String> {
    Optional<Organization> findByCode(String code);

    List<Organization> findByActiveTrueOrderByCodeAsc();

    boolean existsByCode(String code);
}
