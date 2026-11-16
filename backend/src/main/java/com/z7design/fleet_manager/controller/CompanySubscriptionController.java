package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Plan;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.PlanRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Assinatura da Empresa", description = "Endpoints para consulta do status da assinatura, limites do plano e regularização financeira")
public class CompanySubscriptionController {

    private final CompanyRepository companyRepository;
    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    @GetMapping("/my-subscription")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Consultar status da assinatura da empresa ativa")
    public ResponseEntity<?> getMySubscription() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User u && u.getCompanyId() != null) {
                companyId = u.getCompanyId();
            }
        }

        if (companyId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nenhuma empresa associada ao contexto ativo."));
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

        Plan plan = company.getPlan();
        long usersCount = userRepository.countByCompanyId(companyId);
        long vehiclesCount = vehicleRepository.countActiveByCompanyId(companyId);

        return ResponseEntity.ok(Map.of(
                "companyId", company.getId(),
                "companyName", company.getName(),
                "cnpj", company.getCnpj() != null ? company.getCnpj() : "",
                "subscriptionStatus", company.getSubscriptionStatus(),
                "dueDate", company.getDueDate() != null ? company.getDueDate().toString() : "",
                "gracePeriodDays", company.getGracePeriodDays() != null ? company.getGracePeriodDays() : 5,
                "isOverdue", company.isSubscriptionOverdue(),
                "plan", plan != null ? Map.of(
                        "id", plan.getId(),
                        "name", plan.getName(),
                        "priceCents", plan.getPriceCents(),
                        "billingCycle", plan.getBillingCycle(),
                        "features", plan.getFeatures()
                ) : Map.of("name", "Plano Padrão"),
                "usage", Map.of(
                        "activeUsers", usersCount,
                        "maxUsers", plan != null && plan.getMaxUsers() != null ? plan.getMaxUsers() : (company.getMaxUsers() != null ? company.getMaxUsers() : 50),
                        "activeVehicles", vehiclesCount,
                        "maxVehicles", plan != null && plan.getMaxVehicles() != null ? plan.getMaxVehicles() : 30
                )
        ));
    }

    @PostMapping("/subscription/change-plan")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FLEX_ADMIN', 'COMPANY_ADMIN', 'ADMIN')")
    @Operation(summary = "Alterar plano de assinatura da empresa")
    public ResponseEntity<?> changePlan(@RequestParam UUID companyId, @RequestParam UUID newPlanId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new RuntimeException("Plano não encontrado"));

        company.setPlan(newPlan);
        company.setMaxUsers(newPlan.getMaxUsers());
        companyRepository.save(company);

        log.info("💼 Empresa {} migrada para o plano {}", company.getName(), newPlan.getName());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Plano alterado com sucesso para " + newPlan.getName(),
                "planName", newPlan.getName()
        ));
    }
}
