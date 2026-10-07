package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.*;

public record RegistroIngresoDTO(
        @NotNull @Positive Long numeroDocumento
) {}