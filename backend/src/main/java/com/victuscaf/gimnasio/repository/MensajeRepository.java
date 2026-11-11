package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Mensaje;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.models.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    List<Mensaje> findByClienteOrderByFechaEnvioDescHoraEnvioDesc(Usuario cliente);

    List<Mensaje> findByEntrenador(Entrenador entrenador);

    List<Mensaje> findByEntrenadorAndClienteOrderByFechaEnvioDescHoraEnvioDesc(
            Entrenador entrenador, Usuario cliente);

    Optional<Mensaje> findByIdAndCliente(Long id, Usuario cliente);
}