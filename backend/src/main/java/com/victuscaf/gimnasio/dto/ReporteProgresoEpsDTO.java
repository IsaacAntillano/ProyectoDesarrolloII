package com.victuscaf.gimnasio.dto;

import java.time.LocalDate;
import java.util.List;

import com.victuscaf.gimnasio.models.EvaluacionFisica;

/**
 * Reporte de progreso físico de un beneficiario EPS (EF-0008).
 *
 * <p>Reúne los datos de la remisión, el entrenador, las evaluaciones y la meta
 * clínica para que el entrenador lo imprima o lo guarde como PDF desde el
 * navegador.
 */
public record ReporteProgresoEpsDTO(
        Long numeroDocumento,
        String nombreBeneficiario,
        String entidadEps,
        String diagnostico,
        String zonaCuerpoTratar,
        String medicoRemitente,
        String nombreEntrenador,
        LocalDate fechaGeneracion,
        LocalDate fechaEvaluacionInicial,
        LocalDate fechaEvaluacionFinal,
        List<EvaluacionFisica> evaluaciones,
        ProgresoDTO progreso,
        String objetivoClinico,
        String observacionMedica,
        LocalDate fechaObjetivo
) {
}
