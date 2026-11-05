package com.victuscaf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VictusCafApplication {

    public static void main(String[] args) {
        SpringApplication.run(VictusCafApplication.class, args);
    }

}
