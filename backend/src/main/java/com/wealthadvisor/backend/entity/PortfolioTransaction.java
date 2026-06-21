package com.wealthadvisor.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "portfolio_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    private Long investmentId;

    @Column(nullable = false)
    private String assetName;

    @Column(nullable = false)
    private String actionType;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    private Double quantity;

    private LocalDate transactionDate;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
