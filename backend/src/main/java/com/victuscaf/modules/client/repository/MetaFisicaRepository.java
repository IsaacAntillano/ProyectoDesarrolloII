package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.MetaFisica;
import com.victuscaf.modules.client.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MetaFisicaRepository extends JpaRepository<MetaFisica, Long> {

    Optional<MetaFisica> findByUsuario(Usuario usuario);
}