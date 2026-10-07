package com.victuscaf.modules.client.controller;

import com.victuscaf.modules.client.dto.RegistroIngresoDTO;
import com.victuscaf.modules.client.models.Asistencia;
import com.victuscaf.modules.client.service.AccesoService;
import com.victuscaf.modules.client.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/acceso")
@RequiredArgsConstructor
public class AccesoController {

    private final AccesoService accesoService;

    @PostMapping("/registrar-ingreso")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ApiResponse<Asistencia> registrarIngreso(@Valid @RequestBody RegistroIngresoDTO dto) {
        return ApiResponse.success("Ingreso registrado correctamente",
                accesoService.registrarIngreso(dto.numeroDocumento()));
    }
}