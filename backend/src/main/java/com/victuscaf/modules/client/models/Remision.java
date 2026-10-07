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
public class Remision {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private int sesionesAutorizadas;
    private int sesionesAsistidas;
    private String medicoRemitente;
    private String entidadEps;
    private String diagnostico;
    private String zonaCuerpoTratar;
    private String motivoCancelacion;

    @Enumerated(EnumType.STRING)
    private EstadoRemision estado;

    @JsonBackReference
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiario_id")
    private BeneficiarioEps beneficiario;

    // Método para calcular sesiones restantes
    public int calcularSesionesRestantes() {
        return sesionesAutorizadas - sesionesAsistidas;
    }

    // Método para saber si tiene sesiones disponibles
    public boolean tieneSesionesDisponibles() {
        return calcularSesionesRestantes() > 0;
    }
}