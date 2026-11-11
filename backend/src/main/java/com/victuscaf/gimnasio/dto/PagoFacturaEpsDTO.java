package com.victuscaf.gimnasio.dto;

import java.time.LocalDate;

import com.victuscaf.gimnasio.models.MetodoDePago;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Pago recibido por una factura EPS (PA-0013).
 *
 * <p>El valor debe coincidir con el total de la factura; el backend lo valida
 * con la misma tolerancia de 0.01 que el resto de pagos.
 */
public record PagoFacturaEpsDTO(
        @NotNull LocalDate fechaPago,
        @NotNull MetodoDePago metodoPago,
        @Positive double valor
) {
}
