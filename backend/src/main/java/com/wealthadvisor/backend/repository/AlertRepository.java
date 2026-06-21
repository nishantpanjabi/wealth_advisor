package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.Alert;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findAllByUserId(Long userId);

    Optional<Alert> findByIdAndUserId(Long id, Long userId);

    List<Alert> findAllByUserIdAndSnoozedUntilIsNullOrSnoozedUntilBefore(Long userId, LocalDateTime now);
}
