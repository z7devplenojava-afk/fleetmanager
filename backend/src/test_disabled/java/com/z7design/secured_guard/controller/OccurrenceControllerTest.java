package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Occurrence;
import com.z7design.secured_guard.model.OccurrenceType;
import com.z7design.secured_guard.service.OccurrenceService;
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

@WebMvcTest(OccurrenceController.class)
public class OccurrenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OccurrenceService occurrenceService;

    @Autowired
    private ObjectMapper objectMapper;

    private Occurrence occurrence;
    private UUID occurrenceId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        occurrenceId = UUID.randomUUID();
        employee = new Employee();
        employee.setId(UUID.randomUUID());

        occurrence = new Occurrence();
        occurrence.setId(occurrenceId);
        occurrence.setEmployee(employee);
        occurrence.setType(OccurrenceType.ATESTADO);
        occurrence.setDescription("Test Incident");
        occurrence.setOccurrenceDate(LocalDateTime.now());
        occurrence.setStatus("REPORTED");
    }

    @Test
    @DisplayName("Should create a new occurrence successfully")
    void shouldCreateOccurrenceSuccessfully() throws Exception {
        when(occurrenceService.create(any(Occurrence.class))).thenReturn(occurrence);

        mockMvc.perform(post("/api/occurrences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(occurrence)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(occurrence.getId().toString()))
                .andExpect(jsonPath("$.description").value(occurrence.getDescription()));

        verify(occurrenceService, times(1)).create(any(Occurrence.class));
    }

    @Test
    @DisplayName("Should return 400 when creating occurrence with invalid data")
    void shouldReturnBadRequestWhenCreatingOccurrenceWithInvalidData() throws Exception {
        Occurrence invalidOccurrence = new Occurrence(); // Missing required fields

        mockMvc.perform(post("/api/occurrences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidOccurrence)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());

        verify(occurrenceService, never()).create(any(Occurrence.class));
    }

    @Test
    @DisplayName("Should update an existing occurrence successfully")
    void shouldUpdateOccurrenceSuccessfully() throws Exception {
        Occurrence updatedOccurrence = new Occurrence();
        updatedOccurrence.setId(occurrenceId);
        updatedOccurrence.setEmployee(employee);
        updatedOccurrence.setType(OccurrenceType.ADVERTENCIA);
        updatedOccurrence.setDescription("Updated Incident");
        updatedOccurrence.setOccurrenceDate(LocalDateTime.now());
        updatedOccurrence.setStatus("RESOLVED");

        when(occurrenceService.update(eq(occurrenceId), any(Occurrence.class))).thenReturn(updatedOccurrence);

        mockMvc.perform(put("/api/occurrences/{id}", occurrenceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedOccurrence)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedOccurrence.getId().toString()))
                .andExpect(jsonPath("$.description").value(updatedOccurrence.getDescription()));

        verify(occurrenceService, times(1)).update(eq(occurrenceId), any(Occurrence.class));
    }

    @Test
    @DisplayName("Should return 404 when updating a non-existent occurrence")
    void shouldReturnNotFoundWhenUpdatingNonExistentOccurrence() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(occurrenceService.update(eq(nonExistentId), any(Occurrence.class)))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Occurrence not found"));

        mockMvc.perform(put("/api/occurrences/{id}", nonExistentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(occurrence)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Occurrence not found"));

        verify(occurrenceService, times(1)).update(eq(nonExistentId), any(Occurrence.class));
    }

    @Test
    @DisplayName("Should delete an occurrence successfully")
    void shouldDeleteOccurrenceSuccessfully() throws Exception {
        doNothing().when(occurrenceService).delete(occurrenceId);

        mockMvc.perform(delete("/api/occurrences/{id}", occurrenceId))
                .andExpect(status().isOk());

        verify(occurrenceService, times(1)).delete(occurrenceId);
    }

    @Test
    @DisplayName("Should return 404 when deleting a non-existent occurrence")
    void shouldReturnNotFoundWhenDeletingNonExistentOccurrence() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Occurrence not found"))
                .when(occurrenceService).delete(nonExistentId);

        mockMvc.perform(delete("/api/occurrences/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Occurrence not found"));

        verify(occurrenceService, times(1)).delete(nonExistentId);
    }

    @Test
    @DisplayName("Should find occurrence by ID successfully")
    void shouldFindOccurrenceByIdSuccessfully() throws Exception {
        when(occurrenceService.findById(occurrenceId)).thenReturn(occurrence);

        mockMvc.perform(get("/api/occurrences/{id}", occurrenceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(occurrenceId.toString()))
                .andExpect(jsonPath("$.description").value(occurrence.getDescription()));

        verify(occurrenceService, times(1)).findById(occurrenceId);
    }

    @Test
    @DisplayName("Should return 404 when finding non-existent occurrence by ID")
    void shouldReturnNotFoundWhenFindingNonExistentOccurrenceById() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(occurrenceService.findById(nonExistentId))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Occurrence not found"));

        mockMvc.perform(get("/api/occurrences/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Occurrence not found"));

        verify(occurrenceService, times(1)).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should find occurrences by employee ID successfully")
    void shouldFindOccurrencesByEmployeeIdSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        when(occurrenceService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(occurrence));

        mockMvc.perform(get("/api/occurrences/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(occurrenceId.toString()));

        verify(occurrenceService, times(1)).findByEmployeeId(employeeId);
    }

    @Test
    @DisplayName("Should find occurrences by type successfully")
    void shouldFindOccurrencesByTypeSuccessfully() throws Exception {
        OccurrenceType type = OccurrenceType.ATESTADO;
        when(occurrenceService.findByType(type)).thenReturn(Collections.singletonList(occurrence));

        mockMvc.perform(get("/api/occurrences/type/{type}", type.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value(type.name()));

        verify(occurrenceService, times(1)).findByType(type);
    }

    @Test
    @DisplayName("Should find occurrences by status successfully")
    void shouldFindOccurrencesByStatusSuccessfully() throws Exception {
        String status = "REPORTED";
        when(occurrenceService.findByStatus(status)).thenReturn(Collections.singletonList(occurrence));

        mockMvc.perform(get("/api/occurrences/status/{status}", status))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(status));

        verify(occurrenceService, times(1)).findByStatus(status);
    }

    @Test
    @DisplayName("Should find all occurrences successfully")
    void shouldFindAllOccurrencesSuccessfully() throws Exception {
        when(occurrenceService.findAll()).thenReturn(Collections.singletonList(occurrence));

        mockMvc.perform(get("/api/occurrences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(occurrenceId.toString()));

        verify(occurrenceService, times(1)).findAll();
    }
} 