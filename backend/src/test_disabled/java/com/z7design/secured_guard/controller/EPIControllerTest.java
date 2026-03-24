package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.EPI;
import com.z7design.secured_guard.model.EPIStatus;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Position;
import com.z7design.secured_guard.service.EPIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EPIController.class)
public class EPIControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EPIService epiService;

    @Autowired
    private ObjectMapper objectMapper;

    private EPI epi;
    private UUID epiId;
    private Employee employee;
    private Position position;

    @BeforeEach
    void setUp() {
        epiId = UUID.randomUUID();
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        position = new Position();
        position.setId(UUID.randomUUID());

        epi = new EPI();
        epi.setId(epiId);
        epi.setName("Test EPI");
        epi.setDescription("Description for test EPI");
        epi.setIssueDate(LocalDateTime.now().minusYears(1));
        epi.setExpirationDate(LocalDateTime.now().plusYears(4));
        epi.setStatus(EPIStatus.ISSUED);
        epi.setEmployee(employee);
        epi.setPosition(position);
    }

    @Test
    @DisplayName("Should create a new EPI successfully")
    void shouldCreateEPISuccessfully() throws Exception {
        when(epiService.create(any(EPI.class))).thenReturn(epi);

        mockMvc.perform(post("/api/epis")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(epi)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(epi.getId().toString()))
                .andExpect(jsonPath("$.name").value(epi.getName()));

        verify(epiService, times(1)).create(any(EPI.class));
    }

    @Test
    @DisplayName("Should return 400 when creating EPI with invalid data")
    void shouldReturnBadRequestWhenCreatingEPIWithInvalidData() throws Exception {
        EPI invalidEPI = new EPI(); // Missing required fields

        mockMvc.perform(post("/api/epis")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidEPI)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());

        verify(epiService, never()).create(any(EPI.class));
    }

    @Test
    @DisplayName("Should update an existing EPI successfully")
    void shouldUpdateEPISuccessfully() throws Exception {
        EPI updatedEPI = new EPI();
        updatedEPI.setId(epiId);
        updatedEPI.setName("Updated EPI Name");
        updatedEPI.setDescription("Updated description");
        updatedEPI.setIssueDate(LocalDateTime.now().minusYears(2));
        updatedEPI.setExpirationDate(LocalDateTime.now().plusYears(3));
        updatedEPI.setStatus(EPIStatus.EXPIRED);

        when(epiService.update(eq(epiId), any(EPI.class))).thenReturn(updatedEPI);

        mockMvc.perform(put("/api/epis/{id}", epiId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedEPI)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedEPI.getId().toString()))
                .andExpect(jsonPath("$.name").value(updatedEPI.getName()));

        verify(epiService, times(1)).update(eq(epiId), any(EPI.class));
    }

    @Test
    @DisplayName("Should return 404 when updating a non-existent EPI")
    void shouldReturnNotFoundWhenUpdatingNonExistentEPI() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(epiService.update(eq(nonExistentId), any(EPI.class)))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("EPI not found"));

        mockMvc.perform(put("/api/epis/{id}", nonExistentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(epi)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("EPI not found"));

        verify(epiService, times(1)).update(eq(nonExistentId), any(EPI.class));
    }

    @Test
    @DisplayName("Should delete an EPI successfully")
    void shouldDeleteEPISuccessfully() throws Exception {
        doNothing().when(epiService).delete(epiId);

        mockMvc.perform(delete("/api/epis/{id}", epiId))
                .andExpect(status().isNoContent());

        verify(epiService, times(1)).delete(epiId);
    }

    @Test
    @DisplayName("Should return 404 when deleting a non-existent EPI")
    void shouldReturnNotFoundWhenDeletingNonExistentEPI() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("EPI not found"))
                .when(epiService).delete(nonExistentId);

        mockMvc.perform(delete("/api/epis/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("EPI not found"));

        verify(epiService, times(1)).delete(nonExistentId);
    }

    @Test
    @DisplayName("Should find EPI by ID successfully")
    void shouldFindEPIByIdSuccessfully() throws Exception {
        when(epiService.findById(epiId)).thenReturn(epi);

        mockMvc.perform(get("/api/epis/{id}", epiId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(epiId.toString()))
                .andExpect(jsonPath("$.name").value(epi.getName()));

        verify(epiService, times(1)).findById(epiId);
    }

    @Test
    @DisplayName("Should return 404 when finding non-existent EPI by ID")
    void shouldReturnNotFoundWhenFindingNonExistentEPIById() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(epiService.findById(nonExistentId))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("EPI not found"));

        mockMvc.perform(get("/api/epis/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("EPI not found"));

        verify(epiService, times(1)).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should find EPIs by employee ID successfully")
    void shouldFindEPIsByEmployeeIdSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        when(epiService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(epi));

        mockMvc.perform(get("/api/epis/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(epiId.toString()));

        verify(epiService, times(1)).findByEmployeeId(employeeId);
    }

    @Test
    @DisplayName("Should find EPIs by position ID successfully")
    void shouldFindEPIsByPositionIdSuccessfully() throws Exception {
        UUID positionId = UUID.randomUUID();
        when(epiService.findByPositionId(positionId)).thenReturn(Collections.singletonList(epi));

        mockMvc.perform(get("/api/epis/position/{positionId}", positionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(epiId.toString()));

        verify(epiService, times(1)).findByPositionId(positionId);
    }

    @Test
    @DisplayName("Should find EPIs by status successfully")
    void shouldFindEPIsByStatusSuccessfully() throws Exception {
        EPIStatus status = EPIStatus.ISSUED;
        when(epiService.findByStatus(status)).thenReturn(Collections.singletonList(epi));

        mockMvc.perform(get("/api/epis/status/{status}", status.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(status.name()));

        verify(epiService, times(1)).findByStatus(status);
    }

    @Test
    @DisplayName("Should find expiring EPIs successfully")
    void shouldFindExpiringEPIsSuccessfully() throws Exception {
        when(epiService.findExpiringEPIs()).thenReturn(Collections.singletonList(epi));

        mockMvc.perform(get("/api/epis/expiring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(epiId.toString()));

        verify(epiService, times(1)).findExpiringEPIs();
    }

    @Test
    @DisplayName("Should find all EPIs successfully")
    void shouldFindAllEPIsSuccessfully() throws Exception {
        when(epiService.findAll()).thenReturn(Collections.singletonList(epi));

        mockMvc.perform(get("/api/epis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(epiId.toString()));

        verify(epiService, times(1)).findAll();
    }
} 