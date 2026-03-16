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
@Table(name = "factory_worker")
public class FactoryWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_code", nullable = false, unique = true, length = 64)
    private String workerCode;

    @Column(name = "worker_name", length = 128)
    private String workerName;

    @Column(name = "worker_type", nullable = false, length = 32)
    private String workerType;

    @Column(name = "host", length = 128)
    private String host;

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "port")
    private Integer port;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "max_concurrency", nullable = false)
    private Integer maxConcurrency = 1;

    @Column(name = "current_load", nullable = false)
    private Integer currentLoad = 0;

    @Column(name = "tags_json", columnDefinition = "json")
    private String tagsJson;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Column(name = "version", length = 64)
    private String version;

    @Column(name = "remark", length = 512)
    private String remark;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
