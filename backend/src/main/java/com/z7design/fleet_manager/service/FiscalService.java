package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FiscalDocument;
import com.z7design.fleet_manager.repository.FiscalDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FiscalService {

    private final FiscalDocumentRepository repository;

    public List<FiscalDocument> findAll() {
        return repository.findAll();
    }

    public FiscalDocument findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Documento fiscal não encontrado"));
    }

    @Transactional
    public FiscalDocument save(FiscalDocument doc) {
        return repository.save(doc);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public FiscalDocument importXml(String xmlContent) {
        // TODO: Implementar parser de XML (NFe, CTe)
        // Por agora é um placeholder
        return new FiscalDocument();
    }
}
