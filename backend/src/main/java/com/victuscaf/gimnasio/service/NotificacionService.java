package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.models.*;
import com.victuscaf.gimnasio.repository.*;
import com.victuscaf.gimnasio.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;

    public void generarReporteCopagoPendiente(BeneficiarioEps eps) {
        // Simula la generación de un reporte para la EPS
        System.out.println("Reporte de copago pendiente para EPS " + eps.getRemision().getEntidadEps() +
                " - Paciente: " + eps.getNombreCompleto());
    }
}