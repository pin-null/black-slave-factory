package com.company.aifactory.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "github.webhook")
public class GitHubWebhookProperties {

    /**
     * GitHub webhook secret，留空表示跳过验签（仅限本地联调）
     */
    private String secret;

    /**
     * 是否强制验签
     */
    private boolean verifySignature = false;
}
