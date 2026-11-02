package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiliFluxChatRequest {

    @NotBlank(message = "A mensagem não pode ser vazia")
    @Size(max = 4000, message = "A mensagem excede o limite de 4000 caracteres")
    private String message;

    private String userName;

    @Size(max = 20, message = "Histórico muito longo")
    private List<ChatTurn> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatTurn {
        private String role;
        private String content;
    }
}
