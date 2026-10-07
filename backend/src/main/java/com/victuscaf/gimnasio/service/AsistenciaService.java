package com.victuscaf.gimnasio.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.Asistencia;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.repository.AsistenciaRepository;
import com.victuscaf.gimnasio.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/** Consultas de asistencias. El registro de ingresos vive en AccesoService. */
@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<Asistencia> listarPorUsuario(Long numeroDocumento) {
        Usuario usuario = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return asistenciaRepository.findByUsuario(usuario);
    }
}