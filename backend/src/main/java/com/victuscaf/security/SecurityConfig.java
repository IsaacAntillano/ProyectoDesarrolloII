package com.victuscaf.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuracion de seguridad del backend.
 *
 * <p>La autorizacion se basa en el rol que declara el cliente en el header
 * {@code X-Rol} (ver {@link RolHeaderFilter}). No hay token ni sesion: la vista
 * elige rol y lo manda en cada peticion.
 *
 * <p>Los {@code @PreAuthorize} de los controllers siguen siendo la unica fuente
 * de verdad sobre quien puede llamar a cada endpoint.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // habilita @PreAuthorize
public class SecurityConfig {

    private final RolHeaderFilter rolHeaderFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
            RolHeaderFilter rolHeaderFilter,
            @Value("${app.security.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        this.rolHeaderFilter = rolHeaderFilter;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    /**
     * Se conserva porque {@code UsuarioSistemaService} lo usa para hashear las
     * contrasenas al crear usuarios del sistema.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Todo lo demas exige que el filtro haya establecido un rol.
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rolHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Se permiten credenciales false: la autorizacion viaja en header, no en cookie.
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        return new UrlBasedCorsConfigurationSource() {
            {
                registerCorsConfiguration("/**", config);
            }
        };
    }
}