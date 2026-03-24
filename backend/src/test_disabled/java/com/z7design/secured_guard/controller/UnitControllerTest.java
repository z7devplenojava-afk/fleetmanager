package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.Unit;
import com.z7design.secured_guard.service.UnitService;
import com.z7design.secured_guard.exception.ResourceNotFoundException;
import com.z7design.secured_guard.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UnitController.class)
public class UnitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UnitService unitService;

    @Autowired
    private ObjectMapper objectMapper;

    private Unit unit;
    private UUID unitId;
    private UUID parentUnitId;

    @BeforeEach
    void setUp() {
        unitId = UUID.randomUUID();
        parentUnitId = UUID.randomUUID();

        unit = new Unit();
        unit.setId(unitId);
        unit.setName("Unidade Central");
        unit.setAddress("Rua Principal, 123");
        unit.setPhone("(11) 98765-4321");
        unit.setEmail("central@example.com");

        Unit parentUnit = new Unit();
        parentUnit.setId(parentUnitId);
        unit.setParent(parentUnit);
    }

    @Test
    @DisplayName("Should create a new unit")
    void shouldCreateUnit() throws Exception {
        when(unitService.create(any(Unit.class))).thenReturn(unit);

        mockMvc.perform(post("/api/units")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(unit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(unitId.toString()))
                .andExpect(jsonPath("$.name").value("Unidade Central"));
    }

    @Test
    @DisplayName("Should update an existing unit")
    void shouldUpdateUnit() throws Exception {
        Unit updatedUnit = new Unit();
        updatedUnit.setId(unitId);
        updatedUnit.setName("Unidade Central Atualizada");
        updatedUnit.setAddress("Rua Nova, 456");
        updatedUnit.setPhone("(11) 99999-8888");
        updatedUnit.setEmail("central_updated@example.com");
        updatedUnit.setParent(null);

        when(unitService.update(eq(unitId), any(Unit.class))).thenReturn(updatedUnit);

        mockMvc.perform(put("/api/units/{id}", unitId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedUnit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Unidade Central Atualizada"));
    }

    @Test
    @DisplayName("Should delete a unit")
    void shouldDeleteUnit() throws Exception {
        doNothing().when(unitService).delete(unitId);

        mockMvc.perform(delete("/api/units/{id}", unitId))
                .andExpect(status().isOk()); // Controller returns OK, not noContent
    }

    @Test
    @DisplayName("Should find unit by ID")
    void shouldFindUnitById() throws Exception {
        when(unitService.findById(unitId)).thenReturn(unit);

        mockMvc.perform(get("/api/units/{id}", unitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(unitId.toString()));
    }

    @Test
    @DisplayName("Should find unit by name")
    void shouldFindUnitByName() throws Exception {
        String unitName = "Unidade Central";
        when(unitService.findByName(unitName)).thenReturn(unit);

        mockMvc.perform(get("/api/units/name/{name}", unitName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(unitName));
    }

    @Test
    @DisplayName("Should find unit by email")
    void shouldFindUnitByEmail() throws Exception {
        String unitEmail = "central@example.com";
        when(unitService.findByEmail(unitEmail)).thenReturn(unit);

        mockMvc.perform(get("/api/units/email/{email}", unitEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(unitEmail));
    }

    @Test
    @DisplayName("Should find units by address containing")
    void shouldFindUnitsByAddressContaining() throws Exception {
        String addressPart = "Principal";
        when(unitService.findByAddressContaining(addressPart)).thenReturn(Collections.singletonList(unit));

        mockMvc.perform(get("/api/units/address/{address}", addressPart))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].address").value(unit.getAddress()));
    }

    @Test
    @DisplayName("Should find units by parent ID")
    void shouldFindUnitsByParentId() throws Exception {
        when(unitService.findByParentId(parentUnitId)).thenReturn(Collections.singletonList(unit));

        mockMvc.perform(get("/api/units/parent/{parentId}", parentUnitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parent.id").value(parentUnitId.toString()));
    }

    @Test
    @DisplayName("Should find all units")
    void shouldFindAllUnits() throws Exception {
        when(unitService.findAll()).thenReturn(Collections.singletonList(unit));

        mockMvc.perform(get("/api/units"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(unitId.toString()));
    }
} 