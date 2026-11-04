package com.victuscaf.gimnasio.models;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;

@Entity
@Data
@EqualsAndHashCode
@ToString
@NoArgsConstructor
public class GastoOperativo {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private LocalDate fecha;
    private String descripcion;
    private double valor;
    private TipoGasto tipoGasto;
    @ManyToOne
    @JoinColumn(name = "flujo_caja_id")
    // Evita la recursion FlujoDeCaja -> gastos -> GastoOperativo -> FlujoDeCaja
    // al serializar; el flujo se consulta por su propio endpoint.
    @JsonIgnore
    private FlujoDeCaja flujoDeCaja;
}
