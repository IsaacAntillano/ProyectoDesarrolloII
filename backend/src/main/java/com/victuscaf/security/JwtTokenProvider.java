package com.victuscaf.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

/**
 * Abstraccion sobre jjwt: emite y valida tokens JWT.
 *
 * <p>El sujeto del token es el numero de documento. Dos claims adicionales
 * llevan el rol y el nombre completo, asi el frontend puede preparar la UI sin
 * un endpoint extra de perfil.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwtSecret}") String secret,
            @Value("${app.jwtExpirationMs:86400000}") long expirationMs) {
        // HS512 exige una clave de al menos 64 bytes para ser valida.
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generarToken(String documento, String rol, String nombreCompleto) {
        Date ahora = new Date();
        return Jwts.builder()
                .setSubject(documento)
                .claim("rol", rol)
                .claim("nombreCompleto", nombreCompleto)
                .setIssuedAt(ahora)
                .setExpiration(new Date(ahora.getTime() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public Claims parsearToken(String token) {
        return Jwts.parser()
                .setSigningKey(key)
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean esValido(String token) {
        try {
            parsearToken(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}