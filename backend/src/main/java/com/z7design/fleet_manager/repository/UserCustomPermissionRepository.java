package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.UserCustomPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCustomPermissionRepository extends JpaRepository<UserCustomPermission, UUID> {

    /**
     * Buscar todas as permissÃµes ativas de um usuÃ¡rio
     */
    @Query("SELECT ucp FROM UserCustomPermission ucp WHERE ucp.user.id = :userId AND ucp.enabled = true")
    List<UserCustomPermission> findActivePermissionsByUserId(@Param("userId") UUID userId);

    /**
     * Buscar todas as permissÃµes de um usuÃ¡rio (ativas e inativas)
     */
    @Query("SELECT ucp FROM UserCustomPermission ucp WHERE ucp.user.id = :userId")
    List<UserCustomPermission> findAllByUserId(@Param("userId") UUID userId);

    /**
     * Buscar uma permissÃ£o especÃ­fica de um usuÃ¡rio
     */
    @Query("SELECT ucp FROM UserCustomPermission ucp WHERE ucp.user.id = :userId AND ucp.permissionKey = :permissionKey")
    Optional<UserCustomPermission> findByUserIdAndPermissionKey(
        @Param("userId") UUID userId, 
        @Param("permissionKey") String permissionKey
    );

    /**
     * Verificar se usuÃ¡rio tem uma permissÃ£o ativa especÃ­fica
     */
    @Query("SELECT COUNT(ucp) > 0 FROM UserCustomPermission ucp WHERE ucp.user.id = :userId AND ucp.permissionKey = :permissionKey AND ucp.enabled = true")
    boolean hasActivePermission(@Param("userId") UUID userId, @Param("permissionKey") String permissionKey);

    /**
     * Deletar todas as permissÃµes de um usuÃ¡rio
     */
    void deleteByUserId(UUID userId);
}


