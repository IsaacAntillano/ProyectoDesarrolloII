package com.victuscaf.gimnasio.dto;

import com.victuscaf.gimnasio.models.MetodoDePago;
import jakarta.validation.constraints.*;

public record RegistroPagoDTO(
        @NotNull @Positive Long numeroDocumento,
        @NotNull MetodoDePago metodoPago,
        @Positive double valor
) {}