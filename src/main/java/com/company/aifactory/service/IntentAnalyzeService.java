package com.company.aifactory.service;

import com.company.aifactory.domain.entity.FactoryTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IntentAnalyzeService {

    public Map<String, Object> analyze(FactoryTask task) {
        String title = task.getIssueTitle() == null ? "" : task.getIssueTitle().toLowerCase();
        String body = task.getIssueBody() == null ? "" : task.getIssueBody().toLowerCase();

        String taskType = inferTaskType(title, body);
        String riskLevel = inferRiskLevel(title, body);
        boolean needUnitTest = true;
        boolean needCodeChange = true;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("taskType", taskType);
        result.put("riskLevel", riskLevel);
        result.put("needCodeChange", needCodeChange);
        result.put("needUnitTest", needUnitTest);
        result.put("summary", task.getIssueTitle());
        result.put("acceptanceCriteria", new String[]{
                "问题被定位并修复",
                "补充最小验证步骤",
                "输出后续 coding 所需信息"
        });
        return result;
    }

    private String inferTaskType(String title, String body) {
        String text = title + " " + body;
        if (text.contains("bug") || text.contains("异常") || text.contains("报错") || text.contains("修复") || text.contains("空指针")) {
            return "bugfix";
        }
        if (text.contains("重构") || text.contains("refactor")) {
            return "refactor";
        }
        if (text.contains("测试") || text.contains("test")) {
            return "test";
        }
        return "feature";
    }

    private String inferRiskLevel(String title, String body) {
        String text = title + " " + body;
        if (text.contains("支付") || text.contains("订单") || text.contains("登录") || text.contains("权限")) {
            return "high";
        }
        if (text.contains("接口") || text.contains("用户") || text.contains("服务")) {
            return "medium";
        }
        return "low";
    }
}
