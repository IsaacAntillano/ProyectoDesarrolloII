package com.victuscaf;

import java.time.LocalDate;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.victuscaf.gimnasio.dto.UsuarioSistemaRequestDTO;
import com.victuscaf.gimnasio.models.EstadoEquipo;
import com.victuscaf.gimnasio.models.Equipo;
import com.victuscaf.gimnasio.models.Rol;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import com.victuscaf.gimnasio.repository.EquipoRepository;
import com.victuscaf.gimnasio.repository.UsuarioSistemaRepository;
import com.victuscaf.gimnasio.service.PagoService;
import com.victuscaf.gimnasio.service.UsuarioSistemaService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Carga de datos inicial: usuarios del sistema, tarifas y equipos típicos.
 *
 * <p>Se ejecuta una sola vez, al levantar la aplicación, y solo si la base no
 * tiene usuarios del sistema. Es idempotente: no duplica nunca, y no borra lo
 * que ya exista. Facilita levantar el proyecto para una demo sin migrar datos a
 * mano.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UsuarioSistemaService usuarioSistemaService;
    private final PagoService pagoService;
    private final EquipoRepository equipoRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (!usuarioSistemaRepository.findAll().isEmpty()) {
            log.info("Seeder: ya existen usuarios del sistema, no se cargan datos iniciales");
            return;
        }

        log.info("Seeder: base vacia, cargando datos iniciales");

        crearUsuario("CC", 100000001L, "Ana Administradora", 3001234567L,
                "ana@victus.co", Rol.ADMINISTRADOR, "admin123");
        crearUsuario("CC", 100000002L, "Sara Secretaria", 3007654321L,
                "sara@victus.co", Rol.SECRETARIA, "secretaria123");
        crearUsuario("CC", 100000003L, "Enzo Entrenador", 3009998888L,
                "enzo@victus.co", Rol.ENTRENADOR, "entrenador123");

        // Tarifas por defecto (valores que luego se pueden ajustar por la API).
        pagoService.actualizarTarifa(TipoDeCliente.PARTICULAR_MENSUAL, 85000, 15000, 95000, 100000001L);
        pagoService.actualizarTarifa(TipoDeCliente.PARTICULAR_DIARIO, 0, 15000, 17000, 100000001L);
        pagoService.actualizarTarifa(TipoDeCliente.BENEFICIARIO_EPS, 0, 0, 60000, 100000001L);

        // Equipos de ejemplo con mantenimiento en los proximos 5 dias.
        crearEquipo("Trotadora 01", "Cinta electrica profesional", EstadoEquipo.OPERATIVO, 30);
        crearEquipo("Bicicleta Estática 02", "Spinning", EstadoEquipo.EN_MANTENIMIENTO, 3);
        crearEquipo("Pesa olímpica 03", "Juego de discos", EstadoEquipo.OPERATIVO, 90);

        log.info("Seeder: datos iniciales cargados");
    }

    private void crearUsuario(String tipoDoc, Long numero, String nombre, Long telefono,
                              String correo, Rol rol, String contrasena) {
        UsuarioSistemaRequestDTO dto = new UsuarioSistemaRequestDTO();
        dto.setTipoDeDocumento(tipoDoc);
        dto.setNumeroDeDocumento(numero);
        dto.setNombreCompleto(nombre);
        dto.setTelefono(telefono);
        dto.setCorreoElectronico(correo);
        dto.setRol(rol);
        dto.setContrasena(contrasena);
        try {
            usuarioSistemaService.crear(dto);
        } catch (Exception e) {
            log.warn("Seeder: no se pudo crear '{}': {}", nombre, e.getMessage());
        }
    }

    private void crearEquipo(String nombre, String descripcion, EstadoEquipo estado, long diasAMantenimiento) {
        Equipo e = new Equipo();
        e.setNombre(nombre);
        e.setDescripcion(descripcion);
        e.setFechaAdquisicion(LocalDate.now().minusMonths(6));
        e.setEstadoEquipo(estado);
        e.setProximoMantenimiento(LocalDate.now().plusDays(diasAMantenimiento));
        equipoRepository.save(e);
    }
}