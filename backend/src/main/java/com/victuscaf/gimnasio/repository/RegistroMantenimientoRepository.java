package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.RegistroMantenimiento;
import com.victuscaf.gimnasio.models.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RegistroMantenimientoRepository extends JpaRepository<RegistroMantenimiento, Long> {

    List<RegistroMantenimiento> findByEquipoOrderByFechaMantenimientoDesc(Equipo equipo);
}