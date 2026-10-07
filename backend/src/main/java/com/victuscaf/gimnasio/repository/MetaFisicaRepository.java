package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.MetaFisica;
import com.victuscaf.gimnasio.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MetaFisicaRepository extends JpaRepository<MetaFisica, Long> {

    Optional<MetaFisica> findByUsuario(Usuario usuario);
}