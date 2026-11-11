package com.victuscaf.gimnasio.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.AsignacionEntrenador;
import com.victuscaf.gimnasio.models.Entrenador;
import com.victuscaf.gimnasio.models.OrigenAsignacion;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.repository.AsignacionEntrenadorRepository;
import com.victuscaf.gimnasio.repository.EntrenadorRepository;

import lombok.RequiredArgsConstructor;

/**
 * Administra la relacion cliente-entrenador.
 *
 * <p>Reglas:
 * <ul>
 *   <li>Un cliente tiene como maximo una asignacion activa.</li>
 *   <li>Un entrenador atiende como maximo {@value #MAX_CLIENTES_POR_ENTRENADOR}
 *       clientes activos.</li>
 *   <li>Una asignacion con {@code fechaFin} vencida se cierra automaticamente
 *       (es el caso del entrenador incluido el primer mes).</li>
 * </ul>
 *
 * <p>El campo {@code cantidadClientesActivos} del entrenador se recalcula desde
 * las asignaciones para que no quede desfasado.
 */
@Service
@RequiredArgsConstructor
public class AsignacionEntrenadorService {

    public static final int MAX_CLIENTES_POR_ENTRENADOR = 4;

    private final AsignacionEntrenadorRepository asignacionRepository;
    private final EntrenadorRepository entrenadorRepository;

    @Transactional
    public AsignacionEntrenador asignar(Usuario cliente,
                                        Entrenador entrenador,
                                        OrigenAsignacion origen,
                                        LocalDate fechaFin) {
        if (cliente == null || !Boolean.TRUE.equals(cliente.getEstado())) {
            throw new RuntimeException("El cliente no esta activo");
        }
        if (entrenador == null || !Boolean.TRUE.equals(entrenador.getEstado())) {
            throw new RuntimeException("El entrenador no esta activo");
        }

        expirarVencidas();
        Set<Entrenador> afectados = new HashSet<>();

        asignacionRepository.findByClienteAndActivaTrue(cliente).ifPresent(anterior -> {
            anterior.setActiva(false);
            anterior.setFechaFin(LocalDate.now());
            asignacionRepository.save(anterior);
            afectados.add(anterior.getEntrenador());
        });

        long activas = asignacionRepository.countByEntrenadorAndActivaTrue(entrenador);
        if (activas >= MAX_CLIENTES_POR_ENTRENADOR) {
            throw new RuntimeException("El entrenador " + entrenador.getNombreCompleto()
                    + " ya tiene el maximo de " + MAX_CLIENTES_POR_ENTRENADOR + " clientes activos");
        }

        AsignacionEntrenador asignacion = new AsignacionEntrenador();
        asignacion.setCliente(cliente);
        asignacion.setEntrenador(entrenador);
        asignacion.setFechaAsignacion(LocalDate.now());
        asignacion.setFechaFin(fechaFin);
        asignacion.setActiva(true);
        asignacion.setOrigen(origen);

        AsignacionEntrenador guardada = asignacionRepository.save(asignacion);
        afectados.add(entrenador);
        afectados.forEach(this::sincronizarContador);
        return guardada;
    }

    /** Cierra la asignacion activa del cliente, si existe. */
    @Transactional
    public void liberar(Usuario cliente) {
        asignacionRepository.findByClienteAndActivaTrue(cliente).ifPresent(asignacion -> {
            asignacion.setActiva(false);
            asignacion.setFechaFin(LocalDate.now());
            asignacionRepository.save(asignacion);
            sincronizarContador(asignacion.getEntrenador());
        });
    }

    /** Asignacion vigente del cliente (cierra antes las que ya vencieron). */
    @Transactional
    public Optional<AsignacionEntrenador> asignacionActiva(Usuario cliente) {
        expirarVencidas();
        return asignacionRepository.findByClienteAndActivaTrue(cliente);
    }

    @Transactional
    public long contarClientesActivos(Entrenador entrenador) {
        expirarVencidas();
        return asignacionRepository.countByEntrenadorAndActivaTrue(entrenador);
    }

    @Transactional
    public List<AsignacionEntrenador> listarActivasPorEntrenador(Entrenador entrenador) {
        expirarVencidas();
        return asignacionRepository.findByEntrenadorAndActivaTrue(entrenador);
    }

    /**
     * Valida que el cliente tenga una asignacion activa con el entrenador.
     *
     * <p>Si el documento no corresponde a un entrenador (por ejemplo, un
     * administrador) no se valida nada: el rol ADMINISTRADOR puede operar
     * sobre cualquier cliente.
     */
    @Transactional
    public void validarAsignacionActiva(Long documentoEntrenador, Usuario cliente) {
        var entrenadorOpt = entrenadorRepository.findByNumeroDeDocumento(documentoEntrenador);
        if (entrenadorOpt.isEmpty()) {
            return;
        }
        Entrenador entrenador = entrenadorOpt.get();
        AsignacionEntrenador asignacion = asignacionActiva(cliente)
                .orElseThrow(() -> new RuntimeException("El cliente no tiene un entrenador asignado"));
        if (asignacion.getEntrenador() == null
                || !asignacion.getEntrenador().getIdUsuarioSistema()
                        .equals(entrenador.getIdUsuarioSistema())) {
            throw new RuntimeException("El cliente no esta asignado a ti");
        }
    }

    /** Cierra las asignaciones cuya fecha de fin ya paso. */
    @Transactional
    public void expirarVencidas() {
        List<AsignacionEntrenador> vencidas =
                asignacionRepository.findByActivaTrueAndFechaFinBefore(LocalDate.now());
        if (vencidas.isEmpty()) {
            return;
        }
        Set<Entrenador> afectados = new HashSet<>();
        for (AsignacionEntrenador asignacion : vencidas) {
            asignacion.setActiva(false);
            afectados.add(asignacion.getEntrenador());
        }
        asignacionRepository.saveAll(vencidas);
        afectados.forEach(this::sincronizarContador);
    }

    private void sincronizarContador(Entrenador entrenador) {
        if (entrenador == null) {
            return;
        }
        long activas = asignacionRepository.countByEntrenadorAndActivaTrue(entrenador);
        entrenador.setCantidadClientesActivos((int) activas);
        entrenadorRepository.save(entrenador);
    }
}
