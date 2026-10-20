package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.Cid10DTO;
import com.z7design.fleet_manager.model.Cid10Entry;
import com.z7design.fleet_manager.repository.Cid10Repository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class Cid10Service {

    private final Cid10Repository cid10Repository;

    @Transactional(readOnly = true)
    public List<Cid10DTO> search(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return cid10Repository.findAll(PageRequest.of(0, Math.min(limit, 50)))
                    .map(Cid10DTO::fromEntity)
                    .toList();
        }

        String cleanQuery = query.trim();
        List<Cid10Entry> results = cid10Repository.searchByCodeOrDescription(cleanQuery, PageRequest.of(0, Math.min(limit, 50)));
        return results.stream().map(Cid10DTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Cid10DTO> findByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return Optional.empty();
        }
        return cid10Repository.findByCodeIgnoreCase(code.trim()).map(Cid10DTO::fromEntity);
    }
}
