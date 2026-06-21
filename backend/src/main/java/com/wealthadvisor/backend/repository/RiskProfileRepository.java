package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.RiskProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskProfileRepository extends JpaRepository<RiskProfile, Long> {

    List<RiskProfile> findAllByUserIdOrderByCalculatedAtDesc(Long userId);

    Optional<RiskProfile> findTopByUserIdOrderByCalculatedAtDesc(Long userId);
}
