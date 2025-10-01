package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.FileSystemNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileSystemNodeRepository extends JpaRepository<FileSystemNode, UUID> {

    @Query("SELECT f FROM FileSystemNode f WHERE f.parentPath = :parentPath ORDER BY f.type DESC, f.name ASC")
    List<FileSystemNode> findByParentPathOrderByTypeDescNameAsc(@Param("parentPath") String parentPath);

    @Query("SELECT f FROM FileSystemNode f WHERE f.path = :path")
    Optional<FileSystemNode> findByPath(@Param("path") String path);

    @Query("SELECT f FROM FileSystemNode f WHERE f.parentPath = :parentPath AND f.name = :name")
    Optional<FileSystemNode> findByParentPathAndName(@Param("parentPath") String parentPath, @Param("name") String name);

    @Query("SELECT f FROM FileSystemNode f WHERE f.type = :type ORDER BY f.name ASC")
    List<FileSystemNode> findByTypeOrderByNameAsc(@Param("type") FileSystemNode.FileType type);

    @Query("SELECT f FROM FileSystemNode f WHERE f.name LIKE %:searchTerm% ORDER BY f.type DESC, f.name ASC")
    List<FileSystemNode> findByNameContainingIgnoreCaseOrderByTypeDescNameAsc(@Param("searchTerm") String searchTerm);

    @Query("SELECT f FROM FileSystemNode f WHERE f.path LIKE :pathPattern ORDER BY f.type DESC, f.name ASC")
    List<FileSystemNode> findByPathLikeOrderByTypeDescNameAsc(@Param("pathPattern") String pathPattern);

    @Query("SELECT COUNT(f) FROM FileSystemNode f WHERE f.parentPath = :parentPath")
    long countByParentPath(@Param("parentPath") String parentPath);

    @Query("SELECT f FROM FileSystemNode f WHERE f.createdBy = :userId ORDER BY f.createdAt DESC")
    List<FileSystemNode> findByCreatedByOrderByCreatedAtDesc(@Param("userId") UUID userId);
}