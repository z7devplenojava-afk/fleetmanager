package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("🔍 CustomUserDetailsService: Buscando usuário: " + username);

        String target = username != null ? username.trim() : "";
        User user = userRepository.findByUsername(target)
                .or(() -> userRepository.findByEmail(target))
                .orElseThrow(() -> {
                    System.out.println("❌ CustomUserDetailsService: Usuário não encontrado: " + username);
                    return new UsernameNotFoundException("Usuário não encontrado: " + username);
                });

        System.out.println("âœ… CustomUserDetailsService: UsuÃ¡rio encontrado: " + user.getUsername() + ", Ativo: "
                + user.isActive());
        System.out.println("ðŸ”‘ DEBUG HASH: " + user.getPassword());

        // Verificar roles antes de fazer stream (pode ser null)
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            System.out.println("ðŸ” CustomUserDetailsService: Roles: " + user.getRoles().stream()
                    .filter(role -> role != null)
                    .map(role -> role.getName())
                    .collect(Collectors.toList()));
        } else {
            System.out.println("âš ï¸ CustomUserDetailsService: UsuÃ¡rio nÃ£o possui roles cadastradas");
        }

        // Retornar o prÃ³prio User da aplicaÃ§Ã£o que implementa UserDetails
        return user;
    }
}
