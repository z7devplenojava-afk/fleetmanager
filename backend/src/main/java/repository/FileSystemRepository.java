package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.FileSystemItem;
import br.com.fleetmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileSystemRepository extends JpaRepository<FileSystemItem, UUID> {
    
    /**
     * Busca todos os itens de um diretório específico
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.parent.id = :parentId AND f.isDeleted = false ORDER BY f.type, f.name")
    List<FileSystemItem> findByParentIdAndNotDeleted(@Param("parentId") UUID parentId);
    
    /**
     * Busca itens na raiz (sem parent)
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.parent IS NULL AND f.isDeleted = false ORDER BY f.type, f.name")
    List<FileSystemItem> findRootItems();
    
    /**
     * Busca itens por owner e path
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.path = :path AND f.isDeleted = false")
    List<FileSystemItem> findByOwnerAndPath(@Param("owner") User owner, @Param("path") String path);
    
    /**
     * Busca item por owner, parent e name
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.parent = :parent AND f.name = :name AND f.isDeleted = false")
    Optional<FileSystemItem> findByOwnerAndParentAndName(@Param("owner") User owner, @Param("parent") FileSystemItem parent, @Param("name") String name);
    
    /**
     * Busca item por owner, parent null e name (raiz)
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.parent IS NULL AND f.name = :name AND f.isDeleted = false")
    Optional<FileSystemItem> findByOwnerAndParentNullAndName(@Param("owner") User owner, @Param("name") String name);
    
    /**
     * Busca todos os itens de um usuário
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.isDeleted = false ORDER BY f.path, f.name")
    List<FileSystemItem> findByOwnerAndNotDeleted(@Param("owner") User owner);
    
    /**
     * Busca itens por tipo
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.type = :type AND f.isDeleted = false ORDER BY f.name")
    List<FileSystemItem> findByOwnerAndTypeAndNotDeleted(@Param("owner") User owner, @Param("type") FileSystemItem.ItemType type);
    
    /**
     * Conta itens em um diretório
     */
    @Query("SELECT COUNT(f) FROM FileSystemItem f WHERE f.parent = :parent AND f.isDeleted = false")
    Long countByParentAndNotDeleted(@Param("parent") FileSystemItem parent);
    
    /**
     * Busca itens por nome (busca parcial)
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.name LIKE %:name% AND f.isDeleted = false ORDER BY f.name")
    List<FileSystemItem> findByOwnerAndNameContainingAndNotDeleted(@Param("owner") User owner, @Param("name") String name);
    
    /**
     * Busca pasta por path completo
     */
    @Query("SELECT f FROM FileSystemItem f WHERE f.owner = :owner AND f.path = :path AND f.type = 'FOLDER' AND f.isDeleted = false")
    Optional<FileSystemItem> findFolderByOwnerAndPath(@Param("owner") User owner, @Param("path") String path);
}
