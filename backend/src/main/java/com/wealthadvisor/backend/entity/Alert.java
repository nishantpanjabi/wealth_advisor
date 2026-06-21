package com.wealthadvisor.backend.entity;


import com.wealthadvisor.backend.enums.AlertSeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    @Column(nullable = false)
    private String message;

    private String actionSuggestion;   // "Increase SIP by ₹2000"

    @Builder.Default
    private Boolean isRead = false;

    private LocalDateTime snoozedUntil;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
