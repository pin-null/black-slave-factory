package com.company.aifactory.repository;

import com.company.aifactory.domain.entity.FactoryTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FactoryTaskRepository extends JpaRepository<FactoryTask, Long> {

    Optional<FactoryTask> findByRepoFullNameAndIssueNumberAndDeletedFalse(String repoFullName, Integer issueNumber);
}
