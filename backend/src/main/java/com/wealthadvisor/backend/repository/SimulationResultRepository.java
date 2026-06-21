package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.SimulationResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulationResultRepository extends JpaRepository<SimulationResult, Long> {

    List<SimulationResult> findAllByUserIdOrderByRunAtDesc(Long userId);
}
