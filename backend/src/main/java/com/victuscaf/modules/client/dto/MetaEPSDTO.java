package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;

public record MetaEPSDTO(
        @NotBlank String objetivoClinico,
        String observacionMedica
) {}