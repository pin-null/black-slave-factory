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
@Table(name = "factory_artifact")
public class FactoryArtifact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "step_id")
    private Long stepId;

    @Column(name = "artifact_type", nullable = false, length = 64)
    private String artifactType;

    @Column(name = "artifact_name", length = 256)
    private String artifactName;

    @Column(name = "artifact_path", length = 1024)
    private String artifactPath;

    @Lob
    @Column(name = "artifact_content")
    private String artifactContent;

    @Column(name = "content_encoding", length = 32)
    private String contentEncoding;

    @Column(name = "content_size")
    private Long contentSize;

    @Column(name = "checksum", length = 128)
    private String checksum;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
