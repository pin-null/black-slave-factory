package com.company.aifactory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerTaskResponse {
    private Boolean assigned;
    private Long taskId;
    private Long stepId;
    private String taskNo;
    private RepoInfo repo;
    private IssueInfo issue;
    private BranchInfo branch;
    private IntentInfo intent;
    private StepInfo step;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepoInfo {
        private String fullName;
        private String owner;
        private String name;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueInfo {
        private Integer number;
        private String title;
        private String body;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchInfo {
        private String base;
        private String work;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntentInfo {
        private String taskType;
        private String riskLevel;
        private String summary;
        private List<String> acceptanceCriteria;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepInfo {
        private String name;
        private String type;
        private String status;
    }

    public static WorkerTaskResponse empty() {
        return WorkerTaskResponse.builder().assigned(false).build();
    }
}
