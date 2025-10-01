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

@Data
@Entity
@Table(name = "file_system_items")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileSystemItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    @Column(name = "path", nullable = false, length = 1000)
    private String path;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ItemType type;
    
    @Column(name = "size")
    private Long size;
    
    @Column(name = "mime_type", length = 100)
    private String mimeType;
    
    @Column(name = "file_extension", length = 10)
    private String fileExtension;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private FileSystemItem parent;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "modified_at", nullable = false)
    private LocalDateTime modifiedAt;
    
    @Column(name = "physical_path", length = 1000)
    private String physicalPath;
    
    // Enum para tipos de item
    public enum ItemType {
        FILE, FOLDER
    }
    
    // Métodos auxiliares
    public boolean isFile() {
        return ItemType.FILE.equals(this.type);
    }
    
    public boolean isFolder() {
        return ItemType.FOLDER.equals(this.type);
    }
    
    public String getFullPath() {
        if (parent == null) {
            return "/" + name;
        }
        return parent.getFullPath() + "/" + name;
    }
    
    public String getDisplaySize() {
        if (size == null || size == 0) {
            return isFolder() ? "-" : "0 B";
        }
        
        if (size < 1024) {
            return size + " B";
        } else if (size < 1024 * 1024) {
            return String.format("%.1f KB", size / 1024.0);
        } else if (size < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", size / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", size / (1024.0 * 1024.0 * 1024.0));
        }
    }
}
