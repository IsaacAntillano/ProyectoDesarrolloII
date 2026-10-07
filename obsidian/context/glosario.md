# Glosario de dominio

Términos usados en el código y el dominio del gimnasio (clases en `models/` y `dto/`).

## Roles
- **ADMINISTRADOR**: gestión total (admin, inventario, flujo de caja).
- **SECRETARIA**: registra clientes, entrega/clases, bitácora.
- **ENTRENADOR**: rutinas, horarios, evaluación de clientes.
- **CLIENTE**: usuario final que consulta su estado.

## Tipos de cliente / membresía
- **ParticularDiario / ParticularMensual**: clientes que pagan tarifa propia.
- **BeneficiarioEps**: clientes cubiertos por EPS (contrato + facturación EPS).
- **TipoDeMembresia**: tipos de membresía; **TipoDeCliente**, **TipoDePago**.

## Contratos y facturación
- **Contrato** · **EstadoContratoEps / Particular**: ciclo del contrato con la EPS.
- **FacturaEps** · **EstadoFacturaEps**: facturación de sesiones cubiertas.
- **Remision** · **EstadoRemision**: remisiones de pacientes.

## Pagos y finanzas
- **Pago** · **EstadoPago** · **MetodoDePago**.
- **FlujoDeCaja** · **GastoOperativo** · **TipoGasto**: caja y gastos.
- **Tarifa** (dto `TarifaDTO`).

## Gimnasio / operación
- **Equipo** · **EstadoEquipo** · **RegistroMantenimiento**: inventario y mantenimiento.
- **Asistencia**: entradas/salidas de clientes.
- **EvaluacionFisica** · **Medidas** (dto) · **MetaFisica** · **Rutina**: progreso del cliente.
- **HorarioEntrenador** · **Turno**: agenda de entrenadores.

## Usuarios y sistema
- **Usuario** · **UsuarioSistema** · **Administrador** · **Secretaria** · **Entrenador** · **Rol**.
- **BitacoraAccion** · **TipoAccion**: trazabilidad de acciones.
- **Notificacion** · **Mensaje**: avisos internos.

## Técnico
- **DTO**: objeto de transferencia de datos (`com.victuscaf.modules.client.dto`).
- **JWT**: token Bearer emitido en `/api/auth/login`.
- **@PreAuthorize**: anotación Spring para control por rol.