package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.ProposalItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalItemRepository extends JpaRepository<ProposalItem, java.util.UUID> {
    
    List<ProposalItem> findByProposalId(java.util.UUID proposalId);
    
    @Query("SELECT pi FROM ProposalItem pi WHERE pi.proposal.id = :proposalId ORDER BY pi.id")
    List<ProposalItem> findItemsByProposalIdOrdered(@Param("proposalId") java.util.UUID proposalId);
    
    void deleteByProposalId(java.util.UUID proposalId);
    
    @Query("SELECT SUM(pi.totalPrice) FROM ProposalItem pi WHERE pi.proposal.id = :proposalId")
    Double getTotalValueByProposalId(@Param("proposalId") java.util.UUID proposalId);
} 