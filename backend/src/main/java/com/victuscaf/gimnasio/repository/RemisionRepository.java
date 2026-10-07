package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Remision;
import com.victuscaf.gimnasio.models.BeneficiarioEps;
import com.victuscaf.gimnasio.models.EstadoRemision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RemisionRepository extends JpaRepository<Remision, Long> {

    Optional<Remision> findByBeneficiario(BeneficiarioEps beneficiario);

    List<Remision> findByEstado(EstadoRemision estado);
}