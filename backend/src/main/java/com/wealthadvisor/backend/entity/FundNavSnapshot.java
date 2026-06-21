package com.wealthadvisor.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "fund_nav_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundNavSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String fundName;

    @Column(nullable = false, length = 32)
    private String assetClass;

    @Column(nullable = false)
    private LocalDate navDate;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal navValue;

    @Column(nullable = false, length = 64)
    private String source;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
