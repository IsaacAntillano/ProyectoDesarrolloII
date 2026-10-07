package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByNumeroDeDocumento(Long numeroDocumento);

    boolean existsByNumeroDeDocumento(Long numeroDocumento);

    List<Usuario> findByEstadoTrue();

    List<Usuario> findByTipoDeCliente(TipoDeCliente tipoDeCliente);

    List<Usuario> findByEstadoTrueAndTipoDeCliente(TipoDeCliente tipoDeCliente);
}