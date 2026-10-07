package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;

public record RegistroIngresoDTO(
        @NotNull @Positive Long numeroDocumento
) {}