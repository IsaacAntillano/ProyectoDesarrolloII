package com.isaac.proyectodesarrollo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isaac.proyectodesarrollo.model.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    List<Usuario> findByUsernameContainingIgnoreCase(String username);
    List<Usuario> findByActivoTrue();
}