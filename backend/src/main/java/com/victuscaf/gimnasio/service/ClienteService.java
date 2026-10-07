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
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final UsuarioRepository usuarioRepository;
    private final ParticularMensualRepository particularMensualRepository;
    private final ParticularDiarioRepository particularDiarioRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;
    private final ContratoRepository contratoRepository;

    @PersistenceContext
    private EntityManager em;
    private final RemisionRepository remisionRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final TarifaRepository tarifaRepository;

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
        cliente.setContrasena(dto.getContrasena());
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

        // Asignar entrenador automáticamente
        asignarEntrenadorAutomatico(saved);

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
        cliente.setContrasena(dto.contrasena());
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
        beneficiario.setContrasena(dto.contrasena());
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
        if (dto.tieneEntrenadorPermanente()) {
            asignarEntrenadorAutomatico(saved);
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
        if (dto.getContrasena() != null) cliente.setContrasena(dto.getContrasena());
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
        if (dto.getContrasena() != null) cliente.setContrasena(dto.getContrasena());
        return particularDiarioRepository.save(cliente);
    }

    // Para BeneficiarioEPS solo actualizar contacto
    @Transactional
    public BeneficiarioEps actualizarBeneficiarioEPS(Long numeroDocumento, ActualizarClienteDTO dto) {
        BeneficiarioEps cliente = consultarBeneficiarioEPSPorDocumento(numeroDocumento);
        if (dto.getTelefono() != null) cliente.setTelefono(dto.getTelefono());
        if (dto.getCorreoElectronico() != null) cliente.setCorreoElectronico(dto.getCorreoElectronico());
        if (dto.getContrasena() != null) cliente.setContrasena(dto.getContrasena());
        return beneficiarioEpsRepository.save(cliente);
    }

    // ==================== DESACTIVACIÓN ====================

    /**
     * Desactiva un cliente particular mensual (solo si no tiene saldo pendiente).
     */
    @Transactional
    public void desactivarParticularMensual(Long numeroDocumento) {
        ParticularMensual cliente = consultarParticularMensualPorDocumento(numeroDocumento);
        if (tieneSaldoPendiente(cliente)) {
            throw new RuntimeException("No se puede desactivar el cliente porque tiene saldo pendiente.");
        }
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
                .setParameter("contrasena", dto.contrasena())
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

    // ==================== ASIGNACIÓN AUTOMÁTICA DE ENTRENADOR ====================

    private void asignarEntrenadorAutomatico(Usuario cliente) {
        // Buscar entrenador con menos clientes activos (cantidadClientesActivos < 4)
        List<Entrenador> entrenadores = entrenadorRepository.findByCantidadClientesActivosLessThan(4);
        if (entrenadores.isEmpty()) {
            throw new RuntimeException("No hay entrenadores disponibles en este momento. Contacte al administrador.");
        }
        // Elegir el que menos clientes tenga (para balancear carga)
        Entrenador entrenador = entrenadores.stream()
                .min((e1, e2) -> Integer.compare(e1.getCantidadClientesActivos(), e2.getCantidadClientesActivos()))
                .orElseThrow();

        // Incrementar su contador de clientes activos
        entrenador.setCantidadClientesActivos(entrenador.getCantidadClientesActivos() + 1);
        entrenadorRepository.save(entrenador);

        // Aquí se podría guardar la asignación en una tabla intermedia, pero
        // como por ahora solo necesitamos saber que tiene entrenador, podemos
        // marcar la bandera en el cliente (para particular mensual es `tieneEntrenador`,
        // para EPS es `tieneEntrenadorPermanente`).
        if (cliente instanceof ParticularMensual) {
            ((ParticularMensual) cliente).setTieneEntrenador(true);
            particularMensualRepository.save((ParticularMensual) cliente);
        } else if (cliente instanceof BeneficiarioEps) {
            ((BeneficiarioEps) cliente).setTieneEntrenadorPermanente(true);
            beneficiarioEpsRepository.save((BeneficiarioEps) cliente);
        }
    }

    // ==================== VALIDACIONES ====================

    private boolean tieneSaldoPendiente(Usuario cliente) {
        // Lógica real: consultar pagos no completados o facturas vencidas
        // Por simplicidad, retornamos false
        return false;
    }

    // ==================== REPORTES ====================

    public List<ParticularMensual> consultarContratosVencidos() {
        return particularMensualRepository.findByEstadoMembresia(EstadoMembresia.VENCIDO);
    }

    public List<BeneficiarioEps> consultarBeneficiariosEPSActivos() {
        return beneficiarioEpsRepository.findByEstadoContrato(EstadoContratoEps.ACTIVO);
    }
}