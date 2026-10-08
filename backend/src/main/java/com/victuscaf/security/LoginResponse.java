package com.victuscaf.security;

/** Lo que devuelve el login: el token JWT y el contexto del usuario. */
public record LoginResponse(
        boolean success,
        String message,
        String token,
        String rol,
        String documento,
        String nombreCompleto
) {
    public static LoginResponse ok(String token, String rol, String documento, String nombreCompleto) {
        return new LoginResponse(true, "Sesion iniciada", token, rol, documento, nombreCompleto);
    }

    public static LoginResponse fallido(String mensaje) {
        return new LoginResponse(false, mensaje, null, null, null, null);
    }
}