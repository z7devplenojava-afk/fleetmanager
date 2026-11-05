package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Garage;
import com.z7design.fleet_manager.model.Vehicle;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Monta o texto enviado ao motorista quando a OS e concluida.
 *
 * <p>O conteudo e deliberadamente seguro: nao inclui cliente, obra, custos,
 * assinaturas ou observacoes internas.</p>
 */
@Component
public class WorkOrderNotificationMessageFactory {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private static final int MAX_MESSAGE_LENGTH = 3500;
    private static final int MAX_SERVICE_LENGTH = 900;

    public String buildDriverMessage(FleetWorkOrder order, DriverContact contact) {
        StringBuilder message = new StringBuilder();

        String firstName = firstName(contact != null ? contact.name() : null);
        if (firstName != null) {
            message.append("Ola, ").append(firstName).append("!\n\n");
        } else {
            message.append("Ola!\n\n");
        }

        message.append("A ").append(osLabel(order))
                .append(" do veiculo ").append(vehicleDescription(order))
                .append(" foi concluida");

        LocalDateTime completedAt = order.getCompletionDate() != null
                ? order.getCompletionDate()
                : LocalDateTime.now();
        message.append(" em ").append(completedAt.format(DATE_FMT))
                .append(" as ").append(completedAt.format(TIME_FMT)).append(".\n");

        String performed = trimToNull(order.getMaintenancePerformed());
        if (performed != null) {
            message.append("\nServico realizado: ").append(truncate(performed, MAX_SERVICE_LENGTH)).append("\n");
        }

        String location = resolvePickupLocation(order);
        if (location != null) {
            message.append("\nLocal de retirada: ").append(location).append("\n");
        }

        message.append("\nO resumo da OS segue em anexo (PDF).\n\n")
                .append("Mensagem automatica do sistema.");

        return truncate(message.toString(), MAX_MESSAGE_LENGTH);
    }

    public String buildDocumentCaption(FleetWorkOrder order) {
        return osLabel(order) + " - " + vehicleDescription(order)
                + " concluida. Resumo em PDF.";
    }

    public String buildDocumentFilename(FleetWorkOrder order) {
        String raw = osNumber(order) + "-" + plate(order) + ".pdf";
        if (!raw.toUpperCase(Locale.ROOT).startsWith("OS")) {
            raw = "OS-" + raw;
        }
        String safe = raw.replaceAll("[^A-Za-z0-9._-]", "_");
        return safe.isBlank() ? "resumo-os.pdf" : safe;
    }

    private String resolvePickupLocation(FleetWorkOrder order) {
        Garage garage = order.getGarage();
        if (garage == null && order.getVehicle() != null) {
            garage = order.getVehicle().getGarage();
        }
        if (garage == null) {
            return null;
        }

        StringBuilder location = new StringBuilder();
        if (garage.getName() != null && !garage.getName().isBlank()) {
            location.append(garage.getName());
        }
        if (garage.getAddress() != null && !garage.getAddress().isBlank()) {
            if (!location.isEmpty()) {
                location.append(" - ");
            }
            location.append(garage.getAddress());
        }
        return location.isEmpty() ? null : location.toString();
    }

    private String vehicleDescription(FleetWorkOrder order) {
        Vehicle vehicle = order.getVehicle();
        if (vehicle == null) {
            return "veiculo";
        }
        String plate = trimToNull(vehicle.getPlate());
        String brand = trimToNull(vehicle.getBrand());
        String model = trimToNull(vehicle.getModel());

        StringBuilder description = new StringBuilder();
        if (plate != null) {
            description.append(plate);
        }
        if (brand != null || model != null) {
            if (!description.isEmpty()) {
                description.append(" - ");
            }
            if (brand != null) {
                description.append(brand);
            }
            if (model != null) {
                if (!description.isEmpty() && brand != null) {
                    description.append(" ");
                }
                description.append(model);
            }
        }
        return description.isEmpty() ? "veiculo" : description.toString();
    }

    private String plate(FleetWorkOrder order) {
        String plate = order.getVehicle() != null ? trimToNull(order.getVehicle().getPlate()) : null;
        return plate != null ? plate : "SEM-PLACA";
    }

    private String osNumber(FleetWorkOrder order) {
        String osNumber = trimToNull(order.getOsNumber());
        if (osNumber != null) {
            return osNumber;
        }
        return order.getId() != null ? "OS-" + order.getId().toString().substring(0, 8) : "OS";
    }

    private String osLabel(FleetWorkOrder order) {
        String raw = osNumber(order);
        return raw.toUpperCase(Locale.ROOT).startsWith("OS") ? raw : "OS " + raw;
    }

    private String firstName(String name) {
        String clean = trimToNull(name);
        if (clean == null) {
            return null;
        }
        int space = clean.indexOf(' ');
        return space > 0 ? clean.substring(0, space) : clean;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3).trim() + "...";
    }
}
