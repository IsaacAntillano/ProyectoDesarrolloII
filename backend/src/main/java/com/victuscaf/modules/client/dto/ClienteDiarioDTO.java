package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ClienteDiarioDTO(
        @NotBlank String tipoDeDocumento,
        @NotNull @Positive Long numeroDeDocumento,
        @NotBlank String nombreCompleto,
        @NotNull LocalDate fechaDeNacimiento,
        @NotNull @Positive Long telefono,
        @NotBlank @Email String correoElectronico,
        @NotBlank String contrasena
) {}