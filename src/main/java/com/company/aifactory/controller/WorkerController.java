package com.company.aifactory.controller;

import com.company.aifactory.dto.ApiResponse;
import com.company.aifactory.dto.WorkerHeartbeatRequest;
import com.company.aifactory.dto.WorkerHeartbeatResponse;
import com.company.aifactory.dto.WorkerPullRequest;
import com.company.aifactory.dto.WorkerReportRequest;
import com.company.aifactory.dto.WorkerReportResponse;
import com.company.aifactory.dto.WorkerTaskResponse;
import com.company.aifactory.service.WorkerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/factory/workers")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;

    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<WorkerHeartbeatResponse>> heartbeat(@Valid @RequestBody WorkerHeartbeatRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(workerService.heartbeat(request)));
    }

    @PostMapping("/pull")
    public ResponseEntity<ApiResponse<WorkerTaskResponse>> pull(@Valid @RequestBody WorkerPullRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(workerService.pull(request)));
    }

    @PostMapping("/report")
    public ResponseEntity<ApiResponse<WorkerReportResponse>> report(@Valid @RequestBody WorkerReportRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(workerService.report(request)));
    }
}
