package com.victuscaf.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.models.UsuarioSistema;
import com.victuscaf.gimnasio.repository.UsuarioRepository;
import com.victuscaf.gimnasio.repository.UsuarioSistemaRepository;

import lombok.RequiredArgsConstructor;

import com.victuscaf.gimnasio.dto.ClienteMensualDTO;
import com.victuscaf.gimnasio.service.ClienteService;

/**
 * Autentica por documento: primero busca en los usuarios del sistema
 * (admin/secretaria/entrenador), luego en los clientes (mensual/diario/EPS).
 * El token JWT lleva el mismo esquema de roles que el principal de seguridad.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ClienteService clienteService;

    public LoginResponse autenticar(LoginRequest credenciales) {
        String raw = credenciales.contrasena();
        Long doc = parsearDocumento(credenciales.documento());
        if (doc == null) {
            return LoginResponse.fallido("Documento invalido");
        }

        var sysUser = usuarioSistemaRepository.findByNumeroDeDocumento(doc);
        if (sysUser.isPresent()) {
            UsuarioSistema u = sysUser.get();
            if (!passwordEncoder.matches(raw, u.getContrasena())) {
                return LoginResponse.fallido("Credenciales invalidas");
            }
            if (u.getEstado() == null || !u.getEstado()) {
                return LoginResponse.fallido("Usuario inactivo. Contacte al administrador.");
            }
            String rol = u.getRol().name();
            return LoginResponse.ok(jwtTokenProvider.generarToken(String.valueOf(u.getNumeroDeDocumento()), rol, u.getNombreCompleto()),
                    rol, String.valueOf(u.getNumeroDeDocumento()), u.getNombreCompleto());
        }

        var cliente = usuarioRepository.findByNumeroDeDocumento(doc);
        if (cliente.isPresent()) {
            Usuario u = cliente.get();
            String hash = u.getContrasena();
            // Tolerante con datos cargados antes de que se guardara BCrypt en cliente:
            // si no es un hash BCrypt, exige igualdad directa para no romper el acceso.
            boolean ok = hash != null && (hash.startsWith("$2a$") || hash.startsWith("$2b$"))
                    ? passwordEncoder.matches(raw, hash)
                    : raw != null && raw.equals(hash);
            if (!ok) {
                return LoginResponse.fallido("Credenciales invalidas");
            }
            if (u.getEstado() == null || !u.getEstado()) {
                return LoginResponse.fallido("Usuario inactivo. Contacte a la secretaria.");
            }
            return LoginResponse.ok(jwtTokenProvider.generarToken(String.valueOf(u.getNumeroDeDocumento()), "CLIENTE", u.getNombreCompleto()),
                    "CLIENTE", String.valueOf(u.getNumeroDeDocumento()), u.getNombreCompleto());
        }

        return LoginResponse.fallido("Usuario no encontrado");
    }

    /**
     * Registro público de un particular mensual (CO-0001).
     *
     * <p>Reutiliza la misma lógica que la secretaría: crea el usuario, genera
     * el contrato con el tipo de membresía elegido y asigna el entrenador de
     * primer mes. Si el documento ya existe, lanza una RuntimeException que el
     * advice traduce a 400.
     */
    public void registrarClientePublico(ClienteMensualDTO dto) {
        clienteService.registrarParticularMensual(dto);
    }

    private Long parsearDocumento(String texto) {
        try {
            return Long.parseLong(texto.trim());
        } catch (Exception e) {
            return null;
        }
    }
}