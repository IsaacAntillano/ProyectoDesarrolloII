package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.ParticularDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParticularDiarioRepository extends JpaRepository<ParticularDiario, Long> {

    Optional<ParticularDiario> findByNumeroDeDocumento(Long numeroDocumento);

    List<ParticularDiario> findByFechaDeIngreso(LocalDate fecha);

    List<ParticularDiario> findByEstadoTrue();
}