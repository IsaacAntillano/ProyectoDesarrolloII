package com.victuscaf.gimnasio.dto;

import com.victuscaf.gimnasio.models.TipoDeMembresia;
import jakarta.validation.constraints.*;

public record MigracionDTO(
        @NotBlank @Email String correoElectronico,
        @NotBlank String contrasena,
        @NotNull TipoDeMembresia tipoMembresia
) {}