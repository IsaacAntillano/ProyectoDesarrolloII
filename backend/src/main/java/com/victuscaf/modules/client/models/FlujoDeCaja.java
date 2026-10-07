package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@EqualsAndHashCode
@ToString
public class FlujoDeCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFlujoDeCaja;
    private LocalDate fecha;
    private double totalIngresoParticular;
    private double totalIngresoParticularDiario;
    private double totalIngresoCopagoEps;
    private double totalIngresoPlus;
    private double totalEgresosMantenimiento;
    private double totalEgresosNomina;
    private double totalEgresosArriendo;
    private double utilidadNeta;

    @OneToMany(mappedBy = "flujoDeCaja", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GastoOperativo> gastos = new ArrayList<>();
}