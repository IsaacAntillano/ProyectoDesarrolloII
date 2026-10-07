package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pago {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaPago;
    private double valor;

    @Enumerated(EnumType.STRING)
    private MetodoDePago metodoPago;

    @Enumerated(EnumType.STRING)
    private TipoDePago tipoPago;

    @Enumerated(EnumType.STRING)
    private EstadoPago estadoPago;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "contrato_id")
    private Contrato contrato;
}