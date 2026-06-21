package com.wealthadvisor.backend.entity;


import com.wealthadvisor.backend.enums.AssetType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(nullable = false)
    private String assetName;

    @Enumerated(EnumType.STRING)
    private AssetType assetType;

    @Column(precision = 15, scale = 2)
    private BigDecimal buyPrice;

    private Double quantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal currentValue;

    private LocalDate purchaseDate;

    // calculated field — not stored, computed on the fly
    @Transient
    private BigDecimal profitLoss;
}