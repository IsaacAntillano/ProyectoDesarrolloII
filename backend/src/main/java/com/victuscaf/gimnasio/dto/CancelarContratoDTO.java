package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;

/** Cancelacion anticipada de un contrato EPS. El motivo queda en la remision. */
public record CancelarContratoDTO(
        @NotBlank String motivo
) {}
