package com.z7design.fleet_manager.model;

/**
 * Tipo de backup
 */
public enum BackupType {
    FULL,         // Backup completo
    INCREMENTAL,  // Apenas mudanÃ§as desde Ãºltimo backup
    DIFFERENTIAL, // MudanÃ§as desde Ãºltimo full
    LOGS_ONLY     // Apenas logs (para CI)
}


