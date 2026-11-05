package com.victuscaf.security;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.victuscaf.gimnasio.dto.ApiResponse;
import com.victuscaf.gimnasio.dto.ClienteMensualDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Punto de entrada publico: unico endpoint sin autenticacion. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Registro público de un particular mensual (CO-0001). Sin autenticación. */
    @PostMapping("/registro-cliente")
    public ResponseEntity<ApiResponse<Void>> registroCliente(@Valid @RequestBody ClienteMensualDTO dto) {
        authService.registrarClientePublico(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registro completado. Ya puedes iniciar sesión.", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest credenciales) {
        LoginResponse respuesta = authService.autenticar(credenciales);
        if (!respuesta.success()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(respuesta.message()));
        }
        return ResponseEntity.ok(ApiResponse.success(respuesta.message(), respuesta));
    }
}