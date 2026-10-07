package com.victuscaf.gimnasio.controller;

import com.victuscaf.gimnasio.dto.RegistroIngresoDTO;
import com.victuscaf.gimnasio.models.Asistencia;
import com.victuscaf.gimnasio.service.AccesoService;
import com.victuscaf.gimnasio.dto.ApiResponse;
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