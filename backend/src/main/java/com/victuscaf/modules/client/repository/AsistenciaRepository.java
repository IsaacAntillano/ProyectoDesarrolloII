package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.Asistencia;
import com.victuscaf.modules.client.models.Usuario;
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