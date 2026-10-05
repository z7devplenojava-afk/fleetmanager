package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.CIPAMeeting;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CIPAMeetingRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço para gerenciamento de reuniões da CIPA (CRUD).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CIPAMeetingService {

    private final CIPAMeetingRepository cipaMeetingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> findAll() {
        return cipaMeetingRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> findById(UUID id) {
        return cipaMeetingRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Reunião da CIPA não encontrada: " + id));
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body, UUID createdByUserId) {
        CIPAMeeting meeting = new CIPAMeeting();
        applyFields(meeting, body);
        if (meeting.getMeetingDate() == null) {
            throw new IllegalArgumentException("Data da reunião é obrigatória");
        }
        if (createdByUserId != null) {
            User user = userRepository.findById(createdByUserId).orElse(null);
            if (user != null) {
                meeting.setCreatedByUser(user);
            }
        }
        CIPAMeeting saved = cipaMeetingRepository.save(meeting);
        log.info("Reunião CIPA criada: {} ({})", saved.getTitle(), saved.getMeetingDate());
        return toDto(saved);
    }

    @Transactional
    public Map<String, Object> update(UUID id, Map<String, Object> body) {
        CIPAMeeting meeting = cipaMeetingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reunião da CIPA não encontrada: " + id));
        applyFields(meeting, body);
        CIPAMeeting saved = cipaMeetingRepository.save(meeting);
        log.info("Reunião CIPA atualizada: {}", saved.getId());
        return toDto(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!cipaMeetingRepository.existsById(id)) {
            throw new IllegalArgumentException("Reunião da CIPA não encontrada: " + id);
        }
        cipaMeetingRepository.deleteById(id);
        log.info("Reunião CIPA removida: {}", id);
    }

    // ========== HELPERS ==========

    private void applyFields(CIPAMeeting meeting, Map<String, Object> body) {
        String title = parseString(body.get("title"));
        if (title != null && !title.isBlank()) {
            meeting.setTitle(title);
        }
        LocalDate date = parseDate(body.get("date"));
        if (date != null) {
            meeting.setMeetingDate(date);
        }
        LocalTime time = parseTime(body.get("time"));
        if (time != null) {
            meeting.setMeetingTime(time);
        }
        String location = parseString(body.get("location"));
        if (location != null) {
            meeting.setLocation(location);
        }
        String meetingType = parseString(body.get("meetingType"));
        if (meetingType != null && !meetingType.isBlank()) {
            meeting.setMeetingType(meetingType);
        }
        // Frontend envia agenda como texto multilinha; entidade usa String
        String agenda = parseString(body.get("agenda"));
        if (agenda != null) {
            meeting.setAgenda(agenda);
        }
        // Frontend envia attendees como lista de nomes
        Object attendeesObj = body.get("attendees");
        if (attendeesObj instanceof List) {
            meeting.setAttendees(((List<?>) attendeesObj).stream()
                    .map(String::valueOf)
                    .toArray(String[]::new));
        } else if (attendeesObj instanceof String && !((String) attendeesObj).isBlank()) {
            meeting.setAttendees(Arrays.stream(((String) attendeesObj).split("\\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toArray(String[]::new));
        }
        String decisions = parseString(body.get("decisions"));
        if (decisions != null) {
            meeting.setDecisions(decisions);
        }
        LocalDate nextDate = parseDate(body.get("nextReunionDate"));
        if (nextDate == null) {
            nextDate = parseDate(body.get("nextMeetingDate"));
        }
        if (nextDate != null) {
            meeting.setNextMeetingDate(nextDate);
        }
        String status = parseString(body.get("status"));
        if (status != null && !status.isBlank()) {
            meeting.setStatus(status);
        }
    }

    private Map<String, Object> toDto(CIPAMeeting meeting) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", meeting.getId());
        dto.put("title", meeting.getTitle());
        dto.put("date", meeting.getMeetingDate());
        dto.put("time", meeting.getMeetingTime());
        dto.put("location", meeting.getLocation());
        dto.put("meetingType", meeting.getMeetingType());
        dto.put("agenda", splitLines(meeting.getAgenda()));
        dto.put("decisions", splitLines(meeting.getDecisions()));
        dto.put("attendees", meeting.getAttendees() != null
                ? Arrays.asList(meeting.getAttendees())
                : List.of());
        dto.put("nextReunionDate", meeting.getNextMeetingDate());
        dto.put("status", meeting.getStatus());
        dto.put("createdAt", meeting.getCreatedAt());
        dto.put("updatedAt", meeting.getUpdatedAt());
        return dto;
    }

    /**
     * Converte texto multilinha em lista de linhas não vazias (contrato do frontend).
     */
    private List<String> splitLines(String text) {
        if (text == null || text.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(text.split("\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
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

    private LocalTime parseTime(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
