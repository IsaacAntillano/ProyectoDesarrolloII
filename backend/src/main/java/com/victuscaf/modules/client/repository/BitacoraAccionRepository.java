package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.BitacoraAccion;
import com.victuscaf.modules.client.models.TipoAccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BitacoraAccionRepository extends JpaRepository<BitacoraAccion, Long> {

    List<BitacoraAccion> findByFechaBetweenOrderByFechaDescHoraDesc(LocalDate desde, LocalDate hasta);

    List<BitacoraAccion> findByTipoAccion(TipoAccion tipoAccion);
}