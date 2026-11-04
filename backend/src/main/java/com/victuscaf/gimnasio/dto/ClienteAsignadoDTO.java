package com.victuscaf.gimnasio.dto;

import java.time.LocalDate;

import com.victuscaf.gimnasio.models.OrigenAsignacion;
import com.victuscaf.gimnasio.models.TipoDeCliente;

/** Cliente activo asignado a un entrenador. */
public record ClienteAsignadoDTO(
        Long numeroDocumento,
        String nombreCompleto,
        TipoDeCliente tipoDeCliente,
        Boolean estado,
        LocalDate fechaAsignacion,
        OrigenAsignacion origen
) {}
