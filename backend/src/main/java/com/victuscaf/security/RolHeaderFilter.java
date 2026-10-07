package com.victuscaf.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Construye el contexto de seguridad a partir del header de rol.
 *
 * <p>La vista ({@code frontend/}) no maneja token: elige rol en
 * {@code SeleccionarRol.tsx}, lo guarda en {@code localStorage['user']} y lo
 * manda en cada peticion. Este filtro lee ese header y fabrica authorities
 * {@code ROLE_<rol>}, de modo que los {@code @PreAuthorize} existentes sigan
 * funcionando sin cambios.
 *
 * <p><b>Esto no es autenticacion.</b> No hay prueba de identidad: cualquiera que
 * alcance el puerto 8080 puede declarar {@code X-Rol: ADMINISTRADOR} y obtener
 * permisos de administrador. Sirve para desarrollo local, no para exposicion en
 * red. Ver README.md, seccion "Autorizacion por header".
 */
@Component
public class RolHeaderFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RolHeaderFilter.class);

    private final String headerName;
    private final String headerDocumento;
    private final List<String> rolesPermitidos;

    public RolHeaderFilter(
            @Value("${app.security.header-rol:X-Rol}") String headerName,
            @Value("${app.security.header-documento:X-Documento}") String headerDocumento,
            @Value("${app.security.roles-permitidos:ADMINISTRADOR,SECRETARIA,ENTRENADOR,CLIENTE}") String rolesPermitidos) {
        this.headerName = headerName;
        this.headerDocumento = headerDocumento;
        this.rolesPermitidos = Arrays.stream(rolesPermitidos.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toUpperCase)
                .collect(Collectors.toUnmodifiableList());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // No sobreescribir una autenticacion ya establecida (por ejemplo, tests).
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            autenticarPorHeader(request);
        }
        filterChain.doFilter(request, response);
    }

    private void autenticarPorHeader(HttpServletRequest request) {
        String rol = request.getHeader(headerName);
        if (!StringUtils.hasText(rol)) {
            return; // sin header: la peticion queda sin autenticar -> 401
        }

        String rolNormalizado = rol.trim().toUpperCase();
        if (!rolesPermitidos.contains(rolNormalizado)) {
            logger.warn("Rol '{}' recibido en {} {} no esta permitido; se ignora.",
                    rolNormalizado, request.getMethod(), request.getRequestURI());
            return;
        }

        // Principal: si viene documento, se usa como identidad (por ejemplo
        // "ENTRENADOR:100000003"); si no, el rol a secas. Los services que
        // necesitan saber quien llama leen el principal.
        String principal = rolNormalizado;
        String documento = request.getHeader(headerDocumento);
        if (StringUtils.hasText(documento) && !"0".equals(documento.trim())) {
            principal = rolNormalizado + ":" + documento.trim();
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + rolNormalizado)));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    /**
     * Documento del usuario autenticado, o {@code null} si no se envio.
     * La vista lo manda en {@code X-Documento}.
     */
    public static String documentoActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        String principal = auth.getPrincipal().toString();
        int sep = principal.indexOf(':');
        return sep > 0 ? principal.substring(sep + 1) : null;
    }
}