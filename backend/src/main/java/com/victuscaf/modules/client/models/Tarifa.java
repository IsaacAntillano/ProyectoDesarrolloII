package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tarifa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoDeCliente tipoDeCliente;

    private double valorMensual;
    private double valorDiario;
    private double valorPlus;
    private LocalDate fechaUltimaModificacion;
    private Long idAdminModificador;
}