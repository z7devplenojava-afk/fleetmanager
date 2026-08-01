package com.z7design.fleet_manager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.FuelTankDTO;
import com.z7design.fleet_manager.model.FuelTank;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.service.FuelPumpService;
import com.z7design.fleet_manager.service.UserCompanyResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FuelPumpController.class)
@AutoConfigureMockMvc
class FuelPumpControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FuelPumpService fuelPumpService;

    @MockBean
    private UserCompanyResolver userCompanyResolver;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID companyId;
    private User user;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        user = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .companyId(companyId)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userCompanyResolver.resolveCompanyId(user)).thenReturn(companyId);
    }

    @Test
    @WithMockUser(username = "testuser")
    void testGetTanks() throws Exception {
        FuelTank tank = FuelTank.builder()
                .id(UUID.randomUUID())
                .name("Tank 1")
                .capacity(new BigDecimal("5000"))
                .currentLevel(new BigDecimal("2500"))
                .fuelType(Vehicle.FuelType.DIESEL)
                .build();

        when(fuelPumpService.getTanks(companyId)).thenReturn(Collections.singletonList(tank));

        mockMvc.perform(get("/api/fuel-infra/tanks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tank 1"))
                .andExpect(jsonPath("$[0].capacity").value(5000))
                .andExpect(jsonPath("$[0].currentLevel").value(2500));
    }

    @Test
    @WithMockUser(username = "testuser")
    void testCreateTank() throws Exception {
        FuelTankDTO dto = new FuelTankDTO();
        dto.setName("New Tank");
        dto.setCapacity(new BigDecimal("10000"));
        dto.setCurrentLevel(new BigDecimal("0"));
        dto.setFuelType(Vehicle.FuelType.GASOLINE);

        FuelTank savedTank = FuelTank.builder()
                .id(UUID.randomUUID())
                .name("New Tank")
                .capacity(new BigDecimal("10000"))
                .currentLevel(new BigDecimal("0"))
                .fuelType(Vehicle.FuelType.GASOLINE)
                .build();

        when(fuelPumpService.saveTank(any(FuelTank.class), any(UUID.class))).thenReturn(savedTank);

        mockMvc.perform(post("/api/fuel-infra/tanks")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Tank"))
                .andExpect(jsonPath("$.fuelType").value("GASOLINE"));
    }
}
