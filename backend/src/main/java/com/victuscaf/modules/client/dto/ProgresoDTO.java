package com.victuscaf.modules.client.dto;


public record ProgresoDTO(
        double pesoPerdido,
        double imcActual,
        double porcentajeGrasaActual,
        String mensaje
) {}