package com.company.aifactory.service;

import com.company.aifactory.domain.entity.FactoryTask;
import com.company.aifactory.domain.entity.GithubWebhookEvent;
import com.company.aifactory.domain.enums.WebhookProcessStatus;
import com.company.aifactory.dto.WebhookProcessResult;
import com.company.aifactory.repository.GithubWebhookEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GitHubWebhookService {

    private final GithubWebhookEventRepository githubWebhookEventRepository;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    @Transactional
    public WebhookProcessResult handle(String deliveryId, String eventType, String rawPayload) {
        GithubWebhookEvent existing = githubWebhookEventRepository.findByDeliveryId(deliveryId).orElse(null);
        if (existing != null) {
            return new WebhookProcessResult(deliveryId, "DUPLICATE", null);
        }

        GithubWebhookEvent event = new GithubWebhookEvent();
        event.setDeliveryId(deliveryId);
        event.setEventType(eventType);
        event.setStatus(WebhookProcessStatus.RECEIVED.name());
        event.setRawPayload(rawPayload);
        githubWebhookEventRepository.save(event);

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String action = text(root, "action");
            event.setAction(action);
            event.setRepositoryFullName(text(root.path("repository"), "full_name"));

            if ("issues".equals(eventType) && "opened".equals(action)) {
                return handleIssueOpened(root, event);
            }
            if ("issue_comment".equals(eventType) && "created".equals(action)) {
                return handleIssueCommentCreated(root, event);
            }

            event.setStatus(WebhookProcessStatus.IGNORED.name());
            githubWebhookEventRepository.save(event);
            return new WebhookProcessResult(deliveryId, "IGNORED", null);
        } catch (Exception e) {
            event.setStatus(WebhookProcessStatus.FAILED.name());
            event.setErrorMessage(e.getMessage());
            githubWebhookEventRepository.save(event);
            throw new IllegalStateException("process webhook failed", e);
        }
    }

    private WebhookProcessResult handleIssueOpened(JsonNode root, GithubWebhookEvent event) {
        String triggerType = hasRunLabel(root.path("issue").path("labels")) ? "label" : "auto";
        String triggerContent = hasRunLabel(root.path("issue").path("labels")) ? "ai:run" : "issues.opened";

        FactoryTask task = taskService.createOrLoadTask(
                text(root.path("repository"), "full_name"),
                text(root.path("repository"), "owner", "login"),
                text(root.path("repository"), "name"),
                root.path("issue").path("number").asInt(),
                text(root.path("issue"), "title"),
                text(root.path("issue"), "body"),
                "issues.opened",
                triggerType,
                triggerContent
        );
        taskService.runInitialIntentAnalyze(task.getId());

        event.setIssueNumber(task.getIssueNumber());
        event.setStatus(WebhookProcessStatus.PROCESSED.name());
        githubWebhookEventRepository.save(event);
        return new WebhookProcessResult(event.getDeliveryId(), "TASK_CREATED", task.getId());
    }

    private WebhookProcessResult handleIssueCommentCreated(JsonNode root, GithubWebhookEvent event) {
        String commentBody = text(root.path("comment"), "body");
        if (commentBody == null || !commentBody.trim().equalsIgnoreCase("/run-ai")) {
            event.setIssueNumber(root.path("issue").path("number").asInt());
            event.setStatus(WebhookProcessStatus.IGNORED.name());
            githubWebhookEventRepository.save(event);
            return new WebhookProcessResult(event.getDeliveryId(), "IGNORED_COMMENT", null);
        }

        FactoryTask task = taskService.createOrLoadTask(
                text(root.path("repository"), "full_name"),
                text(root.path("repository"), "owner", "login"),
                text(root.path("repository"), "name"),
                root.path("issue").path("number").asInt(),
                text(root.path("issue"), "title"),
                text(root.path("issue"), "body"),
                "issue_comment.created",
                "comment",
                "/run-ai"
        );
        taskService.runInitialIntentAnalyze(task.getId());

        event.setIssueNumber(task.getIssueNumber());
        event.setStatus(WebhookProcessStatus.PROCESSED.name());
        githubWebhookEventRepository.save(event);
        return new WebhookProcessResult(event.getDeliveryId(), "TASK_CREATED", task.getId());
    }

    private boolean hasRunLabel(JsonNode labels) {
        if (labels == null || !labels.isArray()) {
            return false;
        }
        for (JsonNode label : labels) {
            String name = text(label, "name");
            if ("ai:run".equalsIgnoreCase(name)) {
                return true;
            }
        }
        return false;
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }

    private String text(JsonNode node, String field1, String field2) {
        JsonNode child = node.get(field1);
        if (child == null || child.isNull()) {
            return null;
        }
        JsonNode v = child.get(field2);
        return v == null || v.isNull() ? null : v.asText();
    }
}
