package com.quangnt0000.be_modul.repository.DataWH;
import com.quangnt0000.be_modul.modal.DataWH.UserPush;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPushRepository extends JpaRepository<UserPush, String> {
    Optional<UserPush> findByUsername(String username);
    boolean existsByUsername(String username);
}
