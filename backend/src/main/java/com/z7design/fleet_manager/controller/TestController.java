package com.z7design.fleet_manager.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @GetMapping("/simple")
    public String simpleTest() {
        return "Backend funcionando!";
    }
    
    @GetMapping("/json")
    public Object jsonTest() {
        return java.util.Map.of(
            "status", "ok",
            "message", "API funcionando",
            "timestamp", java.time.LocalDateTime.now()
        );
    }
}
