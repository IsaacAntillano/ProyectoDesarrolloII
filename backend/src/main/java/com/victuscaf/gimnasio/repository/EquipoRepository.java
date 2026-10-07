package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Equipo;
import com.victuscaf.gimnasio.models.EstadoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    List<Equipo> findByEstadoEquipo(EstadoEquipo estado);

    List<Equipo> findByProximoMantenimientoBefore(LocalDate fecha);
}