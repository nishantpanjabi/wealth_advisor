package com.wealthadvisor.backend.entity;


import com.wealthadvisor.backend.enums.RiskCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer riskScore;          // 0–100

    @Enumerated(EnumType.STRING)
    private RiskCategory riskCategory;  // CONSERVATIVE, MODERATE, AGGRESSIVE

    private Integer ageScore;
    private Integer incomeScore;
    private Integer horizonScore;
    private Integer toleranceScore;
    private Integer experienceScore;

    @CreationTimestamp
    private LocalDateTime calculatedAt;
}