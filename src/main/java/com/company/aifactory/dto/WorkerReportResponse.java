package com.company.aifactory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WorkerReportResponse {
    private Long taskId;
    private Long stepId;
    private String taskStatus;
    private String stepStatus;
}
