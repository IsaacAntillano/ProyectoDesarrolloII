package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.HorarioEntrenador;
import com.victuscaf.modules.client.models.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface HorarioEntrenadorRepository extends JpaRepository<HorarioEntrenador, Long> {

    List<HorarioEntrenador> findByEntrenadorAndDisponibleTrue(Entrenador entrenador);

    List<HorarioEntrenador> findByEntrenador(Entrenador entrenador);

    List<HorarioEntrenador> findByFechaDisponibleAfterAndDisponibleTrue(LocalDate fecha);
}