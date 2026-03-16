package com.company.aifactory.repository;

import com.company.aifactory.domain.entity.FactoryTaskStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FactoryTaskStepRepository extends JpaRepository<FactoryTaskStep, Long> {

    List<FactoryTaskStep> findByTaskIdOrderBySeqNoAsc(Long taskId);

    Optional<FactoryTaskStep> findFirstByStepStatusOrderByTaskIdAscSeqNoAsc(String stepStatus);
}
