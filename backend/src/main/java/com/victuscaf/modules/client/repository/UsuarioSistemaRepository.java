package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.UsuarioSistema;
import com.victuscaf.modules.client.models.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioSistemaRepository extends JpaRepository<UsuarioSistema, Long> {

    Optional<UsuarioSistema> findByNumeroDeDocumento(Long numeroDocumento);

    List<UsuarioSistema> findByRol(Rol rol);

    List<UsuarioSistema> findByEstadoTrue();

    boolean existsByNumeroDeDocumento(Long numeroDocumento);

    long countByRol(Rol rol);

    long countByRolAndEstado(Rol rol, Boolean estado);
}