package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.CIPAMember;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.CIPAMemberRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.util.stream.Collectors;

/**
 * Serviço para gerenciamento de membros da CIPA (CRUD).
 * Multi-tenant: a tabela cipa_members não tem company_id; a empresa é
 * derivada do funcionário vinculado ao membro.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CIPAMemberService {

    private final CIPAMemberRepository cipaMemberRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> findAll() {
        return cipaMemberRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> findByMandateYear(Integer mandateYear) {
        return cipaMemberRepository.findByMandateYear(mandateYear).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> findById(UUID id) {
        return cipaMemberRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Membro da CIPA não encontrado: " + id));
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        UUID employeeId = parseUuid(body.get("employeeId"));
        if (employeeId == null) {
            throw new IllegalArgumentException("employeeId é obrigatório");
        }
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Funcionário não encontrado: " + employeeId));

        CIPAMember member = CIPAMember.builder()
                .employee(employee)
                .mandateYear(resolveMandateYear(body))
                .position(resolvePosition(body))
                .function(parseString(body.get("function")))
                .electionDate(resolveElectionDate(body))
                .startDate(parseDate(body.get("startDate")))
                .endDate(parseDate(body.get("endDate")))
                .isActive(true)
                .build();

        validateDates(member);
        CIPAMember saved = cipaMemberRepository.save(member);
        log.info("Membro CIPA criado: {} (mandato {})", saved.getEmployee().getName(), saved.getMandateYear());
        return toDto(saved);
    }

    @Transactional
    public Map<String, Object> update(UUID id, Map<String, Object> body) {
        CIPAMember member = cipaMemberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Membro da CIPA não encontrado: " + id));

        if (body.containsKey("employeeId")) {
            UUID employeeId = parseUuid(body.get("employeeId"));
            if (employeeId != null && !employeeId.equals(member.getEmployee().getId())) {
                Employee employee = employeeRepository.findById(employeeId)
                        .orElseThrow(() -> new IllegalArgumentException("Funcionário não encontrado: " + employeeId));
                member.setEmployee(employee);
            }
        }
        if (body.containsKey("mandateYear")) {
            member.setMandateYear(resolveMandateYear(body));
        }
        if (body.containsKey("position")) {
            member.setPosition(resolvePosition(body));
        }
        if (body.containsKey("function")) {
            member.setFunction(parseString(body.get("function")));
        }
        if (body.containsKey("startDate") && parseDate(body.get("startDate")) != null) {
            member.setStartDate(parseDate(body.get("startDate")));
        }
        if (body.containsKey("endDate") && parseDate(body.get("endDate")) != null) {
            member.setEndDate(parseDate(body.get("endDate")));
        }
        if (body.containsKey("isActive") && body.get("isActive") != null) {
            member.setIsActive(Boolean.parseBoolean(body.get("isActive").toString()));
        }

        validateDates(member);
        CIPAMember saved = cipaMemberRepository.save(member);
        log.info("Membro CIPA atualizado: {}", saved.getId());
        return toDto(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!cipaMemberRepository.existsById(id)) {
            throw new IllegalArgumentException("Membro da CIPA não encontrado: " + id);
        }
        cipaMemberRepository.deleteById(id);
        log.info("Membro CIPA removido: {}", id);
    }

    // ========== HELPERS ==========

    private void validateDates(CIPAMember member) {
        LocalDate start = member.getStartDate();
        LocalDate end = member.getEndDate();
        if (start == null || end == null) {
            throw new IllegalArgumentException("Data de início e fim do mandato são obrigatórias");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Data de fim do mandato não pode ser anterior à data de início");
        }
    }

    /**
     * Cargo na CIPA: o frontend envia "position" como função (PRESIDENTE, VICE_PRESIDENTE,
     * SECRETARIO, MEMBRO) e "department" como setor do funcionário. Na entidade, position é
     * TITULAR/SUPLENTE e function é a função. O department vai como "function" auxiliar
     * concatenado? Não — department é derivado do funcionário no DTO.
     */
    private String resolvePosition(Map<String, Object> body) {
        // "function" tem prioridade (campo da entidade); fallback para "position" do frontend
        String fn = parseString(body.get("function"));
        if (fn != null && !fn.isBlank()) {
            return "TITULAR";
        }
        String pos = parseString(body.get("position"));
        return (pos == null || pos.isBlank()) ? "TITULAR" : pos;
    }

    private Integer resolveMandateYear(Map<String, Object> body) {
        Object my = body.get("mandateYear");
        if (my != null) {
            try {
                return Integer.parseInt(my.toString());
            } catch (NumberFormatException ignored) {
                // cai no cálculo pela data
            }
        }
        LocalDate start = parseDate(body.get("startDate"));
        LocalDate election = parseDate(body.get("electionDate"));
        LocalDate ref = start != null ? start : (election != null ? election : LocalDate.now());
        return ref.getYear();
    }

    private LocalDate resolveElectionDate(Map<String, Object> body) {
        LocalDate election = parseDate(body.get("electionDate"));
        if (election != null) {
            return election;
        }
        LocalDate start = parseDate(body.get("startDate"));
        return start != null ? start.minusDays(1) : LocalDate.now().minusDays(1);
    }

    private Map<String, Object> toDto(CIPAMember member) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", member.getId());
        dto.put("employeeId", member.getEmployee() != null ? member.getEmployee().getId() : null);
        dto.put("employeeName", member.getEmployee() != null ? member.getEmployee().getName() : null);
        dto.put("mandateYear", member.getMandateYear());
        dto.put("position", member.getFunction() != null && !member.getFunction().isBlank()
                ? member.getFunction() : member.getPosition());
        dto.put("entityPosition", member.getPosition());
        dto.put("department", member.getEmployee() != null
                && member.getEmployee().getDepartment() != null
                ? member.getEmployee().getDepartment().getName()
                : null);
        dto.put("startDate", member.getStartDate());
        dto.put("endDate", member.getEndDate());
        dto.put("status", Boolean.TRUE.equals(member.getIsActive()) ? "ATIVO" : "INATIVO");
        dto.put("isActive", member.getIsActive());
        dto.put("createdAt", member.getCreatedAt());
        dto.put("updatedAt", member.getUpdatedAt());
        return dto;
    }

    private UUID parseUuid(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String parseString(Object value) {
        return value == null ? null : value.toString();
    }

    private LocalDate parseDate(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.toString().substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }
}
