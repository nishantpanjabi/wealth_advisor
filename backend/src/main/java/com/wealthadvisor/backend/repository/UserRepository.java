package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderUserId(String providerUserId);

    boolean existsByEmail(String email);
}
