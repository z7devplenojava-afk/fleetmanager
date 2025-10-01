package br.com.fleetmanager.service;

import br.com.fleetmanager.model.KanbanStatus;
import br.com.fleetmanager.repository.KanbanStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class KanbanStatusService {
    @Autowired
    private KanbanStatusRepository kanbanStatusRepository;

    public List<KanbanStatus> findAll() {
        return kanbanStatusRepository.findAll();
    }

    public Optional<KanbanStatus> findById(UUID id) {
        return kanbanStatusRepository.findById(id);
    }

    public KanbanStatus save(KanbanStatus status) {
        return kanbanStatusRepository.save(status);
    }

    public void delete(UUID id) {
        kanbanStatusRepository.deleteById(id);
    }
} 