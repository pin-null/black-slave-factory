package com.company.aifactory.repository;

import com.company.aifactory.domain.entity.GithubWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GithubWebhookEventRepository extends JpaRepository<GithubWebhookEvent, Long> {

    Optional<GithubWebhookEvent> findByDeliveryId(String deliveryId);
}
