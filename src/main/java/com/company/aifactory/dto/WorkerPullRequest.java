package com.company.aifactory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class WorkerPullRequest {

    @NotBlank
    private String workerCode;

    private String workerType;

    private List<String> supportedStepTypes;

    private List<String> tags;
}
