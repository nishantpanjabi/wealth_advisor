package com.wealthadvisor.backend.entity;


import com.wealthadvisor.backend.enums.ScenarioType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "simulation_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private ScenarioType scenarioType;

    @Column(precision = 15, scale = 2)
    private BigDecimal portfolioValueBefore;

    @Column(precision = 15, scale = 2)
    private BigDecimal portfolioValueAfter;

    private Double changePercent;

    @Column(columnDefinition = "TEXT")
    private String monteCarloData;  // stored as JSON string

    @CreationTimestamp
    private LocalDateTime runAt;
}