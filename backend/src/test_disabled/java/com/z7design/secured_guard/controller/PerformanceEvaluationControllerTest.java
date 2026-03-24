package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.PerformanceEvaluation;
import com.z7design.secured_guard.model.enums.EvaluationStatus;
import com.z7design.secured_guard.service.PerformanceEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PerformanceEvaluationController.class)
public class PerformanceEvaluationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PerformanceEvaluationService performanceEvaluationService;

    @Autowired
    private ObjectMapper objectMapper;

    private PerformanceEvaluation performanceEvaluation;
    private UUID evaluationId;
    private UUID employeeId;
    private UUID evaluatorId;
    private Employee employee;
    private Employee evaluator;

    @BeforeEach
    void setUp() {
        evaluationId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        evaluatorId = UUID.randomUUID();

        employee = new Employee();
        employee.setId(employeeId);

        evaluator = new Employee();
        evaluator.setId(evaluatorId);

        performanceEvaluation = new PerformanceEvaluation();
        performanceEvaluation.setId(evaluationId);
        performanceEvaluation.setEmployee(employee);
        performanceEvaluation.setEvaluator(evaluator);
        performanceEvaluation.setEvaluationDate(LocalDate.of(2024, 6, 30));
        performanceEvaluation.setScore(0.0);
        performanceEvaluation.setFeedback("Initial feedback.");
        performanceEvaluation.setStatus(EvaluationStatus.PENDING);
    }

    @Test
    @DisplayName("Should create a new performance evaluation")
    void shouldCreatePerformanceEvaluation() throws Exception {
        when(performanceEvaluationService.create(any(PerformanceEvaluation.class))).thenReturn(performanceEvaluation);

        mockMvc.perform(post("/api/performance-evaluations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(performanceEvaluation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(evaluationId.toString()))
                .andExpect(jsonPath("$.employee.id").value(employeeId.toString()))
                .andExpect(jsonPath("$.evaluator.id").value(evaluatorId.toString()));
    }

    @Test
    @DisplayName("Should update an existing performance evaluation")
    void shouldUpdatePerformanceEvaluation() throws Exception {
        PerformanceEvaluation updatedEvaluation = new PerformanceEvaluation();
        updatedEvaluation.setId(evaluationId);
        updatedEvaluation.setEmployee(employee);
        updatedEvaluation.setEvaluator(evaluator);
        updatedEvaluation.setEvaluationDate(LocalDate.of(2024, 6, 30));
        updatedEvaluation.setScore(8.5);
        updatedEvaluation.setFeedback("Updated feedback with improvements.");
        updatedEvaluation.setStatus(EvaluationStatus.COMPLETED);

        when(performanceEvaluationService.update(eq(evaluationId), any(PerformanceEvaluation.class))).thenReturn(updatedEvaluation);

        mockMvc.perform(put("/api/performance-evaluations/{id}", evaluationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedEvaluation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.feedback").value("Updated feedback with improvements."));
    }

    @Test
    @DisplayName("Should start a performance evaluation")
    void shouldStartEvaluation() throws Exception {
        PerformanceEvaluation startedEvaluation = new PerformanceEvaluation();
        startedEvaluation.setId(evaluationId);
        startedEvaluation.setEmployee(employee);
        startedEvaluation.setEvaluator(evaluator);
        startedEvaluation.setEvaluationDate(LocalDate.of(2024, 6, 30));
        startedEvaluation.setScore(0.0);
        startedEvaluation.setFeedback("Initial feedback.");
        startedEvaluation.setStatus(EvaluationStatus.IN_PROGRESS);

        when(performanceEvaluationService.startEvaluation(evaluationId)).thenReturn(startedEvaluation);

        mockMvc.perform(post("/api/performance-evaluations/{id}/start", evaluationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(EvaluationStatus.IN_PROGRESS.name()));
    }

    @Test
    @DisplayName("Should complete a performance evaluation")
    void shouldCompleteEvaluation() throws Exception {
        PerformanceEvaluation completedEvaluation = new PerformanceEvaluation();
        completedEvaluation.setId(evaluationId);
        completedEvaluation.setEmployee(employee);
        completedEvaluation.setEvaluator(evaluator);
        completedEvaluation.setEvaluationDate(LocalDate.of(2024, 6, 30));
        completedEvaluation.setScore(8.5);
        completedEvaluation.setFeedback("Updated feedback with improvements.");
        completedEvaluation.setStatus(EvaluationStatus.COMPLETED);

        when(performanceEvaluationService.completeEvaluation(evaluationId)).thenReturn(completedEvaluation);

        mockMvc.perform(post("/api/performance-evaluations/{id}/complete", evaluationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(EvaluationStatus.COMPLETED.name()));
    }

    @Test
    @DisplayName("Should review a performance evaluation")
    void shouldReviewEvaluation() throws Exception {
        PerformanceEvaluation reviewedEvaluation = new PerformanceEvaluation();
        reviewedEvaluation.setId(evaluationId);
        reviewedEvaluation.setEmployee(employee);
        reviewedEvaluation.setEvaluator(evaluator);
        reviewedEvaluation.setEvaluationDate(LocalDate.of(2024, 6, 30));
        reviewedEvaluation.setScore(8.5);
        reviewedEvaluation.setFeedback("Updated feedback with improvements.");
        reviewedEvaluation.setStatus(EvaluationStatus.UNDER_REVIEW);

        when(performanceEvaluationService.reviewEvaluation(evaluationId)).thenReturn(reviewedEvaluation);

        mockMvc.perform(post("/api/performance-evaluations/{id}/review", evaluationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(EvaluationStatus.UNDER_REVIEW.name()));
    }

    @Test
    @DisplayName("Should approve a performance evaluation")
    void shouldApproveEvaluation() throws Exception {
        PerformanceEvaluation approvedEvaluation = new PerformanceEvaluation();
        approvedEvaluation.setId(evaluationId);
        approvedEvaluation.setEmployee(employee);
        approvedEvaluation.setEvaluator(evaluator);
        approvedEvaluation.setEvaluationDate(LocalDate.of(2024, 6, 30));
        approvedEvaluation.setScore(8.5);
        approvedEvaluation.setFeedback("Updated feedback with improvements.");
        approvedEvaluation.setStatus(EvaluationStatus.APPROVED);

        when(performanceEvaluationService.approveEvaluation(evaluationId)).thenReturn(approvedEvaluation);

        mockMvc.perform(post("/api/performance-evaluations/{id}/approve", evaluationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(EvaluationStatus.APPROVED.name()));
    }

    @Test
    @DisplayName("Should find performance evaluation by ID")
    void shouldFindPerformanceEvaluationById() throws Exception {
        when(performanceEvaluationService.findById(evaluationId)).thenReturn(performanceEvaluation);

        mockMvc.perform(get("/api/performance-evaluations/{id}", evaluationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(evaluationId.toString()));
    }

    @Test
    @DisplayName("Should find performance evaluations by employee ID")
    void shouldFindPerformanceEvaluationsByEmployeeId() throws Exception {
        when(performanceEvaluationService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(performanceEvaluation));

        mockMvc.perform(get("/api/performance-evaluations/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employee.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find performance evaluations by evaluator ID")
    void shouldFindPerformanceEvaluationsByEvaluatorId() throws Exception {
        when(performanceEvaluationService.findByEvaluatorId(evaluatorId)).thenReturn(Collections.singletonList(performanceEvaluation));

        mockMvc.perform(get("/api/performance-evaluations/evaluator/{evaluatorId}", evaluatorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].evaluator.id").value(evaluatorId.toString()));
    }

    @Test
    @DisplayName("Should find performance evaluations by employee ID and status")
    void shouldFindPerformanceEvaluationsByEmployeeIdAndStatus() throws Exception {
        when(performanceEvaluationService.findByEmployeeIdAndStatus(employeeId, EvaluationStatus.PENDING)).thenReturn(Collections.singletonList(performanceEvaluation));

        mockMvc.perform(get("/api/performance-evaluations/employee/{employeeId}/status/{status}", employeeId, "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(EvaluationStatus.PENDING.name()));
    }

    @Test
    @DisplayName("Should find performance evaluations by evaluation date between")
    void shouldFindPerformanceEvaluationsByEvaluationDateBetween() throws Exception {
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 30);
        when(performanceEvaluationService.findByEvaluationDateBetween(startDate, endDate)).thenReturn(Collections.singletonList(performanceEvaluation));

        mockMvc.perform(get("/api/performance-evaluations/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].evaluationDate").value(performanceEvaluation.getEvaluationDate().toString()));
    }
} 