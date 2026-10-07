package com.victuscaf.modules.client.models;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class Entrenador extends UsuarioSistema{
    private String especialidad;
    private int cantidadClientesActivos;
    private double salario;
}
