package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.MarketDataSnapshot;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketDataSnapshotRepository extends JpaRepository<MarketDataSnapshot, Long> {

    Optional<MarketDataSnapshot> findTopByAssetClassOrderByAsOfDateDescCreatedAtDesc(String assetClass);

    boolean existsByAssetClassAndAsOfDateAndSource(String assetClass, LocalDate asOfDate, String source);

    List<MarketDataSnapshot> findAllByOrderByAsOfDateDescCreatedAtDesc();
}
