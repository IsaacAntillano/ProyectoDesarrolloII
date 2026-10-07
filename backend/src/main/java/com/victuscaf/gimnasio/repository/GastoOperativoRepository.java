package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.GastoOperativo;
import com.victuscaf.gimnasio.models.TipoGasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface GastoOperativoRepository extends JpaRepository<GastoOperativo, Long> {

    List<GastoOperativo> findByFecha(LocalDate fecha);

    List<GastoOperativo> findByTipoGasto(TipoGasto tipoGasto);
}