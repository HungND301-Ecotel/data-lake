package com.quangnt0000.be_modul;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class BeModulApplication {

	public static void main(String[] args) {
		SpringApplication.run(BeModulApplication.class, args);
	}
}
