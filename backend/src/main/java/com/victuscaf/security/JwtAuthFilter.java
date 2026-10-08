package com.victuscaf.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

/**
 * Reemplaza a RolHeaderFilter: valida el JWT del header Authorization y arma
 * el SecurityContext con el rol y el documento.
 *
 * <p>El principal queda como {@code "ROL:documento"} para que los controllers
 * sigan leyendo el documento con {@code RolHeaderFilter.documentoActual()} sin
 * cambios.
 *
 * <p>Sin token o token invalido, la peticion sigue sin autentiar y
 * {@code anyRequest().authenticated()} la rechaza con 403.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String header = request.getHeader("Authorization");
            if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
                try {
                    Claims claims = jwtTokenProvider.parsearToken(header.substring(7));
                    String rol = String.valueOf(claims.get("rol"));
                    String documento = claims.getSubject();
                    var auth = new UsernamePasswordAuthenticationToken(
                            rol + ":" + documento,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + rol)));
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (Exception e) {
                    log.warn("Token JWT invalido: {}", e.getMessage());
                }
            }
        }
        chain.doFilter(request, response);
    }
}