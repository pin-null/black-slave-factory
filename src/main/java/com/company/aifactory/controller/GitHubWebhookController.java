package com.company.aifactory.controller;

import com.company.aifactory.dto.ApiResponse;
import com.company.aifactory.dto.WebhookProcessResult;
import com.company.aifactory.service.GitHubSignatureService;
import com.company.aifactory.service.GitHubWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/factory/github")
@RequiredArgsConstructor
public class GitHubWebhookController {

    private final GitHubWebhookService gitHubWebhookService;
    private final GitHubSignatureService gitHubSignatureService;

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<WebhookProcessResult>> webhook(
            @RequestHeader("X-GitHub-Delivery") String deliveryId,
            @RequestHeader("X-GitHub-Event") String eventType,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature256,
            @RequestBody String payload) {
        gitHubSignatureService.verify(signature256, payload);
        WebhookProcessResult result = gitHubWebhookService.handle(deliveryId, eventType, payload);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
