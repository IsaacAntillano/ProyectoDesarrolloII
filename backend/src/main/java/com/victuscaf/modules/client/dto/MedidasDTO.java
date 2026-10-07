package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MedidasDTO {
    @Positive double peso;
    @Positive double talla;
    @Positive double porcentajeGrasa;
    @Positive double perimetroCintura;
    @Positive double perimetroCadera;
    @Positive double perimetroBrazo;
    @NotBlank String presionArterial;
    @Positive int frecuenciaCardiaca;
    Integer nivelDolor;          // opcional, solo para EPS
    Integer movilidadArticular;  // opcional, solo para EPS
    String observaciones;
}