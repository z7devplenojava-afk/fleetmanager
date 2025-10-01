package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.ShiftChangeForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftChangeFormRepository extends JpaRepository<ShiftChangeForm, Long> {
}
