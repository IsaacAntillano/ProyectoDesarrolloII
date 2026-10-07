package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Contrato;
import com.victuscaf.gimnasio.models.ParticularMensual;
import com.victuscaf.gimnasio.models.EstadoContratoParticular;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {

    Optional<Contrato> findByCliente(ParticularMensual cliente);

    List<Contrato> findByEstado(EstadoContratoParticular estado);

    List<Contrato> findByFechaVencimientoBefore(LocalDate fecha);
}