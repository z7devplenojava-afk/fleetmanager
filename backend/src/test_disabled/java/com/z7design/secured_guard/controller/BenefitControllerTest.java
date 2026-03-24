package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Benefit;
import com.z7design.secured_guard.service.BenefitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BenefitController.class)
public class BenefitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BenefitService benefitService;

    @Autowired
    private ObjectMapper objectMapper;

    private Benefit benefit;
    private UUID benefitId;

    @BeforeEach
    void setUp() {
        benefitId = UUID.randomUUID();
        benefit = new Benefit();
        benefit.setId(benefitId);
        benefit.setName("Test Benefit");
        benefit.setDescription("Description for test benefit");
        benefit.setValue(new BigDecimal("100.0"));
        benefit.setStartDate(LocalDate.now());
    }

    @Test
    @DisplayName("Should create a new benefit successfully")
    void shouldCreateBenefitSuccessfully() throws Exception {
        when(benefitService.create(any(Benefit.class))).thenReturn(benefit);

        mockMvc.perform(post("/api/benefits")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(benefit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(benefit.getId().toString()))
                .andExpect(jsonPath("$.name").value(benefit.getName()));

        verify(benefitService, times(1)).create(any(Benefit.class));
    }

    @Test
    @DisplayName("Should return 400 when creating benefit with invalid data")
    void shouldReturnBadRequestWhenCreatingBenefitWithInvalidData() throws Exception {
        Benefit invalidBenefit = new Benefit(); // Missing required fields

        mockMvc.perform(post("/api/benefits")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidBenefit)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());

        verify(benefitService, never()).create(any(Benefit.class));
    }

    @Test
    @DisplayName("Should update an existing benefit successfully")
    void shouldUpdateBenefitSuccessfully() throws Exception {
        Benefit updatedBenefit = new Benefit();
        updatedBenefit.setId(benefitId);
        updatedBenefit.setName("Updated Benefit Name");
        updatedBenefit.setDescription("Updated description");
        updatedBenefit.setValue(new BigDecimal("200.0"));
        updatedBenefit.setStartDate(LocalDate.now());

        when(benefitService.update(eq(benefitId), any(Benefit.class))).thenReturn(updatedBenefit);

        mockMvc.perform(put("/api/benefits/{id}", benefitId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedBenefit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedBenefit.getId().toString()))
                .andExpect(jsonPath("$.name").value(updatedBenefit.getName()));

        verify(benefitService, times(1)).update(eq(benefitId), any(Benefit.class));
    }

    @Test
    @DisplayName("Should return 404 when updating a non-existent benefit")
    void shouldReturnNotFoundWhenUpdatingNonExistentBenefit() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(benefitService.update(eq(nonExistentId), any(Benefit.class)))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Benefit not found"));

        mockMvc.perform(put("/api/benefits/{id}", nonExistentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(benefit)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Benefit not found"));

        verify(benefitService, times(1)).update(eq(nonExistentId), any(Benefit.class));
    }

    @Test
    @DisplayName("Should delete a benefit successfully")
    void shouldDeleteBenefitSuccessfully() throws Exception {
        doNothing().when(benefitService).delete(benefitId);

        mockMvc.perform(delete("/api/benefits/{id}", benefitId))
                .andExpect(status().isNoContent());

        verify(benefitService, times(1)).delete(benefitId);
    }

    @Test
    @DisplayName("Should return 404 when deleting a non-existent benefit")
    void shouldReturnNotFoundWhenDeletingNonExistentBenefit() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Benefit not found"))
                .when(benefitService).delete(nonExistentId);

        mockMvc.perform(delete("/api/benefits/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Benefit not found"));

        verify(benefitService, times(1)).delete(nonExistentId);
    }

    @Test
    @DisplayName("Should find benefit by ID successfully")
    void shouldFindBenefitByIdSuccessfully() throws Exception {
        when(benefitService.findById(benefitId)).thenReturn(benefit);

        mockMvc.perform(get("/api/benefits/{id}", benefitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(benefitId.toString()))
                .andExpect(jsonPath("$.name").value(benefit.getName()));

        verify(benefitService, times(1)).findById(benefitId);
    }

    @Test
    @DisplayName("Should return 404 when finding non-existent benefit by ID")
    void shouldReturnNotFoundWhenFindingNonExistentBenefitById() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(benefitService.findById(nonExistentId))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Benefit not found"));

        mockMvc.perform(get("/api/benefits/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Benefit not found"));

        verify(benefitService, times(1)).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should find benefits by employee ID successfully")
    void shouldFindBenefitsByEmployeeIdSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        when(benefitService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(benefit));

        mockMvc.perform(get("/api/benefits/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(benefitId.toString()));

        verify(benefitService, times(1)).findByEmployeeId(employeeId);
    }

    @Test
    @DisplayName("Should find benefits by position ID successfully")
    void shouldFindBenefitsByPositionIdSuccessfully() throws Exception {
        UUID positionId = UUID.randomUUID();
        when(benefitService.findByPositionId(positionId)).thenReturn(Collections.singletonList(benefit));

        mockMvc.perform(get("/api/benefits/position/{positionId}", positionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(benefitId.toString()));

        verify(benefitService, times(1)).findByPositionId(positionId);
    }

    @Test
    @DisplayName("Should find active benefits successfully")
    void shouldFindActiveBenefitsSuccessfully() throws Exception {
        when(benefitService.findActiveBenefits()).thenReturn(Collections.singletonList(benefit));

        mockMvc.perform(get("/api/benefits/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(benefitId.toString()));

        verify(benefitService, times(1)).findActiveBenefits();
    }

    @Test
    @DisplayName("Should find all benefits successfully")
    void shouldFindAllBenefitsSuccessfully() throws Exception {
        when(benefitService.findAll()).thenReturn(Collections.singletonList(benefit));

        mockMvc.perform(get("/api/benefits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(benefitId.toString()));

        verify(benefitService, times(1)).findAll();
    }
} 