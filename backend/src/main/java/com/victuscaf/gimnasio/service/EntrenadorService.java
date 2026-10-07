package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.models.*;
import com.victuscaf.gimnasio.repository.*;
import com.victuscaf.gimnasio.dto.*;
import com.victuscaf.gimnasio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EntrenadorService {

    private final EntrenadorRepository entrenadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final RutinaRepository rutinaRepository;
    private final HorarioEntrenadorRepository horarioRepository;
    private final MensajeRepository mensajeRepository;

    // CRUD Entrenador (solo admin)
    @Transactional
    public Entrenador crearEntrenador(EntrenadorDTO dto) {
        if (entrenadorRepository.findByNumeroDeDocumento(dto.numeroDeDocumento()).isPresent()) {
            throw new RuntimeException("Ya existe un entrenador con ese documento");
        }
        Entrenador e = new Entrenador();
        e.setNumeroDeDocumento(dto.numeroDeDocumento());
        e.setNombreCompleto(dto.nombreCompleto());
        e.setCorreoElectronico(dto.correoElectronico());
        e.setContrasena(dto.contrasena());
        e.setEspecialidad(dto.especialidad());
        e.setSalario(dto.salario());
        e.setCantidadClientesActivos(0);
        e.setEstado(true);
        e.setRol(Rol.ENTRENADOR);
        return entrenadorRepository.save(e);
    }

    // Horarios
    /**
     * El parametro es el numero de documento del entrenador, que es lo que
     * viaja en el header X-Documento (no el id de base de datos).
     */
    @Transactional
    public HorarioEntrenador crearHorario(Long documentoEntrenador, HorarioDTO dto) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        HorarioEntrenador horario = new HorarioEntrenador();
        horario.setEntrenador(entrenador);
        horario.setFechaDisponible(dto.fechaDisponible());
        horario.setHoraInicio(dto.horaInicio());
        horario.setHoraFin(dto.horaFin());
        horario.setDisponible(true);
        return horarioRepository.save(horario);
    }

    @Transactional
    public void asignarHorarioAClientePlus(Long idHorario, Long numeroDocumento) {
        HorarioEntrenador horario = horarioRepository.findById(idHorario)
                .orElseThrow(() -> new RuntimeException("Horario no encontrado"));
        if (!horario.isDisponible()) {
            throw new RuntimeException("Horario no disponible");
        }
        Usuario cliente = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        horario.setIdClienteAsignado(cliente.getId());
        horario.setDisponible(false);
        horarioRepository.save(horario);
    }

    // Rutinas
    @Transactional
    public Rutina crearRutina(Long documentoEntrenador, Long numeroDocumento, RutinaDTO dto) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        Usuario cliente = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Rutina rutina = new Rutina();
        rutina.setEntrenador(entrenador);
        rutina.setUsuario(cliente);
        rutina.setNombre(dto.nombre());
        rutina.setDescripcion(dto.descripcion());
        rutina.setFechaCreacion(java.time.LocalDate.now());
        rutina.setFechaVencimiento(dto.fechaVencimiento());
        rutina.setActiva(true);
        return rutinaRepository.save(rutina);
    }

    // Mensajes
    @Transactional
    public Mensaje enviarMensaje(Long documentoEntrenador, Long numeroDocumento, String contenido) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        Usuario cliente = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Mensaje msg = new Mensaje();
        msg.setEntrenador(entrenador);
        msg.setCliente(cliente);
        msg.setContenido(contenido);
        msg.setFechaEnvio(java.time.LocalDate.now());
        msg.setHoraEnvio(java.time.LocalTime.now());
        msg.setLeido(false);
        return mensajeRepository.save(msg);
    }

    // ========== CONSULTAS ==========

    private Entrenador buscarPorDocumento(Long documento) {
        return entrenadorRepository.findByNumeroDeDocumento(documento)
                .orElseThrow(() -> new RuntimeException(
                        "No existe un entrenador con el documento " + documento));
    }

    /** Horarios declarados por un entrenador, para su panel. */
    @Transactional(readOnly = true)
    public List<HorarioEntrenador> listarHorariosDelEntrenador(Long documentoEntrenador) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        return horarioRepository.findByEntrenador(entrenador);
    }

    /** Clientes que este entrenador tiene asignados (con rutina o horario). */
    @Transactional(readOnly = true)
    public List<Usuario> listarClientesAsignados(Long documentoEntrenador) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        return rutinaRepository.findByEntrenador(entrenador).stream()
                .map(Rutina::getUsuario)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
    }

    /** Rutinas que este entrenador creo. */
    @Transactional(readOnly = true)
    public List<Rutina> listarRutinas(Long documentoEntrenador) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        return rutinaRepository.findByEntrenador(entrenador);
    }
}