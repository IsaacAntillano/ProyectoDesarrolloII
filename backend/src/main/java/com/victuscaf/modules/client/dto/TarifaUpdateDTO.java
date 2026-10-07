package com.victuscaf.modules.client.dto;

import com.victuscaf.modules.client.models.TipoDeCliente;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Actualizacion de la tarifa de un tipo de cliente.
 *
 * <p>El administrador que aplica el cambio viaja en {@code idAdminModificador}.
 * La vista lo toma de {@code localStorage['user'].id}, que el selector de rol
 * deja en 0 porque no pide documento; por eso el campo es opcional.
 */
public record TarifaUpdateDTO(
        @NotNull TipoDeCliente tipoDeCliente,
        @PositiveOrZero double valorMensual,
        @PositiveOrZero double valorDiario,
        @PositiveOrZero double valorPlus,
        Long idAdminModificador
) {}