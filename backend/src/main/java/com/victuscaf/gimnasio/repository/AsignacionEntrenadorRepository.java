package com.victuscaf.gimnasio.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.victuscaf.gimnasio.models.AsignacionEntrenador;
import com.victuscaf.gimnasio.models.Entrenador;
import com.victuscaf.gimnasio.models.Usuario;

@Repository
public interface AsignacionEntrenadorRepository extends JpaRepository<AsignacionEntrenador, Long> {

    Optional<AsignacionEntrenador> findByClienteAndActivaTrue(Usuario cliente);

    List<AsignacionEntrenador> findByEntrenadorAndActivaTrue(Entrenador entrenador);

    List<AsignacionEntrenador> findByActivaTrue();

    List<AsignacionEntrenador> findByActivaTrueAndFechaFinBefore(LocalDate fecha);

    long countByEntrenadorAndActivaTrue(Entrenador entrenador);
}
