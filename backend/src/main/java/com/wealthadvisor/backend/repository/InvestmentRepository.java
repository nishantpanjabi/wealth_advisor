package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.Investment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    List<Investment> findAllByPortfolioIdOrderByPurchaseDateDescIdDesc(Long portfolioId);

    Optional<Investment> findByIdAndPortfolioId(Long id, Long portfolioId);
}
