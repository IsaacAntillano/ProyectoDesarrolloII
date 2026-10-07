package com.victuscaf.modules.client.controller;

import com.victuscaf.modules.client.dto.ApiResponse;
import com.victuscaf.modules.client.dto.UsuarioSistemaRequestDTO;
import com.victuscaf.modules.client.models.UsuarioSistema;
import com.victuscaf.modules.client.service.UsuarioSistemaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-sistema")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UsuarioSistemaController {

    private final UsuarioSistemaService usuarioSistemaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioSistema>>> listar() {
        return ResponseEntity.ok(ApiResponse.success("Lista de usuarios del sistema", usuarioSistemaService.listarTodos()));
    }

    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<UsuarioSistema>> buscar(@RequestParam Long documento) {
        return ResponseEntity.ok(ApiResponse.success("Usuario encontrado", usuarioSistemaService.buscarPorDocumento(documento)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioSistema>> crear(@Valid @RequestBody UsuarioSistemaRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Usuario creado", usuarioSistemaService.crear(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioSistema>> actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioSistemaRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Usuario actualizado", usuarioSistemaService.actualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        usuarioSistemaService.desactivar(id);
        return ResponseEntity.ok(ApiResponse.success("Usuario desactivado", null));
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<ApiResponse<UsuarioSistema>> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Usuario reactivado", usuarioSistemaService.reactivar(id)));
    }
}
