package com.victuscaf.modules.client.service;

import com.victuscaf.modules.client.models.*;
import com.victuscaf.modules.client.repository.*;
import com.victuscaf.modules.client.repository.BitacoraAccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class SeguridadService {

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final BitacoraAccionRepository bitacoraRepository;

    public UsuarioSistema autenticar(Long numeroDocumento, String contrasena) {
        UsuarioSistema user = usuarioSistemaRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (!user.getContrasena().equals(contrasena)) {
            throw new RuntimeException("Contraseña incorrecta");
        }
        if (!user.getEstado()) {
            throw new RuntimeException("Usuario inactivo");
        }
        return user;
    }

    public void registrarAccionEnBitacora(Long idUsuario, String nombreUsuario, TipoAccion accion, String descripcion) {
        BitacoraAccion bitacora = new BitacoraAccion();
        bitacora.setFecha(LocalDate.now());
        bitacora.setHora(LocalTime.now());
        bitacora.setTipoAccion(accion);
        bitacora.setDescripcion(descripcion);
        bitacora.setIdUsuarioSistema(idUsuario);
        bitacora.setNombreUsuario(nombreUsuario);
        bitacoraRepository.save(bitacora);
    }
}