package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.BiliFluxChatRequest;
import com.z7design.fleet_manager.dto.BiliFluxChatResponse;
import com.z7design.fleet_manager.service.BiliFluxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/v1/biliflux")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"},
        allowedHeaders = "*",
        methods = {RequestMethod.POST, RequestMethod.GET, RequestMethod.OPTIONS})
public class BiliFluxController {

    private final BiliFluxService bilifluxService;

    @PostMapping("/chat")
    public Mono<ResponseEntity<BiliFluxChatResponse>> chat(
            @Valid @RequestBody BiliFluxChatRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        log.debug("BiliFlux: chat solicitado por {}", username);
        return bilifluxService.chat(request)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/health")
    public ResponseEntity<BiliFluxChatResponse> health() {
        boolean ai = bilifluxService.isAiEnabled();
        return ResponseEntity.ok(BiliFluxChatResponse.builder()
                .reply(ai ? "IA disponível" : "IA indisponível — usando base local")
                .source(ai ? "ai" : "fallback")
                .aiAvailable(ai)
                .build());
    }
}
