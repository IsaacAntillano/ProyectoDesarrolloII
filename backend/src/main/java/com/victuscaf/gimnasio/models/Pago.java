package com.victuscaf.gimnasio.models;

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

    /** Factura EPS a la que aplica el pago (solo para pagos de tipo EPS). */
    @ManyToOne
    @JoinColumn(name = "factura_eps_id")
    private FacturaEps facturaEps;
}