package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_system_nodes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileSystemNode {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "path", nullable = false, length = 1000)
    private String path;

    @Column(name = "parent_path", length = 1000)
    private String parentPath;

    @Column(name = "type", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private FileType type;

    @Column(name = "size")
    private Long size;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "physical_path", length = 1000)
    private String physicalPath;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    public enum FileType {
        FILE("Arquivo"),
        FOLDER("Pasta");

        private final String description;

        FileType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}