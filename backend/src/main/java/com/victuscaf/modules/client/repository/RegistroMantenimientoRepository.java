package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.RegistroMantenimiento;
import com.victuscaf.modules.client.models.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RegistroMantenimientoRepository extends JpaRepository<RegistroMantenimiento, Long> {

    List<RegistroMantenimiento> findByEquipoOrderByFechaMantenimientoDesc(Equipo equipo);
}