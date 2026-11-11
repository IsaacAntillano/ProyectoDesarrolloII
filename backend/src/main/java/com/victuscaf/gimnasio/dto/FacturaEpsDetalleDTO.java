package com.victuscaf.gimnasio.dto;

import java.util.List;

import com.victuscaf.gimnasio.models.FacturaEps;
import com.victuscaf.gimnasio.models.Pago;

/** Detalle de una factura EPS con los pagos registrados a su favor (PA-0010). */
public record FacturaEpsDetalleDTO(
        FacturaEps factura,
        List<Pago> pagos
) {
}
