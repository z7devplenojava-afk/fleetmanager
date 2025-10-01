package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.FileSystemItem;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileSystemItemDTO {
    
    private UUID id;
    private String name;
    private String path;
    private String type;
    private Long size;
    private String mimeType;
    private String fileExtension;
    private UUID parentId;
    private String parentName;
    private String ownerName;
    private String displaySize;
    private String fullPath;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<FileSystemItemDTO> children;
    private boolean hasChildren;
    
    public static FileSystemItemDTO fromEntity(FileSystemItem item) {
        return FileSystemItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .path(item.getPath())
                .type(item.getType().name())
                .size(item.getSize())
                .mimeType(item.getMimeType())
                .fileExtension(item.getFileExtension())
                .parentId(item.getParent() != null ? item.getParent().getId() : null)
                .parentName(item.getParent() != null ? item.getParent().getName() : null)
                .ownerName(item.getOwner().getName())
                .displaySize(item.getDisplaySize())
                .fullPath(item.getFullPath())
                .createdAt(item.getCreatedAt())
                .modifiedAt(item.getModifiedAt())
                .build();
    }
}
