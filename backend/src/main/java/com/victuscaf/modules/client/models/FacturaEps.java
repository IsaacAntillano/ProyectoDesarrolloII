package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacturaEps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaGeneracion;
    private LocalDate fechaRadicacion;
    private LocalDate fechaPago;
    private double valorTotal;
    private String entidadEps;
    private String periodoConsolidado;

    @Enumerated(EnumType.STRING)
    private EstadoFacturaEps estado;
}