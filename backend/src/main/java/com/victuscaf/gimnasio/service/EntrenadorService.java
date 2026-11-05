package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.models.*;
import com.victuscaf.gimnasio.repository.*;
import com.victuscaf.gimnasio.dto.*;
import com.victuscaf.gimnasio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EntrenadorService {

    private final EntrenadorRepository entrenadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final RutinaRepository rutinaRepository;
    private final HorarioEntrenadorRepository horarioRepository;
    private final MensajeRepository mensajeRepository;
    private final AsignacionEntrenadorService asignacionService;
    private final EvaluacionService evaluacionService;

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
     * (el documento viaja en el token JWT, no el id de base de datos).
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

    /** Clientes activos que este entrenador tiene asignados. */
    @Transactional(readOnly = true)
    public List<ClienteAsignadoDTO> listarClientesAsignados(Long documentoEntrenador) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        return asignacionService.listarActivasPorEntrenador(entrenador).stream()
                .map(asignacion -> {
                    Usuario cliente = asignacion.getCliente();
                    return new ClienteAsignadoDTO(
                            cliente.getNumeroDeDocumento(),
                            cliente.getNombreCompleto(),
                            cliente.getTipoDeCliente(),
                            cliente.getEstado(),
                            asignacion.getFechaAsignacion(),
                            asignacion.getOrigen());
                })
                .toList();
    }

    /** Cupos libres del entrenador asignado al cliente, para reservar desde su portal. */
    @Transactional
    public List<HorarioDisponibleDTO> listarHorariosDisponiblesParaCliente(Long numeroDocumento) {
        Usuario cliente = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Entrenador entrenador = asignacionService.asignacionActiva(cliente)
                .map(AsignacionEntrenador::getEntrenador)
                .orElseThrow(() -> new RuntimeException("El cliente no tiene un entrenador asignado"));

        LocalDate hoy = LocalDate.now();
        return horarioRepository.findByEntrenadorAndDisponibleTrue(entrenador).stream()
                .filter(horario -> !horario.getFechaDisponible().isBefore(hoy))
                .map(horario -> new HorarioDisponibleDTO(
                        horario.getId(),
                        horario.getFechaDisponible(),
                        horario.getHoraInicio(),
                        horario.getHoraFin(),
                        entrenador.getNombreCompleto()))
                .toList();
    }

    /** Reserva un cupo del entrenador asignado al cliente. */
    @Transactional
    public HorarioDisponibleDTO reservarHorario(Long idHorario, Long numeroDocumento) {
        Usuario cliente = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        AsignacionEntrenador asignacion = asignacionService.asignacionActiva(cliente)
                .orElseThrow(() -> new RuntimeException("El cliente no tiene un entrenador asignado"));

        HorarioEntrenador horario = horarioRepository.findById(idHorario)
                .orElseThrow(() -> new RuntimeException("Horario no encontrado"));
        if (!horario.isDisponible()) {
            throw new RuntimeException("El horario ya no esta disponible");
        }
        if (horario.getEntrenador() == null
                || !horario.getEntrenador().getIdUsuarioSistema()
                        .equals(asignacion.getEntrenador().getIdUsuarioSistema())) {
            throw new RuntimeException("El horario no pertenece al entrenador asignado");
        }
        if (horario.getFechaDisponible().isBefore(LocalDate.now())) {
            throw new RuntimeException("No se puede reservar un horario pasado");
        }

        horario.setIdClienteAsignado(cliente.getId());
        horario.setDisponible(false);
        HorarioEntrenador guardado = horarioRepository.save(horario);

        return new HorarioDisponibleDTO(
                guardado.getId(),
                guardado.getFechaDisponible(),
                guardado.getHoraInicio(),
                guardado.getHoraFin(),
                asignacion.getEntrenador().getNombreCompleto());
    }

    /** Rutinas que este entrenador creo. */
    @Transactional(readOnly = true)
    public List<Rutina> listarRutinas(Long documentoEntrenador) {
        Entrenador entrenador = buscarPorDocumento(documentoEntrenador);
        return rutinaRepository.findByEntrenador(entrenador);
    }

    /** Progreso físico de un cliente asignado al entrenador (EF-0007). */
    @Transactional(readOnly = true)
    public ProgresoDTO consultarProgresoDeCliente(Long documentoEntrenador, Long numeroDocumento) {
        Usuario cliente = verificarAsignacionActiva(documentoEntrenador, numeroDocumento);
        return evaluacionService.consultarProgreso(cliente.getNumeroDeDocumento());
    }

    /** Rutinas activas de un cliente asignado al entrenador (GE-0008). */
    @Transactional(readOnly = true)
    public List<Rutina> listarRutinasDeCliente(Long documentoEntrenador, Long numeroDocumento) {
        Usuario cliente = verificarAsignacionActiva(documentoEntrenador, numeroDocumento);
        return rutinaRepository.findByUsuarioAndActivaTrue(cliente);
    }

    /**
     * Verifica que, si quien llama es un entrenador, el cliente tenga una
     * asignación activa con él. El rol {@code ADMINISTRADOR} (su documento no
     * corresponde a ningún entrenador) puede consultar a cualquiera.
     */
    private Usuario verificarAsignacionActiva(Long documentoEntrenador, Long numeroDocumento) {
        Usuario cliente = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        var entrenadorOpt = entrenadorRepository.findByNumeroDeDocumento(documentoEntrenador);
        if (entrenadorOpt.isEmpty()) {
            // Quien llama no es un entrenador (administrador): acceso libre.
            return cliente;
        }
        Entrenador entrenador = entrenadorOpt.get();
        AsignacionEntrenador asignacion = asignacionService.asignacionActiva(cliente)
                .orElseThrow(() -> new RuntimeException("El cliente no tiene un entrenador asignado"));
        if (asignacion.getEntrenador() == null
                || !asignacion.getEntrenador().getIdUsuarioSistema()
                        .equals(entrenador.getIdUsuarioSistema())) {
            throw new RuntimeException("El cliente no esta asignado a ti");
        }
        return cliente;
    }
}