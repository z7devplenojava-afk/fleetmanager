package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.OrderOfServiceSST;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderOfServiceSSTRepository extends JpaRepository<OrderOfServiceSST, UUID> {
} 