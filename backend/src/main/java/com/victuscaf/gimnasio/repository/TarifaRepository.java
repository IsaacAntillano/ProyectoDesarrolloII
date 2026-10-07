package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Tarifa;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TarifaRepository extends JpaRepository<Tarifa, Long> {

    Optional<Tarifa> findByTipoDeCliente(TipoDeCliente tipoDeCliente);
}