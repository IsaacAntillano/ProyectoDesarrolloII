package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluacionFisica {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaEvaluacion;
    private double peso;
    private double talla;
    private double imc;
    private double porcentajeGrasa;
    private double perimetroCintura;
    private double perimetroCadera;
    private double perimetroBrazo;
    private String presionArterial;
    private int frecuenciaCardiaca;
    private int nivelDolor;        // escala 1-10, para EPS
    private int movilidadArticular; // escala 1-10, para EPS
    private String observaciones;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "entrenador_id")
    private Entrenador entrenador;
}