package com.wealthadvisor.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "market_data_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketDataSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String assetClass;

    @Column(nullable = false)
    private LocalDate asOfDate;

    @Column(nullable = false)
    private Double returnAdjustment;

    @Column(nullable = false)
    private Double volatilityAdjustment;

    @Column(nullable = false, length = 64)
    private String marketRegime;

    @Column(nullable = false, length = 64)
    private String source;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
