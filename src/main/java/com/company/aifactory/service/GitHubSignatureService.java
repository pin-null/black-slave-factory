package com.company.aifactory.service;

import com.company.aifactory.config.GitHubWebhookProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class GitHubSignatureService {

    private final GitHubWebhookProperties properties;

    public void verify(String signature256, String payload) {
        if (!properties.isVerifySignature()) {
            return;
        }
        if (properties.getSecret() == null || properties.getSecret().isBlank()) {
            throw new IllegalArgumentException("github webhook secret is empty, but verifySignature=true");
        }
        if (signature256 == null || signature256.isBlank()) {
            throw new IllegalArgumentException("missing X-Hub-Signature-256 header");
        }

        String expected = "sha256=" + hmacSha256Hex(properties.getSecret(), payload);
        if (!expected.equalsIgnoreCase(signature256.trim())) {
            throw new IllegalArgumentException("invalid github webhook signature");
        }
    }

    private String hmacSha256Hex(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("sign payload failed", e);
        }
    }
}
