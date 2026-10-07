package com.victuscaf.modules.client.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Contrato {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;

    @Enumerated(EnumType.STRING)
    private TipoDeMembresia tipoMembresia;

    @Enumerated(EnumType.STRING)
    private EstadoContratoParticular estado;

    @JsonBackReference
    @OneToOne
    @JoinColumn(name = "cliente_id")
    private ParticularMensual cliente;
}