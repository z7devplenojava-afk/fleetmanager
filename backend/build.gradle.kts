plugins {
    id("org.springframework.boot") version "3.3.4"
    id("io.spring.dependency-management") version "1.1.6"
    java
}

group = "br.com.fleetmanager"
version = "0.0.1-SNAPSHOT"
description = "Sistema de Gestao de Empresas de Transporte de Pessoal"

val jjwtVersion by extra { "0.11.5" }
val lombokVersion by extra { "1.18.30" }

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

extra["springAiVersion"] = "1.0.2"

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-web-services")
    
    // Spring AI
    implementation("org.springframework.ai:spring-ai-pdf-document-reader")
    developmentOnly("org.springframework.ai:spring-ai-spring-boot-docker-compose")
    
    // OpenAPI/Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")
    
    // Micrometer
    implementation("io.micrometer:micrometer-registry-prometheus")
    
    // JWT Dependencies
    implementation("io.jsonwebtoken:jjwt-api:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jjwtVersion")
    
    // Database
    runtimeOnly("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core:10.8.1")
    runtimeOnly("com.h2database:h2")
    
    // Lombok
    compileOnly("org.projectlombok:lombok:$lombokVersion")
    annotationProcessor("org.projectlombok:lombok:$lombokVersion")
    
    // Apache Commons
    implementation("org.apache.commons:commons-text:1.11.0")
    implementation("org.apache.commons:commons-math3:3.6.1")
    implementation("org.apache.commons:commons-imaging:1.0-alpha3")
    
    // Apache POI for Excel
    implementation("org.apache.poi:poi:5.2.4")
    implementation("org.apache.poi:poi-ooxml:5.2.4")
    
    // PDF Libraries
    implementation("org.apache.pdfbox:pdfbox:2.0.29")
    implementation("com.itextpdf:itext7-core:7.2.5")
    implementation("com.itextpdf:kernel:7.2.5")
    implementation("com.itextpdf:io:7.2.5")
    implementation("com.itextpdf:layout:7.2.5")
    implementation("com.itextpdf:pdfa:7.2.5")
    implementation("org.xhtmlrenderer:flying-saucer-pdf:9.1.22")
    
    // JasperReports
    implementation("net.sf.jasperreports:jasperreports:6.20.6")
    implementation("net.sf.jasperreports:jasperreports-fonts:6.20.6")
    implementation("com.github.librepdf:openpdf:1.3.30")
    
    // OCR
    implementation("net.sourceforge.tess4j:tess4j:5.8.0")
    
    // Cache
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")
    
    // Rate Limiting
    implementation("com.bucket4j:bucket4j-core:8.7.0")
    
    // Cryptography
    implementation("org.bouncycastle:bcprov-jdk18on:1.77")
    implementation("org.bouncycastle:bcpkix-jdk18on:1.77")
    
    // Development
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
    
    // Test Dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.9.2")
    testImplementation("org.junit.jupiter:junit-jupiter-engine:5.9.2")
    testImplementation("org.mockito:mockito-core:5.3.1")
    testImplementation("org.mockito:mockito-junit-jupiter:5.3.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testRuntimeOnly("com.h2database:h2")
}

dependencyManagement {
	imports {
		mavenBom("org.springframework.ai:spring-ai-bom:${property("springAiVersion")}")
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}
