package com.company.aifactory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WorkerHeartbeatResponse {
    private String workerCode;
    private String status;
    private Integer currentLoad;
}
