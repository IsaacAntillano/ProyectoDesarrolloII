package com.victuscaf.gimnasio.dto;

/**
 * Aprobacion de una solicitud plus. Si no se indica entrenador, el sistema
 * elige el que tenga menos clientes activos.
 */
public record AprobarSolicitudPlusDTO(
        Long documentoEntrenador
) {}
