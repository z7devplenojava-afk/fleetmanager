package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.EvaluationStatus;
import com.z7design.secured_guard.model.enums.EvaluationType;

class PerformanceEvaluationTest {

    private PerformanceEvaluation evaluation;
    private Employee employee;
    private User evaluator;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        evaluator = new User();
        evaluator.setId(UUID.randomUUID());
        evaluator.setUsername("evaluator");

        evaluation = new PerformanceEvaluation();
        evaluation.setId(UUID.randomUUID());
        evaluation.setEmployee(employee);
        evaluation.setEvaluator(evaluator);
        evaluation.setEvaluationDate(LocalDate.now());
        evaluation.setEvaluationType(EvaluationType.ANNUAL);
        evaluation.setStatus(EvaluationStatus.PENDING);
        evaluation.setScore(4);
        evaluation.setComments("Test comments");
    }

    @Test
    void whenCreateEvaluation_thenEvaluationIsCreated() {
        assertNotNull(evaluation);
        assertEquals(employee, evaluation.getEmployee());
        assertEquals(evaluator, evaluation.getEvaluator());
        assertEquals(LocalDate.now(), evaluation.getEvaluationDate());
        assertEquals(EvaluationType.ANNUAL, evaluation.getEvaluationType());
        assertEquals(EvaluationStatus.PENDING, evaluation.getStatus());
        assertEquals(4, evaluation.getScore());
        assertEquals("Test comments", evaluation.getComments());
    }

    @Test
    void whenUpdateStatus_thenStatusIsUpdated() {
        evaluation.setStatus(EvaluationStatus.COMPLETED);
        assertEquals(EvaluationStatus.COMPLETED, evaluation.getStatus());
    }

    @Test
    void whenUpdateScore_thenScoreIsUpdated() {
        evaluation.setScore(5);
        assertEquals(5, evaluation.getScore());
    }

    @Test
    void whenUpdateComments_thenCommentsAreUpdated() {
        String newComments = "Updated comments";
        evaluation.setComments(newComments);
        assertEquals(newComments, evaluation.getComments());
    }
} 