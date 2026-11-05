package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.util.WhatsAppPhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolve o WhatsApp do motorista responsavel por uma OS.
 *
 * <p>A OS nao possui um {@code driverId} direto. A resolucao usa, nesta
 * ordem:</p>
 * <ol>
 *   <li>funcionario responsavel pelo veiculo;</li>
 *   <li>nome livre {@code vehicle.assignedDriver} (somente match exato);</li>
 *   <li>solicitante da OS, quando for motorista/funcionario/usuario.</li>
 * </ol>
 *
 * <p>Quando um nivel retorna mais de um telefone diferente, a resolucao e
 * considerada ambigua e nenhum envio e feito. Isso evita mandar o PDF da OS
 * para a pessoa errada.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DriverContactResolver {

    private final EmployeeRepository employeeRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    public Optional<DriverContact> resolve(FleetWorkOrder order) {
        if (order == null) {
            return Optional.empty();
        }

        Vehicle vehicle = order.getVehicle();

        // 1) Funcionario responsavel pelo veiculo (fonte mais confiavel)
        if (vehicle != null && vehicle.getResponsibleEmployeeId() != null) {
            Resolution responsible = resolveEmployee(vehicle.getResponsibleEmployeeId(), "vehicle.responsibleEmployee");
            if (responsible.ambiguous()) {
                log.warn("Contato do motorista ambiguo para a OS {} na origem vehicle.responsibleEmployee",
                        order.getId());
                return Optional.empty();
            }
            if (responsible.contact() != null) {
                return Optional.of(responsible.contact());
            }
        }

        // 2) Nome livre do motorista atribuido ao veiculo
        if (vehicle != null && hasText(vehicle.getAssignedDriver())) {
            Resolution assigned = resolveAssignedDriverName(vehicle.getAssignedDriver(), resolveCompanyId(order));
            if (assigned.ambiguous()) {
                log.warn("Contato do motorista ambiguo para a OS {} pelo nome '{}'",
                        order.getId(), vehicle.getAssignedDriver());
                return Optional.empty();
            }
            if (assigned.contact() != null) {
                return Optional.of(assigned.contact());
            }
        }

        // 3) Solicitante da OS
        Resolution requester = resolveRequester(order.getRequesterId());
        if (requester.ambiguous()) {
            log.warn("Contato do motorista ambiguo para a OS {} pelo solicitante", order.getId());
            return Optional.empty();
        }
        return Optional.ofNullable(requester.contact());
    }

    private Resolution resolveEmployee(UUID employeeId, String source) {
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) {
            return Resolution.none();
        }
        List<Candidate> candidates = new ArrayList<>();
        addEmployeeCandidate(employee, source, candidates);
        return choose(candidates, "funcionario " + employee.getName());
    }

    private Resolution resolveRequester(UUID requesterId) {
        if (requesterId == null) {
            return Resolution.none();
        }

        Driver driver = driverRepository.findById(requesterId).orElse(null);
        if (driver != null) {
            List<Candidate> candidates = new ArrayList<>();
            addDriverCandidate(driver, "workOrder.requester", candidates);
            return choose(candidates, "motorista solicitante " + driver.getName());
        }

        Employee employee = employeeRepository.findById(requesterId).orElse(null);
        if (employee != null) {
            List<Candidate> candidates = new ArrayList<>();
            addEmployeeCandidate(employee, "workOrder.requester", candidates);
            return choose(candidates, "funcionario solicitante " + employee.getName());
        }

        User user = userRepository.findById(requesterId).orElse(null);
        if (user != null) {
            List<Candidate> candidates = new ArrayList<>();
            addUserCandidate(user, "workOrder.requester", candidates);
            return choose(candidates, "usuario solicitante " + user.getName());
        }

        return Resolution.none();
    }

    private Resolution resolveAssignedDriverName(String assignedDriver, UUID companyId) {
        String queryName = assignedDriver
                .replaceAll("(?i)\\(\\s*motorista\\s*\\)", " ")
                .trim();
        String name = normalizeName(queryName);
        if (name.isBlank()) {
            return Resolution.none();
        }

        List<Driver> matches = driverRepository.findByNameIgnoreCase(queryName);
        if (matches.isEmpty()) {
            matches = driverRepository.findByNameContainingIgnoreCase(queryName);
        }

        List<Driver> exactMatches = matches.stream()
                .filter(d -> d != null && normalizeName(d.getName()).equals(name))
                .filter(d -> belongsToCompany(d, companyId))
                .toList();

        List<Driver> activeMatches = exactMatches.stream()
                .filter(d -> "ATIVO".equalsIgnoreCase(d.getStatus()))
                .toList();

        if (activeMatches.isEmpty()) {
            if (!exactMatches.isEmpty()) {
                log.warn("Motorista '{}' encontrado, mas nenhum registro esta ATIVO", assignedDriver);
            }
            return Resolution.none();
        }

        List<Candidate> candidates = new ArrayList<>();
        for (Driver driver : activeMatches) {
            addDriverCandidate(driver, "vehicle.assignedDriver", candidates);
        }
        return choose(candidates, "motorista atribuido " + assignedDriver);
    }

    private boolean belongsToCompany(Driver driver, UUID companyId) {
        if (companyId == null) {
            return true;
        }
        return driver.getCompanyId() == null || companyId.equals(driver.getCompanyId());
    }

    private void addEmployeeCandidate(Employee employee, String source, List<Candidate> candidates) {
        String phone = firstValidPhone(employee.getPhone(), employee.getTelefoneContato());
        if (phone == null && employee.getUser() != null) {
            phone = userWhatsApp(employee.getUser());
        }
        if (phone != null) {
            candidates.add(new Candidate(employee.getName(), phone, source));
        }
    }

    private void addDriverCandidate(Driver driver, String source, List<Candidate> candidates) {
        String phone = firstValidPhone(driver.getPhone());
        if (phone == null && driver.getUser() != null) {
            phone = userWhatsApp(driver.getUser());
        }
        if (phone != null) {
            candidates.add(new Candidate(driver.getName(), phone, source));
        }
    }

    private void addUserCandidate(User user, String source, List<Candidate> candidates) {
        String phone = userWhatsApp(user);
        if (phone != null) {
            candidates.add(new Candidate(user.getName(), phone, source));
        }
    }

    private String userWhatsApp(User user) {
        if (user == null || !Boolean.TRUE.equals(user.getWhatsappConsent())) {
            return null;
        }
        return WhatsAppPhoneUtils.normalizeBrazilian(user.getWhatsapp());
    }

    private String firstValidPhone(String... phones) {
        for (String phone : phones) {
            String normalized = WhatsAppPhoneUtils.normalizeBrazilian(phone);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private Resolution choose(List<Candidate> candidates, String context) {
        Map<String, Candidate> unique = new LinkedHashMap<>();
        for (Candidate candidate : candidates) {
            String normalized = WhatsAppPhoneUtils.normalizeBrazilian(candidate.phone());
            if (normalized != null) {
                unique.putIfAbsent(normalized, new Candidate(candidate.name(), normalized, candidate.source()));
            }
        }

        if (unique.isEmpty()) {
            return Resolution.none();
        }
        if (unique.size() > 1) {
            log.warn("Mais de um telefone valido encontrado para {}: {}", context, unique.keySet());
            return new Resolution(null, true);
        }

        Candidate selected = unique.values().iterator().next();
        log.info("Contato do motorista resolvido para {}: {} ({})",
                context, maskPhone(selected.phone()), selected.source());
        return Resolution.found(new DriverContact(
                hasText(selected.name()) ? selected.name() : "Motorista",
                selected.phone(),
                selected.source()));
    }

    private UUID resolveCompanyId(FleetWorkOrder order) {
        if (order.getCompanyId() != null) {
            return order.getCompanyId();
        }
        return order.getVehicle() != null ? order.getVehicle().getCompanyId() : null;
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String withoutSuffix = value.replaceAll("(?i)\\(\\s*motorista\\s*\\)", " ").trim();
        String normalized = Normalizer.normalize(withoutSuffix, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
        return normalized.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "****" + phone.substring(phone.length() - 4);
    }

    private record Candidate(String name, String phone, String source) {
    }

    private record Resolution(DriverContact contact, boolean ambiguous) {
        static Resolution none() {
            return new Resolution(null, false);
        }

        static Resolution found(DriverContact contact) {
            return new Resolution(contact, false);
        }
    }
}
