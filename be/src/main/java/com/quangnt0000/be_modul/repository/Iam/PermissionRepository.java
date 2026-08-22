package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, String> {
    Optional<Permission> findByCode(String code);

    List<Permission> findByCodeIn(List<String> codes);
}
