package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.Secretaria;
import com.victuscaf.modules.client.models.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SecretariaRepository extends JpaRepository<Secretaria, Long> {

    Optional<Secretaria> findByNumeroDeDocumento(Long numeroDocumento);

    List<Secretaria> findByTurno(Turno turno);
}