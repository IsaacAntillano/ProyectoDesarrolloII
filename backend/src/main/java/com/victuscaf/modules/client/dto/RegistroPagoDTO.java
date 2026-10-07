package com.victuscaf.modules.client.dto;

import com.victuscaf.modules.client.models.MetodoDePago;
import jakarta.validation.constraints.*;

public record RegistroPagoDTO(
        @NotNull @Positive Long numeroDocumento,
        @NotNull MetodoDePago metodoPago,
        @Positive double valor
) {}