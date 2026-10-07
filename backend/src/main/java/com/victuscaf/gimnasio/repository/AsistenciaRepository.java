package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Asistencia;
import com.victuscaf.gimnasio.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findByUsuario(Usuario usuario);

    List<Asistencia> findByUsuarioAndFechaIngresoBetween(Usuario usuario, LocalDate start, LocalDate end);

    long countByUsuarioAndFechaIngreso(Usuario usuario, LocalDate fecha);
}