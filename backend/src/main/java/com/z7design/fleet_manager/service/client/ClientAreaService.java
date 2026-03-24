package com.z7design.fleet_manager.service.client;

import com.z7design.fleet_manager.dto.client.ClientRouteDTO;
import com.z7design.fleet_manager.dto.client.ClientSnapshotDTO;
import com.z7design.fleet_manager.dto.client.ClientTimelineEventDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ClientAreaService {

    public List<ClientRouteDTO> getActiveRoutes() {
        List<ClientRouteDTO> routes = new ArrayList<>();

        // Mock data
        routes.add(ClientRouteDTO.builder()
                .id(UUID.randomUUID().toString())
                .name("Rota Alphaville - Manhã")
                .status("ACTIVE")
                .vehiclePlate("ABC-1234")
                .driverName("João Silva")
                .progress(45.0)
                .startTime(LocalDateTime.now().minusMinutes(30))
                .estimatedEndTime(LocalDateTime.now().plusMinutes(15))
                .passengersOnBoard(12)
                .totalSeats(15)
                .currentLocation("Av. Paulista, 1000")
                .nextStops(List.of("Masp", "Trianon", "Brigadeiro"))
                .build());

        routes.add(ClientRouteDTO.builder()
                .id(UUID.randomUUID().toString())
                .name("Rota Centro - Tarde")
                .status("SCHEDULED")
                .vehiclePlate("XYZ-9876")
                .driverName("Maria Santos")
                .progress(0.0)
                .startTime(LocalDateTime.now().plusHours(1))
                .estimatedEndTime(LocalDateTime.now().plusHours(2))
                .passengersOnBoard(0)
                .totalSeats(20)
                .currentLocation("Garagem")
                .nextStops(List.of("Sé", "República", "Anhangabaú"))
                .build());

        return routes;
    }

    public List<ClientTimelineEventDTO> getRouteTimeline(String routeId) {
        List<ClientTimelineEventDTO> events = new ArrayList<>();

        events.add(ClientTimelineEventDTO.builder()
                .id(UUID.randomUUID().toString())
                .type("BOARDING")
                .title("Embarque Confirmado")
                .description("Funcionário Carlos Ferreira embarcou no ponto 3")
                .timestamp(LocalDateTime.now().minusMinutes(5))
                .vehiclePlate("ABC-1234")
                .employeeName("Carlos Ferreira")
                .icon("person_add")
                .status("SUCCESS")
                .build());

        events.add(ClientTimelineEventDTO.builder()
                .id(UUID.randomUUID().toString())
                .type("START_ROUTE")
                .title("Início de Rota")
                .description("Motorista João Silva iniciou o trajeto")
                .timestamp(LocalDateTime.now().minusMinutes(30))
                .vehiclePlate("ABC-1234")
                .icon("play_circle")
                .status("INFO")
                .build());

        return events;
    }

    public ClientSnapshotDTO getCameraSnapshot(String vehicleId) {
        // Mock snapshot
        return ClientSnapshotDTO.builder()
                .vehicleId(vehicleId)
                .vehiclePlate("ABC-1234")
                .cameraLabel("Câmera Frontal")
                .imageUrl(
                        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80") // Placeholder
                                                                                                                                        // image
                .timestamp(LocalDateTime.now())
                .status("ONLINE")
                .batteryLevel(85)
                .lastPosition("Rua Augusta, 500")
                .build();
    }
}
