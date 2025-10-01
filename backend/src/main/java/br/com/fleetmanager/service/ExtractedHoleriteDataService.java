package br.com.fleetmanager.service;

import br.com.fleetmanager.model.ExtractedHoleriteData;
import br.com.fleetmanager.repository.ExtractedHoleriteDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ExtractedHoleriteDataService {
    @Autowired
    private ExtractedHoleriteDataRepository repository;

    public ExtractedHoleriteData save(ExtractedHoleriteData data) {
        return repository.save(data);
    }
} 