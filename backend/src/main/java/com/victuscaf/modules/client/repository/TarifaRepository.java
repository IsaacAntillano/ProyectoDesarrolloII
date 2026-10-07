package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.Tarifa;
import com.victuscaf.modules.client.models.TipoDeCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TarifaRepository extends JpaRepository<Tarifa, Long> {

    Optional<Tarifa> findByTipoDeCliente(TipoDeCliente tipoDeCliente);
}