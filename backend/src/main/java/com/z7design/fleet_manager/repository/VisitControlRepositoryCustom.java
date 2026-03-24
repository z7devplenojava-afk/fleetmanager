package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VisitControl;
import com.z7design.fleet_manager.model.enums.VisitControlStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface VisitControlRepositoryCustom {
    List<VisitControl> findByFiltersWithFetch(UUID workPostId, VisitControlStatus status, 
                                             LocalDate startDate, LocalDate endDate);
}













