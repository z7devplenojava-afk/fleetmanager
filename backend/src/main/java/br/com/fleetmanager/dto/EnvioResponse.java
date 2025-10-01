package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvioResponse {
    
    private boolean sucesso;
    private String mensagem;
    private LocalDateTime dataEnvio;
    private String tipoEnvio;
    private int totalEnviados;
    private int totalFalhas;
    private List<DetalheEnvio> detalhes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetalheEnvio {
        private String funcionarioId;
        private String nome;
        private String cpf;
        private String email;
        private String telefone;
        private boolean enviado;
        private String erro;
    }
} 