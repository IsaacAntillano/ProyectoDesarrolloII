package com.victuscaf.security;

import jakarta.validation.constraints.NotBlank;

/** Credenciales para iniciar sesion: documento y contraseña en claro. */
public record LoginRequest(
        @NotBlank String documento,
        @NotBlank String contrasena
) {}