package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Cid10Entry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Cid10Repository extends JpaRepository<Cid10Entry, String> {

    Optional<Cid10Entry> findByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Cid10Entry c WHERE LOWER(c.code) LIKE LOWER(CONCAT(:query, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.code ASC")
    List<Cid10Entry> searchByCodeOrDescription(@Param("query") String query, Pageable pageable);
}
