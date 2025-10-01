package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.JobCandidateService;
import br.com.fleetmanager.service.RecaptchaService;
import br.com.fleetmanager.service.SecurityMonitoringService;

import br.com.fleetmanager.dto.JobCandidateDTO;
import br.com.fleetmanager.model.enums.CandidateStatus;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class JobCandidateController {
    
    private static final Logger log = LoggerFactory.getLogger(JobCandidateController.class);
    
    @Autowired
    private JobCandidateService jobCandidateService;
    
    @Autowired
    private RecaptchaService recaptchaService;
    
    @Autowired
    private SecurityMonitoringService securityMonitoringService;
    
    // Rate limiting por IP
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    
    private Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, this::newBucket);
    }
    
    private Bucket newBucket(String key) {
        // Limite: 3 candidaturas por hora por IP
        Bandwidth limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofHours(1)));
        return Bucket.builder().addLimit(limit).build();
    }
    
    // ===== ENDPOINTS PÚBLICOS =====
    
    // Cadastrar candidato (público) - COM PROTEÇÕES DE SEGURANÇA
    @PostMapping("/candidates")
    @CrossOrigin(origins = "*", allowedHeaders = "*") // Permitir CORS para endpoint público
    public ResponseEntity<?> createCandidate(
            @RequestPart("candidate") @Valid JobCandidateDTO candidateDTO,
            @RequestPart(value = "curriculum", required = false) MultipartFile curriculumFile,
            @RequestParam(value = "captchaToken", required = false) String captchaToken) {
        
        // Rate limiting
        String clientIp = getClientIp();
        Bucket bucket = resolveBucket(clientIp);
        
        if (!bucket.tryConsume(1)) {
            log.warn("🚫 Rate limit excedido para IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Limite de candidaturas excedido. Tente novamente em 1 hora."));
        }
        
        // Validação de captcha
        if (captchaToken == null || captchaToken.isEmpty()) {
            // Em desenvolvimento, aceitar sem captcha
            log.warn("⚠️ Tentativa sem captcha do IP: {} (aceita em desenvolvimento)", clientIp);
            // Comentar temporariamente para desenvolvimento
            // return ResponseEntity.badRequest()
            //         .body(Map.of("error", "Verificação de segurança obrigatória"));
        }
        
        // Validar token do reCAPTCHA
        if (captchaToken != null && !captchaToken.isEmpty() && !recaptchaService.verifyToken(captchaToken, clientIp)) {
            log.warn("🚫 Captcha inválido do IP: {}", clientIp);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Falha na verificação de segurança. Tente novamente."));
        }
        
        // Sanitização e validação de dados
        candidateDTO = sanitizeCandidateData(candidateDTO);
        
        // Validação adicional de dados sensíveis
        if (!isValidCpf(candidateDTO.getCpf())) {
            log.warn("🚫 CPF inválido do IP: {} - CPF: {}", clientIp, maskCpf(candidateDTO.getCpf()));
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "CPF inválido"));
        }
        
        if (!isValidEmail(candidateDTO.getEmail())) {
            log.warn("🚫 Email inválido do IP: {} - Email: {}", clientIp, maskEmail(candidateDTO.getEmail()));
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email inválido"));
        }
        
        // Validação de telefone
        if (!isValidPhone(candidateDTO.getPhone())) {
            log.warn("🚫 Telefone inválido do IP: {} - Telefone: {}", clientIp, maskPhone(candidateDTO.getPhone()));
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Telefone inválido"));
        }
        
        // Validação CNH
        if (Boolean.TRUE.equals(candidateDTO.getRequiresCnh()) && (candidateDTO.getCnhCategory() == null || candidateDTO.getCnhCategory().trim().isEmpty())) {
            log.warn("🚫 CNH sem categoria do IP: {}", clientIp);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Se o candidato possui CNH, a categoria da CNH é obrigatória."));
        }
        
        // Validação de arquivo de currículo
        if (curriculumFile != null && !curriculumFile.isEmpty()) {
            if (!isValidCurriculumFile(curriculumFile)) {
                log.warn("🚫 Arquivo de currículo inválido do IP: {} - Nome: {}, Tamanho: {}", 
                    clientIp, curriculumFile.getOriginalFilename(), curriculumFile.getSize());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo de currículo inválido. Aceite apenas PDF e DOC/DOCX até 5MB."));
            }
        }
        
        // Verificar se já existe candidato com mesmo CPF ou email
        if (jobCandidateService.existsByCpfOrEmail(candidateDTO.getCpf(), candidateDTO.getEmail())) {
            log.warn("🚫 Candidatura duplicada do IP: {} - CPF: {}, Email: {}", 
                clientIp, maskCpf(candidateDTO.getCpf()), maskEmail(candidateDTO.getEmail()));
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Já existe uma candidatura com este CPF ou email"));
        }
        
        // Detecção de tentativas suspeitas
        if (isSuspiciousAttempt(candidateDTO, clientIp)) {
            log.error("🚨 Tentativa suspeita detectada do IP: {} - Dados: {}", clientIp, getSuspiciousData(candidateDTO));
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Dados inválidos detectados. Verifique as informações e tente novamente."));
        }
        
        // Verificação de segurança avançada
        String candidateDataString = convertCandidateToString(candidateDTO);
        SecurityMonitoringService.SecurityCheckResult securityResult = 
            securityMonitoringService.checkAttempt(clientIp, candidateDataString);
        
        if (!securityResult.isAllowed()) {
            log.error("🚨 Verificação de segurança falhou para IP: {} - Motivo: {}", clientIp, securityResult.getReason());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Acesso negado por questões de segurança. Tente novamente mais tarde."));
        }
        
        try {
            log.info("✅ Candidatura válida recebida do IP: {} - Nome: {}, Email: {}", 
                clientIp, candidateDTO.getName(), maskEmail(candidateDTO.getEmail()));
            
            JobCandidateDTO createdCandidate = jobCandidateService.createCandidate(candidateDTO, curriculumFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Candidatura enviada com sucesso! Você receberá um email de confirmação.",
                    "candidateId", createdCandidate.getId()
            ));
        } catch (Exception e) {
            log.error("❌ Erro ao processar candidatura do IP: {} - Erro: {}", clientIp, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao processar candidatura. Tente novamente."));
        }
    }
    
    // ===== ENDPOINTS ADMINISTRATIVOS =====
    
    // Listar todos os candidatos
    @GetMapping("/hr/candidates")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<List<JobCandidateDTO>> getAllCandidates() {
        List<JobCandidateDTO> candidates = jobCandidateService.getAllCandidates();
        return ResponseEntity.ok(candidates);
    }
    
    // Buscar candidatos por vaga
    @GetMapping("/hr/vacancies/{vacancyId}/candidates")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<List<JobCandidateDTO>> getCandidatesByVacancy(@PathVariable UUID vacancyId) {
        List<JobCandidateDTO> candidates = jobCandidateService.getCandidatesByVacancy(vacancyId);
        return ResponseEntity.ok(candidates);
    }
    
    // Buscar candidatos por status
    @GetMapping("/hr/candidates/status/{status}")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<List<JobCandidateDTO>> getCandidatesByStatus(@PathVariable CandidateStatus status) {
        List<JobCandidateDTO> candidates = jobCandidateService.getCandidatesByStatus(status);
        return ResponseEntity.ok(candidates);
    }
    
    // Buscar candidato por ID
    @GetMapping("/hr/candidates/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> getCandidateById(@PathVariable UUID id) {
        JobCandidateDTO candidate = jobCandidateService.getCandidateById(id);
        return ResponseEntity.ok(candidate);
    }
    
    // Atualizar candidato
    @PutMapping("/hr/candidates/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> updateCandidate(
            @PathVariable UUID id,
            @RequestBody @Valid JobCandidateDTO candidateDTO) {
        
        JobCandidateDTO updatedCandidate = jobCandidateService.updateCandidate(id, candidateDTO);
        return ResponseEntity.ok(updatedCandidate);
    }
    
    // Atualizar status do candidato
    @PatchMapping("/hr/candidates/{id}/status")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> updateCandidateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        
        CandidateStatus status = CandidateStatus.valueOf(request.get("status").toString());
        String notes = (String) request.get("notes");
        
        JobCandidateDTO updatedCandidate = jobCandidateService.updateCandidateStatus(id, status, notes);
        return ResponseEntity.ok(updatedCandidate);
    }
    
    // Aprovar candidato
    @PostMapping("/hr/candidates/{id}/approve")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> approveCandidate(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> request) {
        
        String notes = request != null ? request.get("notes") : null;
        JobCandidateDTO updatedCandidate = jobCandidateService.updateCandidateStatus(id, CandidateStatus.APPROVED, notes);
        return ResponseEntity.ok(updatedCandidate);
    }
    
    // Reprovar candidato
    @PostMapping("/hr/candidates/{id}/reject")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> rejectCandidate(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> request) {
        
        String notes = request != null ? request.get("notes") : null;
        JobCandidateDTO updatedCandidate = jobCandidateService.updateCandidateStatus(id, CandidateStatus.REJECTED, notes);
        return ResponseEntity.ok(updatedCandidate);
    }
    
    // Marcar como entrevistado
    @PostMapping("/hr/candidates/{id}/interview")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> markAsInterviewed(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> request) {
        
        String notes = request != null ? request.get("notes") : null;
        JobCandidateDTO updatedCandidate = jobCandidateService.updateCandidateStatus(id, CandidateStatus.INTERVIEWED, notes);
        return ResponseEntity.ok(updatedCandidate);
    }
    
    // Contratar candidato
    @PostMapping("/hr/candidates/{id}/hire")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<JobCandidateDTO> hireCandidate(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> request) {
        
        String notes = request != null ? request.get("notes") : null;
        JobCandidateDTO updatedCandidate = jobCandidateService.updateCandidateStatus(id, CandidateStatus.HIRED, notes);
        return ResponseEntity.ok(updatedCandidate);
    }
    
    // Download do currículo
    @GetMapping("/hr/candidates/{id}/curriculum")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<Resource> downloadCurriculum(@PathVariable UUID id, HttpServletResponse response) {
        try {
            Resource resource = jobCandidateService.downloadCurriculum(id);
            
            // Configurar headers para download
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"curriculum.pdf\"");
            response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"curriculum.pdf\"")
                    .body(resource);
                    
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Excluir candidato
    @DeleteMapping("/hr/candidates/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEES_DELETE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCandidate(@PathVariable UUID id) {
        jobCandidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }
    
    // Estatísticas de candidatos
    @GetMapping("/hr/candidates/stats")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> getCandidateStats() {
        long totalCandidates = jobCandidateService.getCandidatesCount();
        long pendingCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.PENDING);
        long approvedCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.APPROVED);
        long rejectedCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.REJECTED);
        long interviewedCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.INTERVIEWED);
        long hiredCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.HIRED);
        
        Map<String, Object> stats = Map.of(
                "total", totalCandidates,
                "pending", pendingCandidates,
                "approved", approvedCandidates,
                "rejected", rejectedCandidates,
                "interviewed", interviewedCandidates,
                "hired", hiredCandidates
        );
        
        return ResponseEntity.ok(stats);
    }
    
    // Estatísticas de candidatos por vaga
    @GetMapping("/hr/vacancies/{vacancyId}/candidates/stats")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> getCandidateStatsByVacancy(@PathVariable UUID vacancyId) {
        long totalCandidates = jobCandidateService.getCandidatesCountByVacancy(vacancyId);
        long pendingCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.PENDING);
        long approvedCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.APPROVED);
        long rejectedCandidates = jobCandidateService.getCandidatesCountByStatus(CandidateStatus.REJECTED);
        
        Map<String, Object> stats = Map.of(
                "total", totalCandidates,
                "pending", pendingCandidates,
                "approved", approvedCandidates,
                "rejected", rejectedCandidates
        );
        
        return ResponseEntity.ok(stats);
    }
    
    // Estatísticas de segurança do endpoint público
    @GetMapping("/hr/security/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSecurityStats() {
        Map<String, Object> securityStats = securityMonitoringService.getSecurityStats();
        return ResponseEntity.ok(securityStats);
    }
    
    // ===== MÉTODOS AUXILIARES DE SEGURANÇA =====
    
    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            String xForwardedFor = attributes.getRequest().getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return attributes.getRequest().getRemoteAddr();
        }
        return "unknown";
    }
    
    private boolean isValidCpf(String cpf) {
        if (cpf == null || cpf.isEmpty()) return false;
        
        // Remove caracteres não numéricos
        String numbers = cpf.replaceAll("[^0-9]", "");
        if (numbers.length() != 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (numbers.matches("(\\d)\\1{10}")) return false;
        
        // Validação dos dígitos verificadores
        try {
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += Character.getNumericValue(numbers.charAt(i)) * (10 - i);
            }
            int remainder = sum % 11;
            int digit1 = remainder < 2 ? 0 : 11 - remainder;
            
            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += Character.getNumericValue(numbers.charAt(i)) * (11 - i);
            }
            remainder = sum % 11;
            int digit2 = remainder < 2 ? 0 : 11 - remainder;
            
            return Character.getNumericValue(numbers.charAt(9)) == digit1 &&
                   Character.getNumericValue(numbers.charAt(10)) == digit2;
        } catch (Exception e) {
            return false;
        }
    }
    
    private boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) return false;
        
        // Regex básica para validação de email
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        return email.matches(emailRegex);
    }

    private boolean isValidPhone(String phone) {
        if (phone == null || phone.isEmpty()) return true; // Telefone é opcional
        
        // Remove caracteres não numéricos
        String numbers = phone.replaceAll("[^0-9]", "");
        
        // Aceita telefones com 10 ou 11 dígitos (com ou sem DDD)
        if (numbers.length() < 10 || numbers.length() > 11) return false;
        
        // Se tem 11 dígitos, o primeiro deve ser 9 (celular)
        if (numbers.length() == 11 && numbers.charAt(2) != '9') return false;
        
        return true;
    }

    private boolean isValidCurriculumFile(MultipartFile file) {
        String contentType = file.getContentType();
        long size = file.getSize();

        if (contentType == null || !contentType.startsWith("application/pdf") && !contentType.startsWith("application/msword") && !contentType.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
            return false;
        }

        if (size > 5 * 1024 * 1024) { // 5MB
            return false;
        }
        return true;
    }

    private JobCandidateDTO sanitizeCandidateData(JobCandidateDTO candidateDTO) {
        if (candidateDTO.getName() != null) {
            candidateDTO.setName(candidateDTO.getName().trim());
        }
        if (candidateDTO.getCpf() != null) {
            candidateDTO.setCpf(candidateDTO.getCpf().replaceAll("[^0-9]", ""));
        }
        if (candidateDTO.getEmail() != null) {
            candidateDTO.setEmail(candidateDTO.getEmail().trim().toLowerCase());
        }
        if (candidateDTO.getPhone() != null) {
            candidateDTO.setPhone(candidateDTO.getPhone().replaceAll("[^0-9]", ""));
        }
        return candidateDTO;
    }

    private String maskCpf(String cpf) {
        if (cpf == null || cpf.length() < 11) return cpf;
        return cpf.substring(0, 3) + "***" + cpf.substring(9);
    }

    private String maskEmail(String email) {
        if (email == null || email.length() < 6) return email;
        int atIndex = email.indexOf("@");
        if (atIndex < 1) return email;
        return email.substring(0, 1) + "***" + email.substring(atIndex - 1);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 14) return phone;
        return phone.substring(0, 5) + "***" + phone.substring(10);
    }

    private boolean isSuspiciousAttempt(JobCandidateDTO candidateDTO, String clientIp) {
        // Exemplo de lógica de detecção de tentativas suspeitas
        // Pode incluir validações de frequência, padrões de caracteres, etc.
        // Aqui, apenas um exemplo simples:
        if (candidateDTO.getName() != null && candidateDTO.getName().length() > 50) {
            return true;
        }
        if (candidateDTO.getEmail() != null && candidateDTO.getEmail().length() > 100) {
            return true;
        }
        if (candidateDTO.getPhone() != null && candidateDTO.getPhone().length() > 20) {
            return true;
        }
        return false;
    }

    private Map<String, Object> getSuspiciousData(JobCandidateDTO candidateDTO) {
        Map<String, Object> suspiciousData = new ConcurrentHashMap<>();
        if (candidateDTO.getName() != null) {
            suspiciousData.put("name", candidateDTO.getName());
        }
        if (candidateDTO.getEmail() != null) {
            suspiciousData.put("email", candidateDTO.getEmail());
        }
        if (candidateDTO.getPhone() != null) {
            suspiciousData.put("phone", candidateDTO.getPhone());
        }
        return suspiciousData;
    }
    
    private String convertCandidateToString(JobCandidateDTO candidateDTO) {
        StringBuilder sb = new StringBuilder();
        if (candidateDTO.getName() != null) sb.append(candidateDTO.getName()).append(" ");
        if (candidateDTO.getEmail() != null) sb.append(candidateDTO.getEmail()).append(" ");
        if (candidateDTO.getPhone() != null) sb.append(candidateDTO.getPhone()).append(" ");
        if (candidateDTO.getCpf() != null) sb.append(candidateDTO.getCpf()).append(" ");
        if (candidateDTO.getAddress() != null) sb.append(candidateDTO.getAddress()).append(" ");
        if (candidateDTO.getCity() != null) sb.append(candidateDTO.getCity()).append(" ");
        if (candidateDTO.getState() != null) sb.append(candidateDTO.getState()).append(" ");
        if (candidateDTO.getEducationLevel() != null) sb.append(candidateDTO.getEducationLevel()).append(" ");
        if (candidateDTO.getExperienceYears() != null) sb.append(candidateDTO.getExperienceYears()).append(" ");
        if (candidateDTO.getCurrentPosition() != null) sb.append(candidateDTO.getCurrentPosition()).append(" ");
        if (candidateDTO.getCurrentCompany() != null) sb.append(candidateDTO.getCurrentCompany()).append(" ");
        if (candidateDTO.getAvailability() != null) sb.append(candidateDTO.getAvailability()).append(" ");
        if (candidateDTO.getCnhCategory() != null) sb.append(candidateDTO.getCnhCategory()).append(" ");
        if (candidateDTO.getNotes() != null) sb.append(candidateDTO.getNotes()).append(" ");
        return sb.toString();
    }
} 