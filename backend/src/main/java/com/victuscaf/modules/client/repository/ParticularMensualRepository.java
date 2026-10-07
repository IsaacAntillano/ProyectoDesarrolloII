package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.ParticularMensual;
import com.victuscaf.modules.client.models.EstadoMembresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParticularMensualRepository extends JpaRepository<ParticularMensual, Long> {

    Optional<ParticularMensual> findByNumeroDeDocumento(Long numeroDocumento);

    List<ParticularMensual> findByEstadoMembresia(EstadoMembresia estado);

    List<ParticularMensual> findByTieneEntrenadorTrue();
}