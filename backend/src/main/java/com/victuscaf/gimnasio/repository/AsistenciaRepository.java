package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Asistencia;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findByUsuario(Usuario usuario);

    List<Asistencia> findByUsuarioAndFechaIngresoBetween(Usuario usuario, LocalDate start, LocalDate end);

    long countByUsuarioAndFechaIngreso(Usuario usuario, LocalDate fecha);

    /** Asistencias de un tipo de cliente entre dos fechas (para la factura EPS). */
    List<Asistencia> findByUsuarioTipoDeClienteAndFechaIngresoBetween(
            TipoDeCliente tipoDeCliente, LocalDate start, LocalDate end);
}