package com.company.aifactory.service;

import com.company.aifactory.domain.entity.FactoryTask;
import com.company.aifactory.domain.entity.FactoryTaskStep;
import com.company.aifactory.domain.entity.FactoryWorker;
import com.company.aifactory.dto.WorkerHeartbeatRequest;
import com.company.aifactory.dto.WorkerHeartbeatResponse;
import com.company.aifactory.dto.WorkerPullRequest;
import com.company.aifactory.dto.WorkerReportRequest;
import com.company.aifactory.dto.WorkerReportResponse;
import com.company.aifactory.dto.WorkerTaskResponse;
import com.company.aifactory.repository.FactoryTaskRepository;
import com.company.aifactory.repository.FactoryWorkerRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkerService {

    private final FactoryWorkerRepository factoryWorkerRepository;
    private final FactoryTaskRepository factoryTaskRepository;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    @Transactional
    public WorkerHeartbeatResponse heartbeat(WorkerHeartbeatRequest request) {
        FactoryWorker worker = factoryWorkerRepository.findByWorkerCodeAndDeletedFalse(request.getWorkerCode())
                .orElseGet(FactoryWorker::new);
        worker.setWorkerCode(request.getWorkerCode());
        worker.setWorkerName(request.getWorkerName());
        worker.setWorkerType(request.getWorkerType());
        worker.setHost(request.getHost());
        worker.setIp(request.getIp());
        worker.setPort(request.getPort());
        worker.setStatus(request.getStatus());
        worker.setMaxConcurrency(request.getMaxConcurrency());
        worker.setCurrentLoad(request.getCurrentLoad());
        worker.setTagsJson(writeTags(request.getTags()));
        worker.setVersion(request.getVersion());
        worker.setRemark(request.getRemark());
        worker.setLastHeartbeat(LocalDateTime.now());
        factoryWorkerRepository.save(worker);
        return new WorkerHeartbeatResponse(worker.getWorkerCode(), worker.getStatus(), worker.getCurrentLoad());
    }

    @Transactional
    public WorkerTaskResponse pull(WorkerPullRequest request) {
        FactoryTaskStep step = taskService.assignNextCodingStep(request.getWorkerCode());
        if (step == null) {
            return WorkerTaskResponse.empty();
        }

        FactoryTask task = factoryTaskRepository.findById(step.getTaskId())
                .orElseThrow(() -> new IllegalStateException("task not found: " + step.getTaskId()));
        Map<String, Object> intent = taskService.parseTaskExtJson(task);

        return WorkerTaskResponse.builder()
                .assigned(true)
                .taskId(task.getId())
                .stepId(step.getId())
                .taskNo(task.getTaskNo())
                .repo(WorkerTaskResponse.RepoInfo.builder()
                        .fullName(task.getRepoFullName())
                        .owner(task.getRepoOwner())
                        .name(task.getRepoName())
                        .build())
                .issue(WorkerTaskResponse.IssueInfo.builder()
                        .number(task.getIssueNumber())
                        .title(task.getIssueTitle())
                        .body(task.getIssueBody())
                        .build())
                .branch(WorkerTaskResponse.BranchInfo.builder()
                        .base(task.getBaseBranch())
                        .work(task.getWorkBranch())
                        .build())
                .intent(WorkerTaskResponse.IntentInfo.builder()
                        .taskType((String) intent.get("taskType"))
                        .riskLevel((String) intent.get("riskLevel"))
                        .summary((String) intent.get("summary"))
                        .acceptanceCriteria(readAcceptanceCriteria(intent.get("acceptanceCriteria")))
                        .build())
                .step(WorkerTaskResponse.StepInfo.builder()
                        .name(step.getStepName())
                        .type(step.getStepType())
                        .status(step.getStepStatus())
                        .build())
                .build();
    }

    @Transactional
    public WorkerReportResponse report(WorkerReportRequest request) {
        FactoryTaskStep step = taskService.completeCodingStep(request);
        FactoryTask task = factoryTaskRepository.findById(step.getTaskId())
                .orElseThrow(() -> new IllegalStateException("task not found: " + step.getTaskId()));
        return new WorkerReportResponse(task.getId(), step.getId(), task.getCurrentStatus(), step.getStepStatus());
    }

    private String writeTags(List<String> tags) {
        try {
            return objectMapper.writeValueAsString(tags == null ? Collections.emptyList() : tags);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("write tags json failed", e);
        }
    }

    private List<String> readAcceptanceCriteria(Object value) {
        if (value == null) {
            return Collections.emptyList();
        }
        return objectMapper.convertValue(value, new TypeReference<>() {});
    }
}
