package com.company.aifactory.repository;

import com.company.aifactory.domain.entity.FactoryWorker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FactoryWorkerRepository extends JpaRepository<FactoryWorker, Long> {

    Optional<FactoryWorker> findByWorkerCodeAndDeletedFalse(String workerCode);
}
