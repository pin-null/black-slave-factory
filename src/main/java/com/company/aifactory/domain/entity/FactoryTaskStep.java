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
@Table(name = "factory_task_step")
public class FactoryTaskStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "step_no", nullable = false, unique = true, length = 64)
    private String stepNo;

    @Column(name = "step_name", nullable = false, length = 64)
    private String stepName;

    @Column(name = "step_type", nullable = false, length = 64)
    private String stepType;

    @Column(name = "seq_no", nullable = false)
    private Integer seqNo;

    @Column(name = "step_status", nullable = false, length = 64)
    private String stepStatus;

    @Column(name = "worker_code", length = 64)
    private String workerCode;

    @Column(name = "input_payload", columnDefinition = "json")
    private String inputPayload;

    @Column(name = "output_payload", columnDefinition = "json")
    private String outputPayload;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Lob
    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
