package com.company.aifactory.controller;

import com.company.aifactory.dto.ApiResponse;
import com.company.aifactory.dto.TaskDetailResponse;
import com.company.aifactory.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/factory/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> detail(@PathVariable Long taskId) {
        return taskService.findTask(taskId)
                .map(task -> ResponseEntity.ok(ApiResponse.ok(new TaskDetailResponse(task, taskService.findTaskSteps(taskId)))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
