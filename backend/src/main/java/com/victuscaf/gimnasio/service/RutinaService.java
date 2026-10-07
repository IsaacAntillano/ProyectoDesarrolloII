package com.victuscaf.gimnasio.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.Rutina;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.repository.RutinaRepository;
import com.victuscaf.gimnasio.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * Consultas de rutinas. La creacion de rutinas por parte del entrenador vive
 * en EntrenadorService.
 */
@Service
@RequiredArgsConstructor
public class RutinaService {

    private final RutinaRepository rutinaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<Rutina> listarRutinasActivas(Long numeroDocumento) {
        Usuario usuario = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return rutinaRepository.findByUsuarioAndActivaTrue(usuario);
    }
}