package com.wealthadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "portfolios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Double equityPct;
    private Double debtPct;
    private Double goldPct;
    private Double liquidPct;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalInvestedValue;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalCurrentValue;

    @UpdateTimestamp
    private LocalDateTime lastRebalanced;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL)
    private List<Investment> investments;
}