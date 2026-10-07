package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EntrenadorRepository extends JpaRepository<Entrenador, Long> {

    Optional<Entrenador> findByNumeroDeDocumento(Long numeroDocumento);

    List<Entrenador> findByEstadoTrue();

    List<Entrenador> findByCantidadClientesActivosLessThan(int maximo); // útil para asignar automático
}