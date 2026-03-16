package com.company.aifactory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WebhookProcessResult {
    private String deliveryId;
    private String result;
    private Long taskId;
}
