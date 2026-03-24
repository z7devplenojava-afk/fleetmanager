package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Position;
import com.z7design.secured_guard.service.PositionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PositionController.class)
public class PositionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PositionService positionService;

    @Autowired
    private ObjectMapper objectMapper;

    private Position position;
    private UUID positionId;

    @BeforeEach
    void setUp() {
        positionId = UUID.randomUUID();
        position = new Position();
        position.setId(positionId);
        position.setName("Vigilante Líder");
        position.setDescription("Lidera equipe de vigilantes");
        position.setBaseSalary(new BigDecimal("3500.00"));
    }

    @Test
    @DisplayName("Should create a new position")
    void shouldCreatePosition() throws Exception {
        when(positionService.save(any(Position.class))).thenReturn(position);

        mockMvc.perform(post("/api/positions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(position)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(positionId.toString()))
                .andExpect(jsonPath("$.name").value("Vigilante Líder"));
    }

    @Test
    @DisplayName("Should update an existing position")
    void shouldUpdatePosition() throws Exception {
        Position updatedPosition = new Position();
        updatedPosition.setId(positionId);
        updatedPosition.setName("Supervisor de Vigilância");
        updatedPosition.setDescription("Supervisiona todas as equipes de vigilância");
        updatedPosition.setBaseSalary(new BigDecimal("4000.00"));

        when(positionService.save(any(Position.class))).thenReturn(updatedPosition);

        mockMvc.perform(put("/api/positions/{id}", positionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedPosition)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Supervisor de Vigilância"));
    }

    @Test
    @DisplayName("Should delete a position")
    void shouldDeletePosition() throws Exception {
        doNothing().when(positionService).delete(positionId);

        mockMvc.perform(delete("/api/positions/{id}", positionId))
                .andExpect(status().isOk()); // Controller returns OK, not noContent
    }

    @Test
    @DisplayName("Should find position by ID")
    void shouldFindPositionById() throws Exception {
        when(positionService.findById(positionId)).thenReturn(position);

        mockMvc.perform(get("/api/positions/{id}", positionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(positionId.toString()));
    }

    @Test
    @DisplayName("Should find position by name")
    void shouldFindPositionByName() throws Exception {
        String positionName = "Vigilante Líder";
        when(positionService.findByName(positionName)).thenReturn(Optional.of(position));

        mockMvc.perform(get("/api/positions/name/{name}", positionName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(positionName));
    }

    @Test
    @DisplayName("Should find positions by base salary greater than or equal")
    void shouldFindPositionsByBaseSalaryGreaterThanEqual() throws Exception {
        Double baseSalary = 3000.00;
        when(positionService.findByBaseSalaryGreaterThanEqual(baseSalary)).thenReturn(Collections.singletonList(position));

        mockMvc.perform(get("/api/positions/salary/{baseSalary}", baseSalary))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].baseSalary").value(3500.00));
    }

    @Test
    @DisplayName("Should find all positions")
    void shouldFindAllPositions() throws Exception {
        when(positionService.findAll()).thenReturn(Collections.singletonList(position));

        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(positionId.toString()));
    }
} 