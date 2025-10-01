package br.com.fleetmanager.service;

import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.dto.AuthenticationRequest;
import br.com.fleetmanager.dto.AuthenticationResponse;
import br.com.fleetmanager.dto.RegisterRequest;
import br.com.fleetmanager.dto.RefreshTokenRequest;
import br.com.fleetmanager.dto.UserResponse;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.Role;
import br.com.fleetmanager.model.enums.UserRole;
import br.com.fleetmanager.model.enums.UserStatus;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.repository.RoleRepository;
import br.com.fleetmanager.security.JwtService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Override
    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        log.info("Starting user registration for username: {}", request.getUsername());
        
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Username already exists: {}", request.getUsername());
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Email already exists: {}", request.getEmail());
            throw new RuntimeException("Email already exists");
        }

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            log.warn("Full name is required for registration");
            throw new RuntimeException("Full name is required");
        }

        java.util.List<String> requestedRoles = request.getRoles();
        java.util.Set<Role> userRoles;
        if (requestedRoles != null && !requestedRoles.isEmpty()) {
            userRoles = new java.util.HashSet<>(roleRepository.findByNames(requestedRoles));
            if (userRoles.isEmpty()) {
                log.error("Nenhum dos roles informados foi encontrado: {}", requestedRoles);
                throw new RuntimeException("Nenhum dos roles informados foi encontrado: " + requestedRoles);
            }
        } else {
            Role defaultRole = roleRepository.findByName("COLABORADOR")
                .orElseThrow(() -> new RuntimeException("Role padrão COLABORADOR não encontrado"));
            userRoles = java.util.Set.of(defaultRole);
        }
        
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .name(request.getFullName().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(userRoles)
                .status(UserStatus.ACTIVE)
                .active(true)
                .build();

        log.info("Saving user: {}", user.getUsername());
        User savedUser = userRepository.save(user);
        log.info("User saved successfully with ID: {}", savedUser.getId());
        
        // Verify the user was actually saved
        User verifyUser = userRepository.findById(savedUser.getId()).orElse(null);
        if (verifyUser == null) {
            log.error("User was not persisted to database after save!");
            throw new RuntimeException("Failed to persist user to database");
        }
        log.info("User verified in database: {}", verifyUser.getUsername());

        String jwtToken = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);
        
        log.info("Registration completed successfully for user: {}", savedUser.getUsername());
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .username(savedUser.getUsername())
                        .email(savedUser.getEmail())
                        .fullName(savedUser.getName())
                        .roles(savedUser.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                        .build())
                .build();
    }

    @Override
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String jwtToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getName())
                        .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                        .build())
                .build();
    }

    @Override
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);

        if (username != null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(refreshToken, userDetails)) {
                User user = (User) userDetails; // Cast to your User model if necessary
                String accessToken = jwtService.generateToken(user);
                String newRefreshToken = jwtService.generateRefreshToken(user);

                return AuthenticationResponse.builder()
                        .token(accessToken)
                        .refreshToken(newRefreshToken)
                        .user(UserResponse.builder()
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .fullName(user.getName())
                                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                                .build())
                        .build();
            }
        }
        throw new RuntimeException("Invalid Refresh Token");
    }

    @Override
    public User getCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authentication found");
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}