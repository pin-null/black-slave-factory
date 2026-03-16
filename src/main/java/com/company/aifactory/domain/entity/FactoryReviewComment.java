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
@Table(name = "factory_review_comment")
public class FactoryReviewComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "step_id")
    private Long stepId;

    @Column(name = "review_round", nullable = false)
    private Integer reviewRound = 1;

    @Column(name = "source", nullable = false, length = 32)
    private String source = "AI";

    @Column(name = "file_path", length = 1024)
    private String filePath;

    @Column(name = "line_no")
    private Integer lineNo;

    @Column(name = "severity", length = 32)
    private String severity;

    @Column(name = "comment_type", length = 64)
    private String commentType;

    @Column(name = "blocking_flag", nullable = false)
    private Boolean blockingFlag = false;

    @Lob
    @Column(name = "message")
    private String message;

    @Lob
    @Column(name = "suggestion")
    private String suggestion;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "OPEN";

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
