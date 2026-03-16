package com.company.aifactory.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "github_webhook_event")
public class GithubWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delivery_id", nullable = false, unique = true, length = 128)
    private String deliveryId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "action", length = 64)
    private String action;

    @Column(name = "repository_full_name", length = 256)
    private String repositoryFullName;

    @Column(name = "issue_number")
    private Integer issueNumber;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Lob
    @Column(name = "raw_payload")
    private String rawPayload;

    @Lob
    @Column(name = "error_message")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
