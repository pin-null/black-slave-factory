package com.company.aifactory.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "factory_execution_log")
public class FactoryExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "step_id")
    private Long stepId;

    @Column(name = "worker_code", length = 64)
    private String workerCode;

    @Column(name = "log_level", length = 16)
    private String logLevel;

    @Column(name = "source", length = 64)
    private String source;

    @Lob
    @Column(name = "content")
    private String content;

    @Column(name = "trace_id", length = 64)
    private String traceId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
