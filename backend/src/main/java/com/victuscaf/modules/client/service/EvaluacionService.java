package com.victuscaf.modules.client.service;

import com.victuscaf.modules.client.models.*;
import com.victuscaf.modules.client.repository.*;
import com.victuscaf.modules.client.dto.*;
import com.victuscaf.modules.client.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluacionService {

    private final UsuarioRepository usuarioRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;
    private final EvaluacionFisicaRepository evaluacionRepository;
    private final MetaFisicaRepository metaRepository;
    private final EntrenadorRepository entrenadorRepository;

    @Transactional
    public EvaluacionFisica crearEvaluacionInicial(Long numeroDocumento, Long idEntrenador, MedidasDTO medidas) {
        Usuario usuario = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Entrenador entrenador = entrenadorRepository.findById(idEntrenador)
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));
        // Verificar si ya existe una evaluación inicial (opcional)
        EvaluacionFisica evaluacion = new EvaluacionFisica();
        evaluacion.setUsuario(usuario);
        evaluacion.setEntrenador(entrenador);
        evaluacion.setFechaEvaluacion(java.time.LocalDate.now());
        actualizarMedidas(evaluacion, medidas);
        evaluacion.setImc(calcularIMC(medidas.getPeso(), medidas.getTalla()));
        return evaluacionRepository.save(evaluacion);
    }

    @Transactional
    public EvaluacionFisica registrarEvaluacionPeriodica(Long numeroDocumento, Long idEntrenador, MedidasDTO medidas) {
        // similar a crearEvaluacionInicial, sin validación de existencia previa
        return crearEvaluacionInicial(numeroDocumento, idEntrenador, medidas);
    }

    private void actualizarMedidas(EvaluacionFisica ev, MedidasDTO m) {
        ev.setPeso(m.getPeso());
        ev.setTalla(m.getTalla());
        ev.setPorcentajeGrasa(m.getPorcentajeGrasa());
        ev.setPerimetroCintura(m.getPerimetroCintura());
        ev.setPerimetroCadera(m.getPerimetroCadera());
        ev.setPerimetroBrazo(m.getPerimetroBrazo());
        ev.setPresionArterial(m.getPresionArterial());
        ev.setFrecuenciaCardiaca(m.getFrecuenciaCardiaca());
        if (m.getNivelDolor() != null) ev.setNivelDolor(m.getNivelDolor());
        if (m.getMovilidadArticular() != null) ev.setMovilidadArticular(m.getMovilidadArticular());
        ev.setObservaciones(m.getObservaciones());
    }

    private double calcularIMC(double peso, double talla) {
        if (talla <= 0) return 0;
        return peso / (talla * talla);
    }

    public List<EvaluacionFisica> consultarHistorial(Long numeroDocumento) {
        Usuario usuario = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return evaluacionRepository.findByUsuarioOrderByFechaEvaluacionAsc(usuario);
    }

    // Metas
    @Transactional
    public MetaFisica crearMetaParticular(Long numeroDocumento, MetaParticularDTO dto) {
        Usuario usuario = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        MetaFisica meta = new MetaFisica();
        meta.setUsuario(usuario);
        meta.setDescripcion(dto.descripcion());
        meta.setPesoObjetivo(dto.pesoObjetivo());
        meta.setPorcentajeGrasaObjetivo(dto.porcentajeGrasaObjetivo());
        meta.setPerimetroCinturaObjetivo(dto.perimetroCinturaObjetivo());
        meta.setFechaObjetivo(dto.fechaObjetivo());
        return metaRepository.save(meta);
    }

    @Transactional
    public MetaFisica crearMetaEPS(Long numeroDocumento, MetaEPSDTO dto) {
        BeneficiarioEps eps = beneficiarioEpsRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Beneficiario no encontrado"));
        MetaFisica meta = new MetaFisica();
        meta.setUsuario(eps);
        meta.setObservacionMedica(dto.observacionMedica());
        meta.setDescripcion("Objetivo clínico: " + dto.objetivoClinico());
        // otros campos opcionales
        return metaRepository.save(meta);
    }

    public ProgresoDTO consultarProgreso(Long numeroDocumento) {
        List<EvaluacionFisica> evaluaciones = consultarHistorial(numeroDocumento);
        if (evaluaciones.size() < 2) {
            throw new RuntimeException("No hay suficientes evaluaciones para mostrar progreso");
        }
        EvaluacionFisica inicial = evaluaciones.getFirst();
        EvaluacionFisica ultima = evaluaciones.getLast();

        double pesoPerdido = inicial.getPeso() - ultima.getPeso();
        double imcActual = ultima.getImc();
        double porcentajeGrasaActual = ultima.getPorcentajeGrasa(); // asegúrate de tener este campo
        String mensaje = "Progreso desde la evaluación inicial";

        return new ProgresoDTO(pesoPerdido, imcActual, porcentajeGrasaActual, mensaje);
    }
}