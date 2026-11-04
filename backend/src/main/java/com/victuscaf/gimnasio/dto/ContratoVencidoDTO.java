package com.victuscaf.gimnasio.dto;

import java.time.LocalDate;

import com.victuscaf.gimnasio.models.TipoDeMembresia;

/** Contrato vencido con los datos minimos del cliente para la vista del admin. */
public record ContratoVencidoDTO(
        Long idContrato,
        Long numeroDocumento,
        String nombreCompleto,
        TipoDeMembresia tipoMembresia,
        LocalDate fechaInicio,
        LocalDate fechaVencimiento,
        long diasVencido
) {}
