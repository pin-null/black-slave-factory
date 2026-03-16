package com.company.aifactory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkerReportRequest {

    @NotBlank
    private String workerCode;

    @NotNull
    private Long taskId;

    @NotNull
    private Long stepId;

    @NotBlank
    private String status;

    private String summary;

    private String outputPayload;

    private String errorCode;

    private String errorMessage;
}
