package com.victuscaf.gimnasio.exception;

import com.victuscaf.gimnasio.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduce excepciones a respuestas HTTP con el sobre {@link ApiResponse}.
 *
 * <p>El orden importa: los handlers de seguridad van primero y son mas
 * especificos que el de {@code RuntimeException}. Sin ellos, un
 * {@code AccessDeniedException} (403) o un {@code AuthenticationException}
 * (401) caerian en el handler generico y el cliente recibiria 400, perdiendo
 * la distincion entre "no autenticado" y "sin permisos".
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Rol autenticado pero sin permisos para el endpoint. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Acceso denegado: tu rol no tiene permisos para esta operacion"));
    }

    /** Sin credenciales, o credenciales invalidas. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("No autenticado: falta el header X-Rol o su valor no es valido"));
    }

    /** Fallo de validacion de un @Valid en el body o en los parametros. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Error de validacion: " + errors));
    }

    /** Entidad no encontrada. */
    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(jakarta.persistence.EntityNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Recurso no encontrado"));
    }

    /**
     * Cualquier otra RuntimeException. Los services lanzan RuntimeException a
     * proposito ("No hay flujo de caja para esa fecha"), asi que se traduce a
     * 400 con el mensaje original.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }
}