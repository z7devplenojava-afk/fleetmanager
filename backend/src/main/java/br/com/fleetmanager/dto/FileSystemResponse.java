package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileSystemResponse {
    
    private boolean success;
    private String message;
    private Object data;
    
    public static FileSystemResponse success(String message, Object data) {
        return new FileSystemResponse(true, message, data);
    }
    
    public static FileSystemResponse success(String message) {
        return new FileSystemResponse(true, message, null);
    }
    
    public static FileSystemResponse error(String message) {
        return new FileSystemResponse(false, message, null);
    }
}
