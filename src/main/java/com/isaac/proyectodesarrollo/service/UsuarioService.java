package com.isaac.proyectodesarrollo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.isaac.proyectodesarrollo.model.entity.Usuario;
import com.isaac.proyectodesarrollo.model.enums.RolUsuario;
import com.isaac.proyectodesarrollo.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> listarActivos() {
        return usuarioRepository.findByActivoTrue();
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public List<Usuario> buscarPorUsername(String filtro) {
        return usuarioRepository.findByUsernameContainingIgnoreCase(filtro);
    }

    public Optional<Usuario> buscarPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public Usuario guardar(Usuario usuario) {
        if (usuario.getId() == null || !usuario.getPassword().startsWith("$2a$")) {
            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }
        return usuarioRepository.save(usuario);
    }

    public void desactivar(Long id) {
        usuarioRepository.findById(id).ifPresent(u -> {
            u.setActivo(false);
            usuarioRepository.save(u);
        });
    }

    public void reactivar(Long id) {
        usuarioRepository.findById(id).ifPresent(u -> {
            u.setActivo(true);
            usuarioRepository.save(u);
        });
    }

    public void eliminar(Long id) {
        usuarioRepository.deleteById(id);
    }

    public void crearAdminSiNoExiste() {
        if (usuarioRepository.findByUsername("admin").isEmpty()) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRol(RolUsuario.INGENIERO);
            admin.setActivo(true);
            usuarioRepository.save(admin);
        }
    }
}