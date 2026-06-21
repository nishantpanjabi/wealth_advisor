package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.FundNavSnapshot;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FundNavSnapshotRepository extends JpaRepository<FundNavSnapshot, Long> {

    Optional<FundNavSnapshot> findTopByFundNameOrderByNavDateDescCreatedAtDesc(String fundName);

    boolean existsByFundNameAndNavDateAndSource(String fundName, LocalDate navDate, String source);

    List<FundNavSnapshot> findTop20ByOrderByNavDateDescCreatedAtDesc();
}
