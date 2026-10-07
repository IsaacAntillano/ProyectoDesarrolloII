package com.victuscaf.gimnasio.dto;

import com.victuscaf.gimnasio.models.MetodoDePago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Registro de un pago. El valor se envia para que el backend valide contra la
 * tarifa vigente y rechace montos incorrectos.
 */
public record PagoDTO(
        @NotNull MetodoDePago metodoPago,
        @PositiveOrZero double valor
) {}