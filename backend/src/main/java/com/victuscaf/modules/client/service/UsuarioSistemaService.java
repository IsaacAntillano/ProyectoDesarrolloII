package com.victuscaf.modules.client.service;

import com.victuscaf.modules.client.dto.UsuarioSistemaRequestDTO;
import com.victuscaf.modules.client.models.*;
import com.victuscaf.modules.client.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioSistemaService {

    private static final int MAX_ADMINISTRADORES = 1;
    private static final int MAX_SECRETARIAS = 2;
    private static final int MAX_ENTRENADORES = 3;

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final AdministradorRepository administradorRepository;
    private final SecretariaRepository secretariaRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioSistema> listarTodos() {
        return usuarioSistemaRepository.findAll();
    }

    public UsuarioSistema buscarPorDocumento(Long numeroDocumento) {
        return usuarioSistemaRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Usuario del sistema no encontrado"));
    }

    @Transactional
    public UsuarioSistema crear(UsuarioSistemaRequestDTO dto) {
        if (dto.getContrasena() == null || dto.getContrasena().isBlank()) {
            throw new RuntimeException("La contraseña es obligatoria al crear un usuario");
        }
        validarTipoDocumento(dto.getTipoDeDocumento());
        if (usuarioSistemaRepository.existsByNumeroDeDocumento(dto.getNumeroDeDocumento())) {
            throw new RuntimeException("Ya existe un usuario con ese número de documento");
        }
        validarCupoRol(dto.getRol(), null);

        String encoded = passwordEncoder.encode(dto.getContrasena());
        return crearEntidad(dto, encoded);
    }

    @Transactional
    public UsuarioSistema actualizar(Long id, UsuarioSistemaRequestDTO dto) {
        UsuarioSistema existente = usuarioSistemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (dto.getRol() != null && dto.getRol() != existente.getRol()) {
            throw new RuntimeException("No se permite cambiar el rol de un usuario existente");
        }
        validarTipoDocumento(dto.getTipoDeDocumento());
        existente.setTipoDeDocumento(dto.getTipoDeDocumento());
        existente.setNombreCompleto(dto.getNombreCompleto());
        existente.setTelefono(dto.getTelefono());
        existente.setCorreoElectronico(dto.getCorreoElectronico());
        if (dto.getContrasena() != null && !dto.getContrasena().isBlank()) {
            existente.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        }
        return usuarioSistemaRepository.save(existente);
    }

    @Transactional
    public void desactivar(Long id) {
        UsuarioSistema usuario = usuarioSistemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (usuario.getRol() == Rol.ADMINISTRADOR) {
            throw new RuntimeException("No se puede desactivar al administrador del sistema");
        }
        usuario.setEstado(false);
        usuarioSistemaRepository.save(usuario);
    }

    @Transactional
    public UsuarioSistema reactivar(Long id) {
        UsuarioSistema usuario = usuarioSistemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        validarCupoRol(usuario.getRol(), id);
        usuario.setEstado(true);
        return usuarioSistemaRepository.save(usuario);
    }

    private void validarTipoDocumento(String tipo) {
        if (!List.of("CC", "TI", "CE").contains(tipo)) {
            throw new RuntimeException("Tipo de documento inválido. Use CC, TI o CE");
        }
    }

    private void validarCupoRol(Rol rol, Long idExcluir) {
        long count;
        int max;
        switch (rol) {
            case ADMINISTRADOR -> {
                max = MAX_ADMINISTRADORES;
                count = usuarioSistemaRepository.countByRol(rol);
            }
            case SECRETARIA -> {
                max = MAX_SECRETARIAS;
                count = usuarioSistemaRepository.countByRolAndEstado(rol, true);
            }
            case ENTRENADOR -> {
                max = MAX_ENTRENADORES;
                count = usuarioSistemaRepository.countByRolAndEstado(rol, true);
            }
            default -> throw new RuntimeException("Rol no válido");
        }
        if (idExcluir != null) {
            UsuarioSistema actual = usuarioSistemaRepository.findById(idExcluir).orElse(null);
            if (actual != null && actual.getRol() == rol && Boolean.TRUE.equals(actual.getEstado())) {
                count = Math.max(0, count - 1);
            }
        }
        if (count >= max) {
            throw new RuntimeException(switch (rol) {
                case ADMINISTRADOR -> "Solo se permite un administrador en el sistema";
                case SECRETARIA -> "Cupo de secretarias completado (máximo " + max + ")";
                case ENTRENADOR -> "Cupo de entrenadores completado (máximo " + max + ")";
                default -> "Cupo de rol completado";
            });
        }
    }

    private UsuarioSistema crearEntidad(UsuarioSistemaRequestDTO dto, String encoded) {
        return switch (dto.getRol()) {
            case ADMINISTRADOR -> {
                Administrador a = new Administrador();
                copiarCampos(a, dto, encoded);
                yield administradorRepository.save(a);
            }
            case SECRETARIA -> {
                Secretaria s = new Secretaria();
                copiarCampos(s, dto, encoded);
                s.setTurno(Turno.MANANA);
                yield secretariaRepository.save(s);
            }
            case ENTRENADOR -> {
                Entrenador e = new Entrenador();
                copiarCampos(e, dto, encoded);
                e.setEspecialidad("General");
                e.setSalario(0);
                e.setCantidadClientesActivos(0);
                yield entrenadorRepository.save(e);
            }
        };
    }

    private void copiarCampos(UsuarioSistema u, UsuarioSistemaRequestDTO dto, String encoded) {
        u.setTipoDeDocumento(dto.getTipoDeDocumento());
        u.setNumeroDeDocumento(dto.getNumeroDeDocumento());
        u.setNombreCompleto(dto.getNombreCompleto());
        u.setTelefono(dto.getTelefono());
        u.setCorreoElectronico(dto.getCorreoElectronico());
        u.setContrasena(encoded);
        u.setRol(dto.getRol());
        u.setEstado(true);
    }
}
