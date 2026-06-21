package com.wealthadvisor.backend.repository;

import com.wealthadvisor.backend.entity.PortfolioTransaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioTransactionRepository extends JpaRepository<PortfolioTransaction, Long> {

    List<PortfolioTransaction> findAllByPortfolioIdOrderByTransactionDateAscCreatedAtAsc(Long portfolioId);

    List<PortfolioTransaction> findAllByPortfolioIdOrderByTransactionDateDescCreatedAtDesc(Long portfolioId);
}
