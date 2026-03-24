# Guia de Instalação do SeetaFace2

## Passo 2: Integrar a biblioteca SeetaFace2 no backend

### 1. Download do SeetaFace2

1. Acesse o repositório oficial: https://github.com/seetafaceengine/SeetaFace2
2. Baixe a versão mais recente
3. Extraia os arquivos em uma pasta local

### 2. Estrutura de Arquivos Necessários

```
backend/
├── src/main/java/com/z7design/secured_guard/
│   ├── service/SeetaFace2Service.java (já criado)
│   └── config/SeetaFace2Config.java (criar)
├── src/main/resources/
│   ├── seetaface2/
│   │   ├── models/
│   │   │   ├── face_detector.csta
│   │   │   ├── face_landmarker_pts5.csta
│   │   │   └── face_recognizer.csta
│   │   └── lib/
│   │       ├── seetaface2.dll (Windows)
│   │       ├── libseetaface2.so (Linux)
│   │       └── libseetaface2.dylib (macOS)
└── pom.xml (atualizar)
```

### 3. Configuração do Maven (pom.xml)

Adicione as seguintes dependências no `pom.xml`:

```xml
<!-- SeetaFace2 JNI -->
<dependency>
    <groupId>com.seetaface</groupId>
    <artifactId>seetaface2-jni</artifactId>
    <version>1.0.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/src/main/resources/seetaface2/lib/seetaface2-jni.jar</systemPath>
</dependency>

<!-- OpenCV para processamento de imagens -->
<dependency>
    <groupId>org.openpnp</groupId>
    <artifactId>opencv</artifactId>
    <version>4.5.1-2</version>
</dependency>
```

### 4. Criar SeetaFace2Config.java

```java
package com.z7design.secured_guard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@Configuration
public class SeetaFace2Config {
    
    @Bean
    public String seetaFace2ModelPath() {
        try {
            // Carregar modelos do classpath
            Resource resource = new ClassPathResource("seetaface2/models/");
            File modelDir = resource.getFile();
            
            // Carregar biblioteca nativa
            loadNativeLibrary();
            
            return modelDir.getAbsolutePath();
        } catch (IOException e) {
            throw new RuntimeException("Erro ao carregar modelos do SeetaFace2", e);
        }
    }
    
    private void loadNativeLibrary() {
        try {
            String osName = System.getProperty("os.name").toLowerCase();
            String libraryName;
            
            if (osName.contains("win")) {
                libraryName = "seetaface2.dll";
            } else if (osName.contains("linux")) {
                libraryName = "libseetaface2.so";
            } else if (osName.contains("mac")) {
                libraryName = "libseetaface2.dylib";
            } else {
                throw new UnsupportedOperationException("Sistema operacional não suportado: " + osName);
            }
            
            // Carregar biblioteca nativa
            System.loadLibrary("seetaface2");
            
        } catch (UnsatisfiedLinkError e) {
            throw new RuntimeException("Erro ao carregar biblioteca nativa do SeetaFace2", e);
        }
    }
}
```

### 5. Atualizar SeetaFace2Service.java

Substitua os métodos placeholder pelos métodos reais do SeetaFace2:

```java
private byte[] extractFaceTemplate(MultipartFile imageFile) throws IOException {
    // TODO: Implementar extração real usando SeetaFace2
    // 1. Carregar imagem
    // 2. Detectar face
    // 3. Extrair landmarks
    // 4. Gerar template
    // 5. Retornar template binário
    
    log.debug("Extraindo template facial da imagem: {}", imageFile.getOriginalFilename());
    return imageFile.getBytes(); // Placeholder
}

private double calculateFaceQuality(MultipartFile imageFile) throws IOException {
    // TODO: Implementar cálculo real de qualidade
    // 1. Carregar imagem
    // 2. Detectar face
    // 3. Calcular qualidade baseada em:
    //    - Resolução
    //    - Iluminação
    //    - Ângulo da face
    //    - Nitidez
    
    log.debug("Calculando qualidade da face da imagem: {}", imageFile.getOriginalFilename());
    return 60.0 + Math.random() * 35.0; // Placeholder
}

private double calculateSimilarity(byte[] template1, byte[] template2) {
    // TODO: Implementar cálculo real de similaridade
    // 1. Carregar templates
    // 2. Calcular distância euclidiana
    // 3. Converter para score de similaridade (0-100)
    
    log.debug("Calculando similaridade entre templates");
    return Math.random() * 100.0; // Placeholder
}
```

### 6. Configuração de Ambiente

#### Windows:
1. Instalar Visual Studio 2019 ou superior
2. Instalar CMake
3. Compilar SeetaFace2 seguindo as instruções do repositório

#### Linux:
1. Instalar dependências:
```bash
sudo apt-get update
sudo apt-get install build-essential cmake libopencv-dev
```
2. Compilar SeetaFace2

#### macOS:
1. Instalar Xcode Command Line Tools
2. Instalar CMake via Homebrew
3. Compilar SeetaFace2

### 7. Teste de Funcionamento

Criar um endpoint de teste:

```java
@GetMapping("/test-seetaface2")
public ResponseEntity<Map<String, Object>> testSeetaFace2() {
    try {
        // Testar carregamento da biblioteca
        String modelPath = seetaFace2ModelPath();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("modelPath", modelPath);
        response.put("libraryLoaded", true);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", e.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

### 8. Próximos Passos

1. ✅ Executar migração SQL (Passo 1)
2. 🔄 Integrar SeetaFace2 (Passo 2) - Em andamento
3. ⏳ Testar com imagens reais (Passo 3)
4. ⏳ Ajustar thresholds (Passo 4)

### Notas Importantes

- A biblioteca SeetaFace2 é proprietária e requer licença para uso comercial
- Para desenvolvimento/teste, use a versão de demonstração
- Certifique-se de que os modelos estão na versão correta
- A biblioteca nativa deve ser compatível com a arquitetura do sistema (x64/x86)
