package com.wealthadvisor.backend.entity;


import com.wealthadvisor.backend.enums.GoalStatus;
import com.wealthadvisor.backend.enums.GoalType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private GoalType goalType;

    @Column(precision = 15, scale = 2)
    private BigDecimal targetAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal currentAmount;

    private Integer targetYears;

    private Double expectedAnnualReturn;

    private Double expectedInflationRate;

    @Column(precision = 15, scale = 2)
    private BigDecimal requiredMonthlyInvestment;

    @Column(precision = 15, scale = 2)
    private BigDecimal inflationAdjustedTarget;

    @Enumerated(EnumType.STRING)
    private GoalStatus status;

    private Integer priority;  // 1 = highest
}
