package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.FlujoDeCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface FlujoDeCajaRepository extends JpaRepository<FlujoDeCaja, Long> {

    Optional<FlujoDeCaja> findByFecha(LocalDate fecha);
}