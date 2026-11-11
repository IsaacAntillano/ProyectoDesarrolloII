package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.FacturaEps;
import com.victuscaf.gimnasio.models.Pago;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.models.TipoDePago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByUsuario(Usuario usuario);

    List<Pago> findByFechaPago(LocalDate fecha);

    boolean existsByUsuarioAndFechaPago(Usuario usuario, LocalDate fecha);

    List<Pago> findByUsuarioAndTipoPago(Usuario usuario, TipoDePago tipoPago);

    List<Pago> findByFechaPagoBetween(LocalDate start, LocalDate end);

    List<Pago> findByFacturaEps(FacturaEps facturaEps);
}