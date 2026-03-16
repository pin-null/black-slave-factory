package com.company.aifactory.service;

import com.company.aifactory.domain.entity.FactoryTask;
import com.company.aifactory.domain.entity.FactoryTaskStep;
import com.company.aifactory.domain.enums.StepStatus;
import com.company.aifactory.domain.enums.TaskStatus;
import com.company.aifactory.dto.WorkerReportRequest;
import com.company.aifactory.repository.FactoryTaskRepository;
import com.company.aifactory.repository.FactoryTaskStepRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final FactoryTaskRepository factoryTaskRepository;
    private final FactoryTaskStepRepository factoryTaskStepRepository;
    private final ObjectMapper objectMapper;
    private final IntentAnalyzeService intentAnalyzeService;

    @Transactional
    public FactoryTask createOrLoadTask(String repoFullName,
                                        String repoOwner,
                                        String repoName,
                                        Integer issueNumber,
                                        String issueTitle,
                                        String issueBody,
                                        String sourceEvent,
                                        String triggerType,
                                        String triggerContent) {
        Optional<FactoryTask> existing = factoryTaskRepository
                .findByRepoFullNameAndIssueNumberAndDeletedFalse(repoFullName, issueNumber);
        if (existing.isPresent()) {
            return existing.get();
        }

        FactoryTask task = new FactoryTask();
        task.setTaskNo(generateTaskNo());
        task.setRepoFullName(repoFullName);
        task.setRepoOwner(repoOwner);
        task.setRepoName(repoName);
        task.setIssueNumber(issueNumber);
        task.setIssueTitle(issueTitle);
        task.setIssueBody(issueBody);
        task.setSourceEvent(sourceEvent);
        task.setTriggerType(triggerType);
        task.setTriggerContent(triggerContent);
        task.setCurrentStatus(TaskStatus.NEW.name());
        task.setTaskType("ISSUE");
        task.setWorkBranch(buildWorkBranch(issueNumber, issueTitle));
        FactoryTask saved = factoryTaskRepository.save(task);

        initTaskSteps(saved);
        return saved;
    }

    public Optional<FactoryTask> findTask(Long taskId) {
        return factoryTaskRepository.findById(taskId);
    }

    public List<FactoryTaskStep> findTaskSteps(Long taskId) {
        return factoryTaskStepRepository.findByTaskIdOrderBySeqNoAsc(taskId);
    }

    @Transactional
    public void runInitialIntentAnalyze(Long taskId) {
        FactoryTask task = factoryTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("task not found: " + taskId));

        List<FactoryTaskStep> steps = factoryTaskStepRepository.findByTaskIdOrderBySeqNoAsc(taskId);
        FactoryTaskStep analyzeStep = steps.stream()
                .filter(step -> "intent_analyze".equals(step.getStepName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("intent_analyze step not found"));

        if (StepStatus.SUCCESS.name().equals(analyzeStep.getStepStatus())) {
            return;
        }

        LocalDateTime start = LocalDateTime.now();
        task.setCurrentStatus(TaskStatus.INTENT_ANALYZING.name());
        factoryTaskRepository.save(task);

        analyzeStep.setStepStatus(StepStatus.RUNNING.name());
        analyzeStep.setStartedAt(start);
        factoryTaskStepRepository.save(analyzeStep);

        Map<String, Object> analyzeResult = intentAnalyzeService.analyze(task);
        LocalDateTime end = LocalDateTime.now();

        analyzeStep.setOutputPayload(buildJson(analyzeResult));
        analyzeStep.setFinishedAt(end);
        analyzeStep.setDurationMs(Duration.between(start, end).toMillis());
        analyzeStep.setStepStatus(StepStatus.SUCCESS.name());
        factoryTaskStepRepository.save(analyzeStep);

        FactoryTaskStep codingStep = steps.stream()
                .filter(step -> "coding".equals(step.getStepName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("coding step not found"));
        if (StepStatus.PENDING.name().equals(codingStep.getStepStatus())) {
            codingStep.setInputPayload(buildCodingInput(task, analyzeResult));
            factoryTaskStepRepository.save(codingStep);
        }

        task.setTaskType(String.valueOf(analyzeResult.get("taskType")));
        task.setRiskLevel(String.valueOf(analyzeResult.get("riskLevel")));
        task.setCurrentStatus(TaskStatus.INTENT_ANALYZED.name());
        task.setExtJson(buildJson(analyzeResult));
        factoryTaskRepository.save(task);
    }

    private void initTaskSteps(FactoryTask task) {
        factoryTaskStepRepository.save(buildStep(task, 1, "webhook_received", "WEBHOOK", StepStatus.SUCCESS, buildJson(Map.of(
                "taskId", task.getId(),
                "issueNumber", task.getIssueNumber(),
                "sourceEvent", task.getSourceEvent()
        ))));

        factoryTaskStepRepository.save(buildStep(task, 2, "intent_analyze", "ANALYZE", StepStatus.PENDING, buildJson(Map.of(
                "repoFullName", task.getRepoFullName(),
                "issueTitle", task.getIssueTitle()
        ))));

        factoryTaskStepRepository.save(buildStep(task, 3, "coding", "CODING", StepStatus.PENDING, buildJson(Map.of(
                "baseBranch", task.getBaseBranch(),
                "workBranch", task.getWorkBranch()
        ))));
    }

    private FactoryTaskStep buildStep(FactoryTask task,
                                      int seq,
                                      String stepName,
                                      String stepType,
                                      StepStatus status,
                                      String inputPayload) {
        FactoryTaskStep step = new FactoryTaskStep();
        step.setTaskId(task.getId());
        step.setStepNo("STEP-" + UUID.randomUUID().toString().replace("-", ""));
        step.setSeqNo(seq);
        step.setStepName(stepName);
        step.setStepType(stepType);
        step.setStepStatus(status.name());
        step.setInputPayload(inputPayload);
        if (status == StepStatus.SUCCESS) {
            step.setStartedAt(LocalDateTime.now());
            step.setFinishedAt(LocalDateTime.now());
            step.setDurationMs(0L);
        }
        return step;
    }

    @Transactional
    public FactoryTaskStep assignNextCodingStep(String workerCode) {
        FactoryTaskStep step = factoryTaskStepRepository.findFirstByStepStatusOrderByTaskIdAscSeqNoAsc(StepStatus.PENDING.name())
                .filter(candidate -> "coding".equals(candidate.getStepName()))
                .orElse(null);
        if (step == null) {
            return null;
        }

        FactoryTask task = factoryTaskRepository.findById(step.getTaskId())
                .orElseThrow(() -> new IllegalStateException("task not found: " + step.getTaskId()));
        if (!TaskStatus.INTENT_ANALYZED.name().equals(task.getCurrentStatus())
                && !TaskStatus.PLANNED.name().equals(task.getCurrentStatus())) {
            return null;
        }

        step.setWorkerCode(workerCode);
        step.setStepStatus(StepStatus.RUNNING.name());
        step.setStartedAt(LocalDateTime.now());
        factoryTaskStepRepository.save(step);

        task.setCurrentStatus(TaskStatus.CODING.name());
        factoryTaskRepository.save(task);
        return step;
    }

    @Transactional
    public FactoryTaskStep completeCodingStep(WorkerReportRequest request) {
        FactoryTaskStep step = factoryTaskStepRepository.findById(request.getStepId())
                .orElseThrow(() -> new IllegalArgumentException("step not found: " + request.getStepId()));
        if (!step.getTaskId().equals(request.getTaskId())) {
            throw new IllegalArgumentException("taskId and stepId not match");
        }
        if (!"coding".equals(step.getStepName())) {
            throw new IllegalArgumentException("only coding step report is supported now");
        }
        if (step.getWorkerCode() != null && !step.getWorkerCode().equals(request.getWorkerCode())) {
            throw new IllegalArgumentException("step is assigned to another worker");
        }

        FactoryTask task = factoryTaskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new IllegalArgumentException("task not found: " + request.getTaskId()));

        LocalDateTime end = LocalDateTime.now();
        step.setWorkerCode(request.getWorkerCode());
        step.setFinishedAt(end);
        if (step.getStartedAt() != null) {
            step.setDurationMs(Duration.between(step.getStartedAt(), end).toMillis());
        }
        step.setOutputPayload(firstNonBlank(request.getOutputPayload(), request.getSummary()));

        if (StepStatus.SUCCESS.name().equalsIgnoreCase(request.getStatus())) {
            step.setStepStatus(StepStatus.SUCCESS.name());
            if (isPrepareOrPlanPhase(request.getOutputPayload())) {
                task.setCurrentStatus(TaskStatus.PLANNED.name());
            } else {
                task.setCurrentStatus(TaskStatus.CODE_SUCCESS.name());
            }
        } else {
            step.setStepStatus(StepStatus.FAILED.name());
            step.setErrorCode(request.getErrorCode());
            step.setErrorMessage(firstNonBlank(request.getErrorMessage(), request.getSummary()));
            task.setCurrentStatus(TaskStatus.CODE_FAILED.name());
            task.setLastErrorCode(request.getErrorCode());
            task.setLastErrorMessage(firstNonBlank(request.getErrorMessage(), request.getSummary()));
        }

        factoryTaskStepRepository.save(step);
        factoryTaskRepository.save(task);
        return step;
    }

    public Map<String, Object> parseTaskExtJson(FactoryTask task) {
        if (task.getExtJson() == null || task.getExtJson().isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(task.getExtJson(), new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("parse ext json failed", e);
        }
    }

    private String generateTaskNo() {
        return "TASK-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String buildWorkBranch(Integer issueNumber, String issueTitle) {
        String safeTitle = issueTitle == null ? "issue" : issueTitle.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (safeTitle.length() > 30) {
            safeTitle = safeTitle.substring(0, 30);
        }
        return "ai/issue-" + issueNumber + "-" + (safeTitle.isBlank() ? "task" : safeTitle);
    }

    private String buildCodingInput(FactoryTask task, Map<String, Object> analyzeResult) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("taskId", task.getId());
        input.put("taskNo", task.getTaskNo());

        Map<String, Object> repo = new LinkedHashMap<>();
        repo.put("fullName", task.getRepoFullName());
        repo.put("owner", task.getRepoOwner());
        repo.put("name", task.getRepoName());
        input.put("repo", repo);

        Map<String, Object> issue = new LinkedHashMap<>();
        issue.put("number", task.getIssueNumber());
        issue.put("title", task.getIssueTitle());
        issue.put("body", task.getIssueBody() == null ? "" : task.getIssueBody());
        input.put("issue", issue);

        Map<String, Object> branch = new LinkedHashMap<>();
        branch.put("base", task.getBaseBranch());
        branch.put("work", task.getWorkBranch());
        input.put("branch", branch);

        input.put("intent", analyzeResult);
        input.put("step", Map.of(
                "name", "coding",
                "type", "CODING"
        ));
        return buildJson(input);
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second;
    }

    private boolean isPrepareOrPlanPhase(String outputPayload) {
        if (outputPayload == null || outputPayload.isBlank()) {
            return false;
        }
        try {
            JsonNode root = objectMapper.readTree(outputPayload);
            JsonNode phase = root.get("phase");
            if (phase == null || phase.isNull()) {
                return false;
            }
            String value = phase.asText();
            return "prepare".equalsIgnoreCase(value) || "plan".equalsIgnoreCase(value);
        } catch (Exception e) {
            return false;
        }
    }

    private String buildJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(new LinkedHashMap<>(map));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("build json failed", e);
        }
    }
}
