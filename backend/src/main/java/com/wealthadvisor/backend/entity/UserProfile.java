package com.wealthadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyExpenses;

    private Double savingsRate;
    private Integer age;
    private Integer dependents;
    private String employmentType;   // SALARIED, SELF_EMPLOYED, BUSINESS

    @Column(precision = 15, scale = 2)
    private BigDecimal netWorth;

    private Integer investmentExperienceYears;
    private String investmentKnowledge;  // BEGINNER, INTERMEDIATE, EXPERT
}