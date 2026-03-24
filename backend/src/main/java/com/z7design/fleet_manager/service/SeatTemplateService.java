package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.SeatTemplate;
import com.z7design.fleet_manager.repository.SeatTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SeatTemplateService {

    private final SeatTemplateRepository seatTemplateRepository;

    @Transactional(readOnly = true)
    public List<SeatTemplate> getAllTemplates(UUID companyId) {
        if (companyId == null) {
            return seatTemplateRepository.findAll();
        }
        return seatTemplateRepository.findAllByCompanyId(companyId);
    }

    @Transactional
    public SeatTemplate saveTemplate(SeatTemplate template) {
        return seatTemplateRepository.save(template);
    }

    @Transactional(readOnly = true)
    public SeatTemplate getById(UUID id) {
        return seatTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seat Template not found"));
    }
}
