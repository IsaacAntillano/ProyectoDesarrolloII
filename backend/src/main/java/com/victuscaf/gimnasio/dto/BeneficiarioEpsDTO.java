package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record BeneficiarioEpsDTO(
        @NotBlank String tipoDeDocumento,
        @NotNull @Positive Long numeroDeDocumento,
        @NotBlank String nombreCompleto,
        @NotNull LocalDate fechaDeNacimiento,
        @NotNull @Positive Long telefono,
        @NotBlank @Email String correoElectronico,
        @NotBlank String contrasena,
        Boolean tieneEntrenadorPermanente,  // puede ser null, false por defecto
        @NotNull LocalDate fechaFin,
        @Positive int sesionesAutorizadas,
        @NotBlank String medicoRemitente,
        @NotBlank String entidadEps,
        @NotBlank String diagnostico,
        @NotBlank String zonaCuerpoTratar
) {}