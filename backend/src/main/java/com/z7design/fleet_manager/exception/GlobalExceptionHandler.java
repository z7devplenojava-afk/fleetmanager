package com.z7design.fleet_manager.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.apache.catalina.connector.ClientAbortException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        log.warn("Recurso nÃ£o encontrado: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex, WebRequest request) {
        log.warn("Erro de negÃ³cio: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("BUSINESS_ERROR")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(MethodArgumentNotValidException ex,
            WebRequest request) {
        log.error("AGGRESSIVE_DEBUG: Validation Error at {} - Message: {}", request.getDescription(false),
                ex.getMessage(), ex);

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });

        ValidationErrorResponse errorResponse = ValidationErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("Dados inválidos fornecidos: " + ex.getClass().getSimpleName())
                .path(request.getDescription(false).replace("uri=", ""))
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationErrorResponse> handleConstraintViolation(ConstraintViolationException ex,
            WebRequest request) {
        log.error("AGGRESSIVE_DEBUG: Constraint Violation at {} - Message: {}", request.getDescription(false),
                ex.getMessage(), ex);

        Map<String, String> fieldErrors = ex.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        ConstraintViolation::getMessage));

        ValidationErrorResponse errorResponse = ValidationErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("CONSTRAINT_VIOLATION")
                .message("Violação de restrições: " + ex.getClass().getSimpleName())
                .path(request.getDescription(false).replace("uri=", ""))
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        log.warn("Acesso negado: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error("ACCESS_DENIED")
                .message("Acesso negado. VocÃª nÃ£o tem permissÃ£o para realizar esta operaÃ§Ã£o.")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        log.error("AGGRESSIVE_DEBUG: Illegal Argument at {} - Message: {}", request.getDescription(false),
                ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("INVALID_ARGUMENT")
                .message(ex.getMessage() + " (" + ex.getClass().getSimpleName() + ")")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex,
            WebRequest request) {
        log.warn("ViolaÃ§Ã£o de integridade de dados: {}", ex.getMessage());

        String message = "Erro ao salvar dados. Verifique se os dados jÃ¡ existem (ex: username ou email jÃ¡ cadastrado).";

        // Tentar extrair uma mensagem mais especÃ­fica da exceÃ§Ã£o
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("username")
                    || ex.getMessage().contains("UK_") && ex.getMessage().contains("username")) {
                message = "Nome de usuÃ¡rio jÃ¡ estÃ¡ em uso";
            } else if (ex.getMessage().contains("email")
                    || ex.getMessage().contains("UK_") && ex.getMessage().contains("email")) {
                message = "Email jÃ¡ estÃ¡ em uso";
            }
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("DATA_INTEGRITY_VIOLATION")
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(ClientAbortException.class)
    public ResponseEntity<Void> handleClientAbortException(ClientAbortException ex, WebRequest request) {
        // ClientAbortException Ã© uma exceÃ§Ã£o normal quando o cliente cancela a
        // conexÃ£o
        // NÃ£o Ã© um erro real do servidor, entÃ£o apenas logamos em debug
        String path = request.getDescription(false);
        log.debug("Cliente cancelou a conexÃ£o para: {} - {}", path, ex.getMessage());

        // Retornar null para nÃ£o enviar resposta (a conexÃ£o jÃ¡ foi fechada)
        return null;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        // Ignorar ClientAbortException no handler genÃ©rico (jÃ¡ tratado acima)
        if (ex instanceof ClientAbortException ||
                (ex.getCause() != null && ex.getCause() instanceof ClientAbortException)) {
            return null;
        }

        log.error("Erro interno do servidor: {}", ex.getMessage(), ex);

        // Log especÃ­fico para debugging
        String requestPath = request.getDescription(false);
        if (requestPath.contains("/auth/login")) {
            log.error("ERRO NO LOGIN - Classe da exceÃ§Ã£o: {}", ex.getClass().getName());
            log.error("ERRO NO LOGIN - Stack trace completo: ", ex);
            if (ex.getCause() != null) {
                log.error("ERRO NO LOGIN - Causa raiz: {}", ex.getCause().getMessage());
            }
        } else if (requestPath.contains("/work-posts/all")) {
            log.error("ERRO NO WORK-POSTS/ALL - Classe da exceÃ§Ã£o: {}", ex.getClass().getName());
            log.error("ERRO NO WORK-POSTS/ALL - Mensagem: {}", ex.getMessage());
            log.error("ERRO NO WORK-POSTS/ALL - Stack trace completo: ", ex);
            if (ex.getCause() != null) {
                log.error("ERRO NO WORK-POSTS/ALL - Causa raiz: {}", ex.getCause().getMessage());
                if (ex.getCause().getCause() != null) {
                    log.error("ERRO NO WORK-POSTS/ALL - Causa da causa: {}", ex.getCause().getCause().getMessage());
                }
            }
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("Erro interno do servidor. Tente novamente mais tarde.")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    // ExceÃ§Ãµes especÃ­ficas do mÃ³dulo operacional
    @ExceptionHandler(EquipmentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEquipmentNotFound(EquipmentNotFoundException ex, WebRequest request) {
        log.warn("Equipamento nÃ£o encontrado: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("EQUIPMENT_NOT_FOUND")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(UnitNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUnitNotFound(UnitNotFoundException ex, WebRequest request) {
        log.warn("Unidade nÃ£o encontrada: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("UNIT_NOT_FOUND")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(WorkPostNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleWorkPostNotFound(WorkPostNotFoundException ex, WebRequest request) {
        log.warn("Posto de trabalho nÃ£o encontrado: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("WORK_POST_NOT_FOUND")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(EquipmentAlreadyAssignedException.class)
    public ResponseEntity<ErrorResponse> handleEquipmentAlreadyAssigned(EquipmentAlreadyAssignedException ex,
            WebRequest request) {
        log.warn("Equipamento jÃ¡ atribuÃ­do: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("EQUIPMENT_ALREADY_ASSIGNED")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(EquipmentExpiredException.class)
    public ResponseEntity<ErrorResponse> handleEquipmentExpired(EquipmentExpiredException ex, WebRequest request) {
        log.warn("Equipamento expirado: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("EQUIPMENT_EXPIRED")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}
