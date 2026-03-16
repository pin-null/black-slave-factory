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
@Table(name = "factory_task")
public class FactoryTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_no", nullable = false, unique = true, length = 64)
    private String taskNo;

    @Column(name = "repo_owner", length = 128)
    private String repoOwner;

    @Column(name = "repo_name", length = 128)
    private String repoName;

    @Column(name = "repo_full_name", nullable = false, length = 256)
    private String repoFullName;

    @Column(name = "issue_number", nullable = false)
    private Integer issueNumber;

    @Column(name = "issue_title", length = 512)
    private String issueTitle;

    @Lob
    @Column(name = "issue_body")
    private String issueBody;

    @Column(name = "task_type", length = 64)
    private String taskType;

    @Column(name = "source_event", length = 64)
    private String sourceEvent;

    @Column(name = "trigger_type", length = 32)
    private String triggerType;

    @Column(name = "trigger_content", length = 256)
    private String triggerContent;

    @Column(name = "current_status", nullable = false, length = 64)
    private String currentStatus;

    @Column(name = "priority", nullable = false)
    private Integer priority = 0;

    @Column(name = "risk_level", length = 32)
    private String riskLevel;

    @Column(name = "base_branch", length = 128)
    private String baseBranch = "main";

    @Column(name = "work_branch", length = 128)
    private String workBranch;

    @Column(name = "pr_number")
    private Integer prNumber;

    @Column(name = "pr_url", length = 512)
    private String prUrl;

    @Column(name = "max_fix_rounds", nullable = false)
    private Integer maxFixRounds = 2;

    @Column(name = "current_fix_round", nullable = false)
    private Integer currentFixRound = 0;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "max_retry", nullable = false)
    private Integer maxRetry = 3;

    @Column(name = "last_error_code", length = 64)
    private String lastErrorCode;

    @Lob
    @Column(name = "last_error_message")
    private String lastErrorMessage;

    @Column(name = "ext_json", columnDefinition = "json")
    private String extJson;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
