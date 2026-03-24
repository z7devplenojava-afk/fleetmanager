package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.repository.RouteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class RouteCodeGenerator {

    private final RouteRepository routeRepository;

    public RouteCodeGenerator(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @Transactional(readOnly = true)
    public String generateCode(String routeName) {
        if (routeName == null || routeName.trim().isEmpty()) {
            throw new IllegalArgumentException("Route name cannot be empty");
        }

        String prefix = generatePrefix(routeName);
        long count = routeRepository.countByCodeStartingWith(prefix);
        long nextSequence = count + 1;

        return String.format("%s-%03d", prefix, nextSequence);
    }

    private String generatePrefix(String name) {
        // 1. Normalize (remove accents)
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        // 2. Split words and filter stopwords
        String[] words = normalized.toUpperCase().split("\\s+");
        String prefix = Arrays.stream(words)
                .filter(w -> w.length() > 2) // Ignore short words (de, da, do)
                .filter(w -> !w.matches("ROTA|ROUTE")) // Ignore common prefix words
                .limit(3) // Take up to 3 characteristic words
                .map(w -> w.substring(0, Math.min(w.length(), 3))) // Take first 3 chars of each
                .collect(Collectors.joining("-"));

        if (prefix.isEmpty()) {
            // Fallback if name is just "Rota 1" or similar
            prefix = "RT";
        } else {
            prefix = "RT-" + prefix;
        }

        return prefix;
    }
}
