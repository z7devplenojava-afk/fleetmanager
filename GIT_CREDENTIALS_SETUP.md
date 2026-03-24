# 🔐 Configuração de Credenciais do Git

Este documento descreve como configurar o Git para não pedir autenticação via navegador.

## ✅ Configurações Aplicadas

As seguintes configurações foram aplicadas:

1. **Credential Helper**: `store` - armazena credenciais em arquivo
2. **Credential Interactive**: `never` - nunca pede interação
3. **Core AskPass**: vazio - desabilita prompt de senha
4. **URL Rewrite**: configuração para usar token automaticamente
5. **Arquivo .git-credentials**: criado com suas credenciais

## 📋 Verificar Configurações

Execute os seguintes comandos para verificar:

```powershell
# Verificar credential helper
git config --global --get credential.helper

# Verificar credential interactive
git config --global --get credential.interactive

# Verificar core.askpass
git config --global --get core.askpass

# Verificar URL rewrite
git config --global --get-regexp url

# Verificar arquivo de credenciais
Get-Content $env:USERPROFILE\.git-credentials
```

## 🔧 Reconfigurar (se necessário)

Se ainda estiver pedindo autenticação, execute:

```powershell
# 1. Configurar credential helper
git config --global credential.helper store
git config --global credential.https://github.com.helper store

# 2. Desabilitar prompts
git config --global core.askpass ""
git config --global credential.interactive never

# 3. Criar arquivo de credenciais
echo "https://zmarioramos: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@github.com" | Out-File -FilePath "$env:USERPROFILE\.git-credentials" -Encoding ASCII -NoNewline

# 4. Configurar URL rewrite
git config --global url."https://zmarioramos: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@github.com/".insteadOf "https://github.com/"
```

## 🧪 Testar

Teste a configuração com:

```powershell
git fetch
# ou
git pull
# ou
git push
```

Se ainda pedir autenticação, tente:

1. **Fechar e reabrir o terminal** - as configurações podem precisar de uma nova sessão
2. **Verificar se o Git Credential Manager está interferindo**:
   ```powershell
   git config --global --unset credential.helper
   git config --global credential.helper store
   ```
3. **Usar variáveis de ambiente** (alternativa):
   ```powershell
   $env:GIT_ASKPASS = ""
   $env:GIT_TERMINAL_PROMPT = "0"
   ```

## 📝 Notas

- O arquivo `.git-credentials` está localizado em: `%USERPROFILE%\.git-credentials`
- As configurações globais estão em: `%USERPROFILE%\.gitconfig`
- No Windows, o Git pode usar o Credential Manager. Se isso acontecer, você pode precisar desabilitá-lo:
  ```powershell
  git config --global credential.helper manager-core
  # Ou removê-lo completamente:
  git config --global --unset credential.helper
  git config --global credential.helper store
  ```



















