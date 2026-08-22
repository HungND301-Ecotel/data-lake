package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {
    Optional<Role> findByCode(String code);

    List<Role> findByActiveTrueOrderByCodeAsc();

    boolean existsByCode(String code);
}
