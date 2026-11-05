package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.dto.*;
import com.victuscaf.gimnasio.models.*;
import com.victuscaf.gimnasio.repository.*;
import com.victuscaf.gimnasio.models.EstadoContratoEps;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final UsuarioRepository usuarioRepository;
    private final ParticularMensualRepository particularMensualRepository;
    private final ParticularDiarioRepository particularDiarioRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;
    private final ContratoRepository contratoRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager em;
    private final RemisionRepository remisionRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final TarifaRepository tarifaRepository;
    private final AsignacionEntrenadorService asignacionEntrenadorService;

    // ==================== REGISTRO DE CLIENTES ====================

    /**
     * Registra un nuevo cliente particular mensual.
     * Valida documento único, genera contrato automático y asigna entrenador para el primer mes.
     */
    @Transactional
    public ParticularMensual registrarParticularMensual(ClienteMensualDTO dto) {
        // Validar documento único
        if (usuarioRepository.existsByNumeroDeDocumento(dto.getNumeroDeDocumento())) {
            throw new RuntimeException("Ya existe un cliente con el número de documento " + dto.getNumeroDeDocumento());
        }

        // Crear cliente
        ParticularMensual cliente = new ParticularMensual();
        cliente.setTipoDeDocumento(dto.getTipoDeDocumento());
        cliente.setNumeroDeDocumento(dto.getNumeroDeDocumento());
        cliente.setNombreCompleto(dto.getNombreCompleto());
        cliente.setFechaDeNacimiento(dto.getFechaDeNacimiento());
        cliente.setTelefono(dto.getTelefono());
        cliente.setCorreoElectronico(dto.getCorreoElectronico());
        cliente.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        cliente.setEstado(true);
        cliente.setTipoDeCliente(TipoDeCliente.PARTICULAR_MENSUAL);
        cliente.setTieneEntrenador(true);   // primer mes gratis
        cliente.setEstadoMembresia(EstadoMembresia.ACTIVO); // se activa al pagar, pero asumimos pago inicial

        ParticularMensual saved = particularMensualRepository.save(cliente);

        // Generar contrato
        Contrato contrato = new Contrato();
        contrato.setCliente(saved);
        contrato.setFechaInicio(LocalDate.now());
        contrato.setTipoMembresia(dto.getTipoMembresia());
        // Calcular fecha de vencimiento según el tipo de membresía
        LocalDate vencimiento = switch (dto.getTipoMembresia()) {
            case MENSUAL -> LocalDate.now().plusMonths(1);
            case TRIMESTRAL -> LocalDate.now().plusMonths(3);
            case SEMESTRAL -> LocalDate.now().plusMonths(6);
            case ANUAL -> LocalDate.now().plusYears(1);
        };
        contrato.setFechaVencimiento(vencimiento);
        contrato.setEstado(EstadoContratoParticular.ACTIVO);
        contratoRepository.save(contrato);
        saved.setContrato(contrato);
        particularMensualRepository.save(saved);

        // Entrenador incluido durante el primer mes
        asignarEntrenadorAutomatico(saved, OrigenAsignacion.PRIMER_MES, LocalDate.now().plusMonths(1));

        return saved;
    }

    /**
     * Registra un nuevo cliente particular diario.
     * Registra automáticamente hora de ingreso y calcula expiración (2 horas).
     */
    @Transactional
    public ParticularDiario registrarParticularDiario(ClienteDiarioDTO dto) {
        if (usuarioRepository.existsByNumeroDeDocumento(dto.numeroDeDocumento())) {
            throw new RuntimeException("Ya existe un cliente con el número de documento " + dto.numeroDeDocumento());
        }

        ParticularDiario cliente = new ParticularDiario();
        cliente.setTipoDeDocumento(dto.tipoDeDocumento());
        cliente.setNumeroDeDocumento(dto.numeroDeDocumento());
        cliente.setNombreCompleto(dto.nombreCompleto());
        cliente.setFechaDeNacimiento(dto.fechaDeNacimiento());
        cliente.setTelefono(dto.telefono());
        cliente.setCorreoElectronico(dto.correoElectronico());
        cliente.setContrasena(passwordEncoder.encode(dto.contrasena()));
        cliente.setEstado(true);
        cliente.setTipoDeCliente(TipoDeCliente.PARTICULAR_DIARIO);
        cliente.setFechaDeIngreso(LocalDate.now());
        cliente.setHoraIngreso(LocalTime.now());
        cliente.setHoraExpiracion(LocalTime.now().plusHours(2));

        return particularDiarioRepository.save(cliente);
    }

    /**
     * Registra un nuevo beneficiario EPS con todos los datos de la remisión médica.
     * Genera automáticamente la remisión asociada.
     */
    @Transactional
    public BeneficiarioEps registrarBeneficiarioEPS(BeneficiarioEpsDTO dto) {
        if (usuarioRepository.existsByNumeroDeDocumento(dto.numeroDeDocumento())) {
            throw new RuntimeException("Ya existe un cliente con el número de documento " + dto.numeroDeDocumento());
        }

        BeneficiarioEps beneficiario = new BeneficiarioEps();
        beneficiario.setTipoDeDocumento(dto.tipoDeDocumento());
        beneficiario.setNumeroDeDocumento(dto.numeroDeDocumento());
        beneficiario.setNombreCompleto(dto.nombreCompleto());
        beneficiario.setFechaDeNacimiento(dto.fechaDeNacimiento());
        beneficiario.setTelefono(dto.telefono());
        beneficiario.setCorreoElectronico(dto.correoElectronico());
        beneficiario.setContrasena(passwordEncoder.encode(dto.contrasena()));
        beneficiario.setEstado(true);
        beneficiario.setTipoDeCliente(TipoDeCliente.BENEFICIARIO_EPS);
        beneficiario.setTieneEntrenadorPermanente(dto.tieneEntrenadorPermanente());
        beneficiario.setEstadoContrato(EstadoContratoEps.ACTIVO);

        BeneficiarioEps saved = beneficiarioEpsRepository.save(beneficiario);

        // Crear remisión médica
        Remision remision = new Remision();
        remision.setBeneficiario(saved);
        remision.setFechaInicio(LocalDate.now());
        remision.setFechaFin(dto.fechaFin());
        remision.setSesionesAutorizadas(dto.sesionesAutorizadas());
        remision.setSesionesAsistidas(0);
        remision.setMedicoRemitente(dto.medicoRemitente());
        remision.setEntidadEps(dto.entidadEps());
        remision.setDiagnostico(dto.diagnostico());
        remision.setZonaCuerpoTratar(dto.zonaCuerpoTratar());
        remision.setEstado(EstadoRemision.ACTIVO);

        remisionRepository.save(remision);
        saved.setRemision(remision);
        beneficiarioEpsRepository.save(saved);

        // Si tiene entrenador permanente, asignar
        if (Boolean.TRUE.equals(dto.tieneEntrenadorPermanente())) {
            asignarEntrenadorAutomatico(saved, OrigenAsignacion.PLUS, null);
        }

        return saved;
    }

    // ==================== CONSULTAS ====================

    public ParticularMensual consultarParticularMensualPorDocumento(Long numeroDocumento) {
        return particularMensualRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente particular mensual no encontrado"));
    }

    public ParticularDiario consultarParticularDiarioPorDocumento(Long numeroDocumento) {
        return particularDiarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente particular diario no encontrado"));
    }

    public BeneficiarioEps consultarBeneficiarioEPSPorDocumento(Long numeroDocumento) {
        return beneficiarioEpsRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Beneficiario EPS no encontrado"));
    }

    /**
     * Consulta un cliente sin importar su tipo: resuelve la especializacion
     * correcta a partir del discriminador de tipo de cliente.
     */
    @Transactional(readOnly = true)
    public Usuario consultarClientePorDocumento(Long numeroDocumento) {
        Usuario usuario = usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (usuario instanceof ParticularMensual mensual) {
            return consultarParticularMensualPorDocumento(numeroDocumento);
        } else if (usuario instanceof ParticularDiario diario) {
            return consultarParticularDiarioPorDocumento(numeroDocumento);
        } else if (usuario instanceof BeneficiarioEps eps) {
            return consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        }
        return usuario;
    }

    // Versión para secretaria (solo muestra clientes activos)
    public List<ParticularMensual> listarParticularesMensualesActivos() {
        return particularMensualRepository.findByEstadoMembresia(EstadoMembresia.ACTIVO);
    }

    // Versión para administrador (todos)
    public List<ParticularMensual> listarTodosParticularesMensuales() {
        return particularMensualRepository.findAll();
    }

    public List<ParticularDiario> listarParticularesDiariosActivos() {
        return particularDiarioRepository.findByEstadoTrue();
    }

    public List<ParticularDiario> listarTodosParticularesDiarios() {
        return particularDiarioRepository.findAll();
    }

    public List<BeneficiarioEps> listarTodosBeneficiariosEPS() {
        return beneficiarioEpsRepository.findAll();
    }

    // ==================== ACTUALIZACIÓN ====================

    @Transactional
    public ParticularMensual actualizarParticularMensual(Long numeroDocumento, ActualizarClienteDTO dto) {
        ParticularMensual cliente = consultarParticularMensualPorDocumento(numeroDocumento);
        if (dto.getNombreCompleto() != null) cliente.setNombreCompleto(dto.getNombreCompleto());
        if (dto.getFechaDeNacimiento() != null) cliente.setFechaDeNacimiento(dto.getFechaDeNacimiento());
        if (dto.getTelefono() != null) cliente.setTelefono(dto.getTelefono());
        if (dto.getCorreoElectronico() != null) cliente.setCorreoElectronico(dto.getCorreoElectronico());
        if (dto.getContrasena() != null) cliente.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        // Se puede actualizar el tipo de membresía (esto debería regenerar contrato)
        if (dto.getTipoMembresia() != null) {
            Contrato contrato = cliente.getContrato();
            contrato.setTipoMembresia(dto.getTipoMembresia());
            // Recalcular vencimiento
            LocalDate nuevoVencimiento = switch (dto.getTipoMembresia()) {
                case MENSUAL -> LocalDate.now().plusMonths(1);
                case TRIMESTRAL -> LocalDate.now().plusMonths(3);
                case SEMESTRAL -> LocalDate.now().plusMonths(6);
                case ANUAL -> LocalDate.now().plusYears(1);
            };
            contrato.setFechaVencimiento(nuevoVencimiento);
            contratoRepository.save(contrato);
        }
        return particularMensualRepository.save(cliente);
    }

    // Similar para ParticularDiario (solo datos básicos)
    @Transactional
    public ParticularDiario actualizarParticularDiario(Long numeroDocumento, ActualizarClienteDTO dto) {
        ParticularDiario cliente = consultarParticularDiarioPorDocumento(numeroDocumento);
        if (dto.getNombreCompleto() != null) cliente.setNombreCompleto(dto.getNombreCompleto());
        if (dto.getFechaDeNacimiento() != null) cliente.setFechaDeNacimiento(dto.getFechaDeNacimiento());
        if (dto.getTelefono() != null) cliente.setTelefono(dto.getTelefono());
        if (dto.getCorreoElectronico() != null) cliente.setCorreoElectronico(dto.getCorreoElectronico());
        if (dto.getContrasena() != null) cliente.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        return particularDiarioRepository.save(cliente);
    }

    // Para BeneficiarioEPS solo actualizar contacto
    @Transactional
    public BeneficiarioEps actualizarBeneficiarioEPS(Long numeroDocumento, ActualizarClienteDTO dto) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        if (dto.getTelefono() != null) cliente.setTelefono(dto.getTelefono());
        if (dto.getCorreoElectronico() != null) cliente.setCorreoElectronico(dto.getCorreoElectronico());
        if (dto.getContrasena() != null) cliente.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        return beneficiarioEpsRepository.save(cliente);
    }

    // ==================== DESACTIVACIÓN ====================

    /**
     * Desactiva un cliente particular mensual.
     *
     * <p>Sin cartera ni cuentas por cobrar en el sistema, no hay saldo pendiente
     * calculable; la desvinculación administrativa siempre procede. El saldo se
     * salda en el momento del pago (secretaria) y la membresía depende del
     * vencimiento del contrato.
     */
    @Transactional
    public void desactivarParticularMensual(Long numeroDocumento) {
        ParticularMensual cliente = consultarParticularMensualPorDocumento(numeroDocumento);
        cliente.setEstado(false);
        cliente.setEstadoMembresia(EstadoMembresia.VENCIDO);
        particularMensualRepository.save(cliente);
    }

    // Desactivar particular diario (no tiene restricción de pago)
    @Transactional
    public void desactivarParticularDiario(Long numeroDocumento) {
        ParticularDiario cliente = consultarParticularDiarioPorDocumento(numeroDocumento);
        cliente.setEstado(false);
        particularDiarioRepository.save(cliente);
    }

    // Desactivar beneficiario EPS (solo por administrador, por ejemplo si la EPS cancela)
    @Transactional
    public void desactivarBeneficiarioEPS(Long numeroDocumento) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        cliente.setEstado(false);
        cliente.setEstadoContrato(EstadoContratoEps.FINALIZADO);
        beneficiarioEpsRepository.save(cliente);
    }

    // ==================== REACTIVACIÓN ====================

    /**
     * Reactiva un cliente particular mensual.
     */
    @Transactional
    public ParticularMensual reactivarParticularMensual(Long numeroDocumento) {
        ParticularMensual cliente = consultarParticularMensualPorDocumento(numeroDocumento);
        if (cliente.getEstado()) {
            throw new RuntimeException("El cliente ya está activo");
        }
        cliente.setEstado(true);
        cliente.setEstadoMembresia(EstadoMembresia.ACTIVO);
        return particularMensualRepository.save(cliente);
    }

    /**
     * Reactiva un cliente particular diario.
     */
    @Transactional
    public ParticularDiario reactivarParticularDiario(Long numeroDocumento) {
        ParticularDiario cliente = consultarParticularDiarioPorDocumento(numeroDocumento);
        if (cliente.getEstado()) {
            throw new RuntimeException("El cliente ya está activo");
        }
        cliente.setEstado(true);
        cliente.setFechaDeIngreso(LocalDate.now());
        cliente.setHoraIngreso(LocalTime.now());
        cliente.setHoraExpiracion(LocalTime.now().plusHours(2));
        return particularDiarioRepository.save(cliente);
    }

    /**
     * Reactiva un beneficiario EPS.
     */
    @Transactional
    public BeneficiarioEps reactivarBeneficiarioEPS(Long numeroDocumento) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        if (cliente.getEstado()) {
            throw new RuntimeException("El cliente ya está activo");
        }
        cliente.setEstado(true);
        cliente.setEstadoContrato(EstadoContratoEps.ACTIVO);
        return beneficiarioEpsRepository.save(cliente);
    }

    // ==================== MIGRACIÓN DIARIO -> MENSUAL ====================

    @Transactional
    public ParticularMensual migrarDiarioAMensual(Long numeroDocumento, MigracionDTO dto) {
        ParticularDiario diario = consultarParticularDiarioPorDocumento(numeroDocumento);
        Long idUsuario = diario.getId();

        /* No se puede borrar el ParticularDiario como entidad, porque al hacerlo
         * Hibernate tambien elimina la fila base `usuario`, y esa fila esta
         * referenciada por asistencia, pago y contrato (FK). La transicion se hace
         * moviendo la fila entre las tablas hijas con SQL nativo:
         *   - borrar la fila de particular_diario
         *   - insertar la misma id en particular_mensual
         *   - marcar tipo_de_cliente en la tabla usuario
         * El documento del cliente se conserva y el contrato nace en la tabla
         * contrato ligada al mismo usuario.id.
         */
        em.createNativeQuery("DELETE FROM particular_diario WHERE id = :id")
                .setParameter("id", idUsuario)
                .executeUpdate();
        em.createNativeQuery("INSERT INTO particular_mensual (id, estado_membresia, tiene_entrenador) VALUES (:id, :em, :te)")
                .setParameter("id", idUsuario)
                .setParameter("em", 0) // EstadoMembresia.ACTIVO (ordinal)
                .setParameter("te", false)
                .executeUpdate();
        em.createNativeQuery("UPDATE usuario SET tipo_de_cliente = :tipo, correo_electronico = :correo, contrasena = :contrasena WHERE id = :id")
                .setParameter("tipo", "PARTICULAR_MENSUAL")
                .setParameter("correo", dto.correoElectronico())
                .setParameter("contrasena", passwordEncoder.encode(dto.contrasena()))
                .setParameter("id", idUsuario)
                .executeUpdate();
        em.flush();
        em.clear();

        ParticularMensual saved = particularMensualRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Error al convertir a cliente mensual"));

        Contrato contrato = new Contrato();
        contrato.setCliente(saved);
        contrato.setFechaInicio(LocalDate.now());
        contrato.setTipoMembresia(dto.tipoMembresia());
        LocalDate vencimiento = switch (dto.tipoMembresia()) {
            case MENSUAL -> LocalDate.now().plusMonths(1);
            case TRIMESTRAL -> LocalDate.now().plusMonths(3);
            case SEMESTRAL -> LocalDate.now().plusMonths(6);
            case ANUAL -> LocalDate.now().plusYears(1);
        };
        contrato.setFechaVencimiento(vencimiento);
        contrato.setEstado(EstadoContratoParticular.ACTIVO);
        contratoRepository.save(contrato);
        saved.setContrato(contrato);
        particularMensualRepository.save(saved);

        return saved;
    }

    // ==================== ASIGNACIÓN DE ENTRENADOR ====================

    /**
     * Elige el entrenador activo con menos clientes y cupo disponible, y crea
     * la asignacion. Para el primer mes la asignacion lleva fecha de fin; el
     * servicio plus queda sin fecha de corte hasta que se cancele.
     */
    private void asignarEntrenadorAutomatico(Usuario cliente, OrigenAsignacion origen, LocalDate fechaFin) {
        Entrenador entrenador = entrenadorRepository.findByEstadoTrue().stream()
                .filter(e -> asignacionEntrenadorService.contarClientesActivos(e)
                        < AsignacionEntrenadorService.MAX_CLIENTES_POR_ENTRENADOR)
                .min(Comparator.comparingLong(asignacionEntrenadorService::contarClientesActivos))
                .orElseThrow(() -> new RuntimeException(
                        "No hay entrenadores disponibles en este momento. Contacte al administrador."));

        asignacionEntrenadorService.asignar(cliente, entrenador, origen, fechaFin);

        if (cliente instanceof ParticularMensual mensual) {
            mensual.setTieneEntrenador(true);
            particularMensualRepository.save(mensual);
        } else if (cliente instanceof BeneficiarioEps eps) {
            eps.setTieneEntrenadorPermanente(true);
            beneficiarioEpsRepository.save(eps);
        }
    }

    /** Asigna un entrenador concreto a un beneficiario EPS (solo administrador). */
    @Transactional
    public BeneficiarioEps asignarEntrenadorABeneficiarioEPS(Long numeroDocumento, Long documentoEntrenador) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        if (!Boolean.TRUE.equals(cliente.getEstado())) {
            throw new RuntimeException("El beneficiario EPS no esta activo");
        }
        Entrenador entrenador = entrenadorRepository.findByNumeroDeDocumento(documentoEntrenador)
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));
        asignacionEntrenadorService.asignar(cliente, entrenador, OrigenAsignacion.PLUS, null);
        cliente.setTieneEntrenadorPermanente(true);
        return beneficiarioEpsRepository.save(cliente);
    }

    /** Quita el entrenador de un beneficiario EPS y libera su cupo. */
    @Transactional
    public BeneficiarioEps liberarEntrenadorDeBeneficiarioEPS(Long numeroDocumento) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        asignacionEntrenadorService.liberar(cliente);
        cliente.setTieneEntrenadorPermanente(false);
        return beneficiarioEpsRepository.save(cliente);
    }

    /**
     * Asigna o cambia el entrenador de cualquier tipo de cliente (mensual,
     * diario o EPS). Cierra la asignación anterior y respeta el cupo de 4.
     * Solo administrador.
     */
    @Transactional
    public Usuario asignarEntrenadorACliente(Long numeroDocumento, Long documentoEntrenador) {
        Usuario cliente = consultarClientePorDocumento(numeroDocumento);
        if (!Boolean.TRUE.equals(cliente.getEstado())) {
            throw new RuntimeException("El cliente no esta activo");
        }
        Entrenador entrenador = entrenadorRepository.findByNumeroDeDocumento(documentoEntrenador)
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));
        asignacionEntrenadorService.asignar(cliente, entrenador, OrigenAsignacion.PLUS, null);
        if (cliente instanceof ParticularMensual mensual) {
            mensual.setTieneEntrenador(true);
            particularMensualRepository.save(mensual);
        } else if (cliente instanceof BeneficiarioEps eps) {
            eps.setTieneEntrenadorPermanente(true);
            beneficiarioEpsRepository.save(eps);
        }
        return cliente;
    }

    /** Contrato del cliente mensual, para consulta de secretaria y admin. */
    @Transactional(readOnly = true)
    public Contrato consultarContratoMensual(Long numeroDocumento) {
        ParticularMensual cliente = consultarParticularMensualPorDocumento(numeroDocumento);
        if (cliente.getContrato() == null) {
            throw new RuntimeException("El cliente no tiene un contrato registrado");
        }
        return cliente.getContrato();
    }

    /** Cancelacion anticipada del contrato EPS, con motivo y liberacion de cupo. */
    @Transactional
    public BeneficiarioEps cancelarBeneficiarioEPS(Long numeroDocumento, String motivo) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        if (cliente.getEstadoContrato() == EstadoContratoEps.CANCELADO_ANCTICIPADAMENTE) {
            throw new RuntimeException("El contrato EPS ya fue cancelado");
        }

        cliente.setEstadoContrato(EstadoContratoEps.CANCELADO_ANCTICIPADAMENTE);
        cliente.setEstado(false);
        cliente.setTieneEntrenadorPermanente(false);

        Remision remision = cliente.getRemision();
        if (remision != null) {
            remision.setEstado(EstadoRemision.CANCELADO_ANTICIPADAMENTE);
            remision.setMotivoCancelacion(motivo);
            remisionRepository.save(remision);
        }

        asignacionEntrenadorService.liberar(cliente);
        return beneficiarioEpsRepository.save(cliente);
    }


    // ==================== VALIDACIONES ====================
    // ==================== REPORTES ====================

    public List<ContratoVencidoDTO> consultarContratosVencidos() {
        LocalDate hoy = LocalDate.now();
        return contratoRepository.findByFechaVencimientoBefore(hoy).stream()
                .filter(contrato -> contrato.getCliente() != null)
                .map(contrato -> new ContratoVencidoDTO(
                        contrato.getId(),
                        contrato.getCliente().getNumeroDeDocumento(),
                        contrato.getCliente().getNombreCompleto(),
                        contrato.getTipoMembresia(),
                        contrato.getFechaInicio(),
                        contrato.getFechaVencimiento(),
                        ChronoUnit.DAYS.between(contrato.getFechaVencimiento(), hoy)))
                .toList();
    }

    public List<BeneficiarioEps> consultarBeneficiariosEPSActivos() {
        return beneficiarioEpsRepository.findByEstadoContrato(EstadoContratoEps.ACTIVO);
    }
}