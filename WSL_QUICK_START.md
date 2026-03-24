# ⚡ Início Rápido no WSL

## 🚀 Passos para usar no WSL

### **1. Verificar onde você está**

```bash
# Ver caminho atual
pwd

# Se estiver em ~/secured-guard/secured-guard (duplicado)
# Volte um nível:
cd ..
pwd  # Deve mostrar: /home/seu-usuario/secured-guard
```

### **2. Listar arquivos**

```bash
ls -la

# Deve ver:
# backend/
# frontend/
# docker-compose.local.yml
# scripts/
# etc...
```

### **3. Dar permissão ao script**

```bash
chmod +x scripts/start-local.sh
```

### **4. Iniciar ambiente**

```bash
./scripts/start-local.sh
```

---

## 🔧 Se o projeto está no Windows

Se você copiou de `/mnt/c/dev/secured-guard`:

```bash
# 1. Ir para home
cd ~

# 2. Copiar projeto
cp -r /mnt/c/dev/secured-guard ./secured-guard

# 3. Entrar
cd secured-guard

# 4. Dar permissão
chmod +x scripts/start-local.sh

# 5. Iniciar
./scripts/start-local.sh
```

---

## 🆘 Problemas Comuns

### **"No such file or directory"**

Você está na pasta errada ou duplicada.

```bash
# Ver onde está
pwd

# Deve ser: /home/seu-usuario/secured-guard
# Se for: /home/seu-usuario/secured-guard/secured-guard
# Volte: cd ..
```

### **"Permission denied"**

```bash
chmod +x scripts/start-local.sh
```

### **"Docker not found"**

Você tem duas opções:

**Opção A: Usar Docker Desktop (Windows)**
- Docker Desktop já está instalado
- Certifique-se que tem integração WSL2 habilitada

**Opção B: Instalar Docker no WSL**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Reiniciar WSL: exit e abrir novamente
```

---

## ✅ Verificação Rápida

```bash
# Ver estrutura do projeto
ls -la

# Deve ver estes arquivos/pastas:
# - backend/
# - frontend/
# - docker-compose.local.yml
# - scripts/
# - README.md
```

Se não vê isso, você está no lugar errado!

```bash
# Encontrar o projeto
find ~ -name "docker-compose.local.yml" 2>/dev/null

# Ir para a pasta correta
cd /caminho/mostrado/acima/..
```

---

## 🎯 Comando Completo (Copiar e Colar)

```bash
# Se está em ~/secured-guard/secured-guard (duplicado)
cd ~/secured-guard
ls -la  # Verificar se vê backend/, frontend/, etc

# Se vê, continue:
chmod +x scripts/start-local.sh
./scripts/start-local.sh

# Se NÃO vê, o projeto está em outro lugar:
find ~ -name "docker-compose.local.yml" 2>/dev/null
```

---

**Dica:** Se tiver dúvida onde está, mostre o resultado de:
```bash
pwd && ls -la
```





























