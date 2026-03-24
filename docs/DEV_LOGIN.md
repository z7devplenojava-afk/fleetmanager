# Login em desenvolvimento (frontend + backend)

## Checklist rápido

1. **Backend** rodando em **`http://localhost:8083`** (perfil `local` / `application-local.properties`).
2. **Frontend** com Vite em **`http://localhost:3000`** (use **HTTP**, não `https://`, salvo `VITE_DEV_HTTPS=true`).
3. `VITE_API_URL=/api` no `.env` do frontend → o proxy do Vite encaminha para `http://localhost:8083`.

## Testar se a API responde

No navegador ou curl:

```text
http://localhost:8083/api/auth/test/health
```

Deve retornar JSON com `status: ok`.

## Credenciais (o campo de login é o *username*, não o e-mail)

| Usuário      | Senhas possíveis (depende do que foi aplicado no seu banco) |
|-------------|-------------------------------------------------------------|
| `superadmin`| Migration manual: `Password123!` (ver `insert_superadmin_user.sql`) |
| `jose.ramos`| Migration V425: `Password123!` — **ou** `FlexBus@2026` se alguém já chamou o endpoint de correção no backend (`/api/auth/test/fix-jose-ramos`) |

Se `superadmin` não existir no banco `fleetmanager_test`, rode as migrations Flyway ou execute o script SQL de seed adequado.

## Erro “sem empresa” / redirecionamento para solicitar acesso

O backend exige **empresa vinculada** para usuários que **não** têm um destes papéis: `SUPER_ADMIN`, `FLEX_ADMIN`, `TI_SUPORTE`.

- Se o usuário **não** tem `SUPER_ADMIN` (ou roles vazias), o login pode falhar com mensagem de empresa.
- Confira no PostgreSQL (banco `fleetmanager_test`): usuário + papel — use `backend/scripts/verify_fleetmanager_test.sql`.

## Problemas comuns

- **`ERR_CERT_AUTHORITY_INVALID` / `ERR_SSL_PROTOCOL_ERROR`**: abra o app com **`http://`**. Limpe Service Workers antigos (DevTools → Application).
- **401**: usuário inexistente, senha errada ou username com typo (ex.: espaço no final).
- **Conexão recusada**: backend parado ou porta diferente de `8083` → alinhe `server.port` e o `target` do proxy em `vite.config.ts`.
