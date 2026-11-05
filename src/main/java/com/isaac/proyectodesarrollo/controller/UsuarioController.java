package com.isaac.proyectodesarrollo.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.isaac.proyectodesarrollo.model.entity.Usuario;
import com.isaac.proyectodesarrollo.model.enums.RolUsuario;
import com.isaac.proyectodesarrollo.service.UsuarioService;

@Controller
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public String listar(@RequestParam(required = false) String search,
                         @RequestParam(required = false, defaultValue = "false") boolean mostrarTodos,
                         Model model) {
        List<Usuario> usuarios;
        if (search != null && !search.isEmpty()) {
            usuarios = usuarioService.buscarPorUsername(search);
        } else if (mostrarTodos) {
            usuarios = usuarioService.listarTodos();
        } else {
            usuarios = usuarioService.listarActivos();
        }
        model.addAttribute("usuarios", usuarios);
        return "usuarios/lista";
    }

    @GetMapping("/nuevo")
    public String nuevo(Model model) {
        model.addAttribute("usuario", new Usuario());
        model.addAttribute("roles", RolUsuario.values());
        return "usuarios/formulario";
    }

    @PostMapping
    public String guardar(@ModelAttribute Usuario usuario, RedirectAttributes redirect) {
        usuarioService.guardar(usuario);
        redirect.addFlashAttribute("mensaje", "Usuario creado exitosamente");
        return "redirect:/usuarios";
    }

    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        Usuario usuario = usuarioService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        model.addAttribute("usuario", usuario);
        model.addAttribute("roles", RolUsuario.values());
        return "usuarios/formulario";
    }

    @PostMapping("/{id}")
    public String actualizar(@PathVariable Long id, @ModelAttribute Usuario usuario, RedirectAttributes redirect) {
        usuario.setId(id);
        usuarioService.guardar(usuario);
        redirect.addFlashAttribute("mensaje", "Usuario actualizado");
        return "redirect:/usuarios";
    }

    @GetMapping("/desactivar/{id}")
    public String desactivar(@PathVariable Long id, RedirectAttributes redirect) {
        usuarioService.desactivar(id);
        redirect.addFlashAttribute("mensaje", "Usuario desactivado");
        return "redirect:/usuarios";
    }

    @GetMapping("/reactivar/{id}")
    public String reactivar(@PathVariable Long id, RedirectAttributes redirect) {
        usuarioService.reactivar(id);
        redirect.addFlashAttribute("mensaje", "Usuario reactivado");
        return "redirect:/usuarios";
    }

    @GetMapping("/eliminar/{id}")
    public String eliminar(@PathVariable Long id, RedirectAttributes redirect) {
        usuarioService.eliminar(id);
        redirect.addFlashAttribute("mensaje", "Usuario eliminado definitivamente");
        return "redirect:/usuarios";
    }
}