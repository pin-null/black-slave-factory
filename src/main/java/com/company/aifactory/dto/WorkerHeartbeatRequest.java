package com.company.aifactory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class WorkerHeartbeatRequest {

    @NotBlank
    private String workerCode;

    private String workerName;

    @NotBlank
    private String workerType;

    private String host;

    private String ip;

    private Integer port;

    @NotBlank
    private String status;

    @Min(1)
    private Integer maxConcurrency = 1;

    @Min(0)
    private Integer currentLoad = 0;

    private List<String> tags;

    private String version;

    private String remark;
}
