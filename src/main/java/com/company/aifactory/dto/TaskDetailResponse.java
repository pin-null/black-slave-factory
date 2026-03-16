package com.company.aifactory.dto;

import com.company.aifactory.domain.entity.FactoryTask;
import com.company.aifactory.domain.entity.FactoryTaskStep;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TaskDetailResponse {
    private FactoryTask task;
    private List<FactoryTaskStep> steps;
}
