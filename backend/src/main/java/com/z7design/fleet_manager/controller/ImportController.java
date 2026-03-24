package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.service.ImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/funcionarios")
@RequiredArgsConstructor
@Slf4j
public class ImportController {

    private final ImportService importService;

    @PostMapping("/import")
    public ResponseEntity<ImportResultDto> importEmployees(@RequestParam("file") MultipartFile file) {
        log.info("ðŸ“¥ ImportaÃ§Ã£o de funcionÃ¡rios - arquivo recebido: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
        if (file == null || file.isEmpty()) {
            log.warn("Arquivo de importaÃ§Ã£o ausente ou vazio");
            return ResponseEntity.badRequest().body(ImportResultDto.builder()
                    .totalRows(0)
                    .inserted(0)
                    .updated(0)
                    .skipped(0)
                    .errors(java.util.List.of("Arquivo nÃ£o enviado ou vazio. Envie um PDF contendo CPFs e WhatsApps"))
                    .build());
        }
        ImportResultDto result = importService.importPdf(file);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/import-banking")
    public ResponseEntity<ImportResultDto> importBankingData(@RequestParam("file") MultipartFile file) {
        log.info("ðŸ’° ImportaÃ§Ã£o de dados bancÃ¡rios - arquivo recebido: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
        if (file == null || file.isEmpty()) {
            log.warn("Arquivo de importaÃ§Ã£o bancÃ¡ria ausente ou vazio");
            return ResponseEntity.badRequest().body(ImportResultDto.builder()
                    .totalRows(0)
                    .inserted(0)
                    .updated(0)
                    .skipped(0)
                    .errors(java.util.List.of("Arquivo nÃ£o enviado ou vazio. Envie um arquivo CSV ou Excel com: nome, agencia, contaCorrente"))
                    .build());
        }
        ImportResultDto result = importService.importBankingData(file);
        return ResponseEntity.ok(result);
    }
}



