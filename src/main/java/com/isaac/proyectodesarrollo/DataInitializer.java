package com.isaac.proyectodesarrollo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.isaac.proyectodesarrollo.service.UsuarioService;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioService usuarioService;

    public DataInitializer(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @Override
    public void run(String... args) {
        usuarioService.crearAdminSiNoExiste();
    }
}