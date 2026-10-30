package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.repository.RouteRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private com.z7design.fleet_manager.repository.RoutePointRepository routePointRepository;

    @Mock
    private RouteCodeGenerator routeCodeGenerator;

    @InjectMocks
    private RouteService routeService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.set(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Deve listar todas as rotas com sucesso")
    void shouldFindAllRoutesSuccessfully() {
        // Arrange
        Route route1 = new Route();
        route1.setId(UUID.randomUUID());
        route1.setName("Linha 01");

        Route route2 = new Route();
        route2.setId(UUID.randomUUID());
        route2.setName("Linha 02");

        when(routeRepository.findAll()).thenReturn(List.of(route1, route2));

        // Act
        List<Route> result = routeService.findAllRoutes();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Linha 01");
        verify(routeRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Deve atribuir companyId do tenantContext e ordenar pontos na criação")
    void shouldAssignTenantAndPointOrdersOnCreate() {
        // Arrange
        Route route = new Route();
        route.setName("Linha Expressa");
        route.setCode("ROTA-EXP-01");

        List<RoutePoint> points = new ArrayList<>();
        RoutePoint p1 = RoutePoint.builder().name("Início").latitude(-19.9).longitude(-44.0).type(RoutePoint.RoutePointType.START).build();
        RoutePoint p2 = RoutePoint.builder().name("Fim").latitude(-19.8).longitude(-43.9).type(RoutePoint.RoutePointType.END).build();
        points.add(p1);
        points.add(p2);
        route.setPoints(points);

        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Route saved = routeService.createRoute(route);

        // Assert
        assertThat(saved.getCompanyId()).isEqualTo(tenantId);
        assertThat(saved.getPoints().get(0).getOrder()).isEqualTo(0);
        assertThat(saved.getPoints().get(1).getOrder()).isEqualTo(1);
        assertThat(saved.getPoints().get(0).getRoute()).isEqualTo(saved);
        verify(routeRepository).save(route);
    }

    @Test
    @DisplayName("Deve atualizar rota e sincronizar pontos existentes")
    void shouldUpdateRouteAndPoints() {
        // Arrange
        UUID routeId = UUID.randomUUID();
        Route existing = new Route();
        existing.setId(routeId);
        existing.setName("Linha Antiga");
        existing.setPoints(new ArrayList<>());

        Route updateData = new Route();
        updateData.setName("Linha Nova");
        updateData.setOriginCep("30130-000");
        updateData.setDestinationCep("32000-000");
        updateData.setDistanceKm(25.5);

        List<RoutePoint> newPoints = new ArrayList<>();
        newPoints.add(RoutePoint.builder().name("Ponto A").latitude(-19.9).longitude(-44.0).type(RoutePoint.RoutePointType.START).build());
        updateData.setPoints(newPoints);

        when(routeRepository.findById(routeId)).thenReturn(Optional.of(existing));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Route updated = routeService.updateRoute(routeId, updateData);

        // Assert
        assertThat(updated.getName()).isEqualTo("Linha Nova");
        assertThat(updated.getOriginCep()).isEqualTo("30130-000");
        assertThat(updated.getDistanceKm()).isEqualTo(25.5);
        assertThat(updated.getPoints()).hasSize(1);
        assertThat(updated.getPoints().get(0).getOrder()).isEqualTo(0);
    }
}
