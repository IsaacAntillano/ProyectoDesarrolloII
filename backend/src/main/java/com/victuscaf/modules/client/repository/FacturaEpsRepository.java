package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.FacturaEps;
import com.victuscaf.modules.client.models.EstadoFacturaEps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaEpsRepository extends JpaRepository<FacturaEps, Long> {

    Optional<FacturaEps> findByPeriodoConsolidado(String periodo);

    List<FacturaEps> findByEstado(EstadoFacturaEps estado);

    List<FacturaEps> findByEntidadEps(String entidadEps);
}