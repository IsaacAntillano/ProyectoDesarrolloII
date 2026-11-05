package com.victuscaf.security;

import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utilitario de identidad.
 *
 * <p>La autenticación es exclusivamente por JWT ({@link JwtAuthFilter}), que
 * arma el principal como {@code "ROL:documento"}. Esta clase solo expone el
 * documento del usuario autenticado desde ese principal; no realiza ninguna
 * autenticación.
 */
public final class RolHeaderFilter {

    private RolHeaderFilter() {
        // Clase utilitaria: no instanciar.
    }

    /**
     * Documento del usuario autenticado, o {@code null} si no hay principal.
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