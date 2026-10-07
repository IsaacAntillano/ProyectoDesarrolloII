package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.BeneficiarioEps;
import com.victuscaf.modules.client.models.EstadoContratoEps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiarioEpsRepository extends JpaRepository<BeneficiarioEps, Long> {

    Optional<BeneficiarioEps> findByNumeroDeDocumento(Long numeroDocumento);

    List<BeneficiarioEps> findByEstadoContrato(EstadoContratoEps estado);

    List<BeneficiarioEps> findByTieneEntrenadorPermanenteTrue();
}