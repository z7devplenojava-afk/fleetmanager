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
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração do FuelPumpController com MockMvc standalone.
 * Cobre a listagem e criação de tanques de combustível, com o serviço mockado.
 *
 * Nota: usa MockMvcBuilders.standaloneSetup em vez de @WebMvcTest porque
 * o slice @WebMvcTest deste projeto carrega cadeias JPA (userActivityAspect
 * -> LogService -> repositórios, CIDataLoader -> repositórios) que exigem
 * entityManagerFactory, ausente no slice web — o que quebra o context load
 * de qualquer @WebMvcTest (mesmo padrão documentado em EmailMessageControllerTest).
 * O parâmetro Authentication do controller é suprido pelo post-processor
 * .principal(...) de cada requisição — o PrincipalMethodArgumentResolver padrão
 * do MockMvc standalone resolve Authentication (que estende Principal) a partir
 * do userPrincipal da requisição, sem depender do filtro Spring Security.
 */
class FuelPumpControllerTest {

    private MockMvc mockMvc;
    private FuelPumpService fuelPumpService;
    private UserCompanyResolver userCompanyResolver;
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

        fuelPumpService = mock(FuelPumpService.class);
        userCompanyResolver = mock(UserCompanyResolver.class);
        userRepository = mock(UserRepository.class);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userCompanyResolver.resolveCompanyId(user)).thenReturn(companyId);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new FuelPumpController(fuelPumpService, userCompanyResolver, userRepository))
                // O standaloneSetup padrão coloca o JAXB antes do Jackson, serializando
                // o Map de resposta como XML. Configuramos JSON + byte[].
                .setMessageConverters(
                        new ByteArrayHttpMessageConverter(),
                        new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    /** Mock de Authentication cujo getName() alimenta o userRepository.findByUsername(...). */
    private Authentication authentication(String username) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(username);
        return authentication;
    }

    @Test
    void testGetTanks() throws Exception {
        FuelTank tank = FuelTank.builder()
                .id(UUID.randomUUID())
                .name("Tank 1")
                .capacity(new BigDecimal("5000"))
                .currentLevel(new BigDecimal("2500"))
                .fuelType(Vehicle.FuelType.DIESEL)
                .build();

        when(fuelPumpService.getTanks(companyId)).thenReturn(Collections.singletonList(tank));

        mockMvc.perform(get("/api/fuel-infra/tanks").principal(authentication("testuser")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tank 1"))
                .andExpect(jsonPath("$[0].capacity").value(5000))
                .andExpect(jsonPath("$[0].currentLevel").value(2500));
    }

    @Test
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
                .principal(authentication("testuser"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Tank"))
                .andExpect(jsonPath("$.fuelType").value("GASOLINE"));
    }
}
