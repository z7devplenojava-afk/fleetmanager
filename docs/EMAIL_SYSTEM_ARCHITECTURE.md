# Arquitetura e Implementação do Sistema de E-mail — FleetManager

| Item | Valor |
|---|---|
| Versão do documento | 1.0 (2026-11-28) |
| Público-alvo | Backend, Frontend, Infra/VPS, Produto |
| Escopo | Infraestrutura de e-mail (Mailcow), caixas profissionais `@fluxbus.com.br`, importação cPanel, segurança, LGPD, backup |
| Infraestrutura decidida | Mailcow Dockerized na VPS (não cPanel), domínio `fluxbus.com.br` |
| Aplicação | Spring Boot (backend) + React (frontend), Docker Compose, PostgreSQL, Traefik/nginx |

> **Como ler:** cada seção traz primeiro o **estado atual no repositório** (verificado em `backend/`, `frontend/` e `deploy/`) e depois o **estado alvo** com instruções implementáveis. Onde o SQL já existe mas a aplicação não o usa, isso está explicitado.

> **Estado do working tree em 2026-11-28:** além do código consolidado no Git, existem alterações **não commitadas** de uma sessão paralela: `Company.emailDomain`, `UserConsent.ConsentType.PROFESSIONAL_EMAIL`, `UserConsentRepository.hasAcceptedProfessionalEmail`, validação de domínio/consentimento em `EmailAccountService.create`, checagem de tenant em `EmailMessageService` e a migração **não versionada** `V4730__email_domain_security_and_quota.sql`. Onde isso existe, o documento aponta o que já está feito e o que ainda falta (UI, commit, migração, testes e uso efetivo das colunas).

---

## 1. Objetivo e princípios

### 1.1 Objetivo

Permitir que o usuário do FleetManager:

1. cadastre uma **caixa profissional** usando obrigatoriamente o domínio registrado da sua empresa (`companies.email_domain`, ex.: `fluxbus.com.br`) e envie como `@fluxbus.com.br`;
2. **importe todo o e-mail do webmail cPanel via IMAP**, preservando a organização de pastas;
3. use uma caixa de entrada no estilo Outlook (contadores, espaço em disco, data de recebimento, confirmação de entrega/leitura, remetente, anexos, status de segurança);
4. **veja e-mails maliciosos sem abrir links perigosos** — links são bloqueados com modal de aviso e a mensagem vai para uma lista de "perigosos";
5. tenha classificação de marketing, consentimento LGPD específico para uso profissional, backups e defesa em camadas (SPF/DKIM/DMARC, antivirus, anti-phishing).

### 1.2 Princípios de implementação

| Princípio | Consequência prática |
|---|---|
| **Mailcow é a fonte da verdade do e-mail** | A app é cliente IMAP/SMTP. Não reimplementa MTA, filtro ou armazenamento de caixa. |
| **Domínio pertence à empresa** | Nenhuma caixa é criada sem `companies.email_domain` validado e consentimento LGPD ativo. |
| **Segurança em camadas** | Filtragem no MTA (rspamd/ClamAV) **e** sanitização/validação na app. Nenhuma camada confia na outra. |
| **Sync idempotente e incremental** | UID + UIDVALIDITY, faixas limitadas, retry por UID falho. Nunca reimporta a caixa inteira sem necessidade. |
| **Isolamento por tenant** | Toda consulta por ID valida `company_id` explicitamente, além do filtro Hibernate `tenantFilter`. |
| **Preservar, não destruir** | Mensagens perigosas ficam visíveis com aviso; quarentena é estado, não exclusão silenciosa. |
| **Observabilidade e recuperação** | Eventos de segurança auditáveis, cota medida, backup criptografado com teste de restore mensal. |

### 1.3 Estado atual resumido (baseline verificado)

| Área | Hoje |
|---|---|
| Clientes IMAP/SMTP | `EmailAccountController` (`/api/email/accounts`), `EmailAccountService`, `ImapSyncService`, `EmailMessageController`, `EmailMessageService`; entidades em `model/email` |
| Sincronização | Incremental por UID, `uidValidity`, espelhamento de pastas, `computeDisplayName`; **somente manual** via `POST /api/email/accounts/{id}/sync` |
| Dois caminhos de envio | (a) SMTP da conta conectada (`EmailAccountService.sendEmail`, Jakarta Mail cru); (b) SMTP do sistema (`JavaMailSender` + `email_configs` + `email_queue` + `EmailDispatchWorker`) |
| Remetente do sistema | `application.properties` / `MailConfig` usam host padrão `186.209.113.105`; workflows e exemplos de deploy definem `MAIL_HOST=mail.z7design.com.br`, `MAIL_FROM=securedguard@z7design.com.br`. **Não existe remetente `@fluxbus.com.br` hoje** |
| Servidor de e-mail | **Nenhum container de e-mail** nos compose; apenas exemplos de deploy com variáveis `MAIL_HOST`/`MAIL_FROM` |
| Segurança da caixa | Apenas regex client-side `sanitizeHtml` em `frontend/src/pages/EmailModule.tsx`. `AttachmentSecurityValidator` existe **somente para orçamentos comerciais** (`BLOCKED`/`SUSPICIOUS`/`VERIFIED_SAFE`) |
| LGPD | No código consolidado: `UserConsent.ConsentType` = `TERMS_OF_USE`, `PRIVACY_POLICY`, `DATA_PROCESSING`; `LgpdConsent.tsx` tem 3 checkboxes. No **working tree** já existe `PROFESSIONAL_EMAIL` e validação no backend; **falta UI e commit** |
| Cota/segurança em SQL | Migração `V4730__email_domain_security_and_quota.sql` (ainda **não versionada/no Git**) cria colunas e tabelas, mas **nenhuma entidade, serviço ou endpoint as utiliza** — em runtime não há cota nem status aplicado |
| Anexos | Gravados em `app.file.storage-path` (`data/files`), sem tabela de cota efetiva |
| Riscos críticos | No working tree `EmailMessageService` já tem `findMessageScoped`/`validateTenant` (sem testes/commit); `CommercialEmailQuotationService` **ainda** contém senha fixa em claro (`DEFAULT_COMMERCIAL_PASS`) |

---

## 2. Arquitetura alvo

### 2.1 Diagrama

```mermaid
flowchart LR
  subgraph Internet
    EXT[Remetentes externos]
    WEB[Usuário FleetManager]
    DNS[DNS: MX / A / PTR / SPF / DKIM / DMARC / MTA-STS]
  end

  subgraph VPS
    subgraph Mailcow[Mailcow Dockerized]
      POSTFIX[Postfix\n25 entrada / 465 / 587]
      DOVECOT[Dovecot IMAP\n993 / 143]
      RSPAMD[rspamd\nSPF DKIM DMARC Bayes Phishing]
      CLAMAV[ClamAV]
      MARIA[(MariaDB Mailcow)]
      VMAIL[(vmail / maildir)]
      MCADMIN[Admin API + UI\n443]
    end

    subgraph App[FleetManager]
      FE[React\nEmailModule.tsx]
      BE[Spring Boot\nEmailAccountController /\nEmailMessageController]
      SYNC[ImapSyncService\n+ Job agendado com lock]
      SEC[Sanitização server-side\nLink proxy / Validador de anexos]
      PG[(PostgreSQL\nemail_accounts, email_folders,\nemail_messages, anexos, cota, eventos)]
      FILES[(data/files/\nemail-attachments)]
    end

    PROXY[Traefik / nginx\n80 / 443]
  end

  EXT -->|porta 25| DNS
  DNS --> POSTFIX
  POSTFIX --> RSPAMD
  RSPAMD --> CLAMAV
  RSPAMD -->|entrega| DOVECOT
  DOVECOT --> VMAIL
  POSTFIX --> MARIA
  DOVECOT --> MARIA

  WEB --> PROXY
  PROXY --> FE
  FE -->|/api/email/**| BE
  BE --> PG
  BE --> FILES
  BE --> SEC
  SYNC -->|IMAP 993| DOVECOT
  BE -->|SMTP 587 (conta conectada)| POSTFIX
  BE -->|SMTP 587 (fila do sistema)| POSTFIX
  SEC --> PG
  MCADMIN -->|provisionar caixas| BE
```

### 2.2 Componentes

| Componente | Onde roda | Responsabilidade | Portas |
|---|---|---|---|
| Mailcow (Postfix/Dovecot) | VPS, Compose próprio | Receber/entregar/guardar e-mail, IMAP, SMTP submission | 25, 465, 587, 993, 143 |
| rspamd + ClamAV | Dentro do Mailcow | SPF/DKIM/DMARC, bayes, phishing, antivirus, quarentena | internas |
| Mailcow Admin API | Dentro do Mailcow | Criar caixas e senhas/application-specific passwords | 443 (interno/proxy) |
| Backend FleetManager | Compose `fluxbus` | CRUD de contas, sync IMAP, leitura, envio, segurança, cota, auditoria | 8080 (via Traefik) |
| PostgreSQL | Compose `fluxbus` | Espelho de pastas/mensagens, metadados de segurança, cota, eventos | 5432 (interno) |
| `data/files/email-attachments` | Volume do backend | Cópia local dos anexos importados | — |
| React | Compose `fluxbus` | Caixa de entrada, wizard de importação, modais de aviso | 80/443 (via Traefik) |
| Restic | VPS + destino offsite | Backup criptografado de banco, vmail, anexos e chaves | — |

### 2.3 Fluxos

**Fluxo de entrada (inbound):** remetente → DNS MX → Postfix → rspamd (SPF/DKIM/DMARC + heurística + ClamAV) → Dovecot/vmail → `ImapSyncService` importa metadados → app exibe com selo de segurança. Se rspamd classificar como malicious, a mensagem fica em quarentena no Mailcow e/ou é importada com `security_status = DANGEROUS` para a lista de perigosos.

**Fluxo de envio ( outbound):**

1. **Conta conectada:** `POST /api/email/accounts/{id}/send` → `EmailAccountService.sendEmail` → `Transport.sendMessage` com `From = account.emailAddress` (alvo: `@domínio da empresa`). Hoje não há DSN nem persistência de entrega.
2. **Sistema:** `email_queue` → `EmailDispatchWorker` (`@Scheduled(fixedDelay=15000)`, lote de 10, retry com backoff `2^n` minutos) → `JavaMailSender` de `EmailConfig.smtpHost`/`senderEmail`. Alvo: remetente também alinhado a `fluxbus.com.br` via Mailcow, com SPF/DKIM coerente.

**Fluxo de sincronização:** job agendado (Fase 1) → lock distribuído → `ImapSyncService.syncAccount` → `list("*")` recursivo → `UID FETCH(startUid+1..UIDNext-1)` com `UIDVALIDITY` → persistência em lote (`syncBatchSize=50`, teto `syncMaxMessages=2000` por pasta/execução).

---

## 3. DNS e deliverability

### 3.1 Registros necessários para `fluxbus.com.br`

Substitua `<IP_VPS>` pelo IP público da VPS que hospedará o Mailcow.

| Tipo | Nome | Valor | TTL | Finalidade |
|---|---|---|---|---|
| A | `mail.fluxbus.com.br` | `<IP_VPS>` | 300 (estabilizar: 3600) | Endereço do MTA/IMAP |
| MX | `fluxbus.com.br` | `10 mail.fluxbus.com.br` | 300 | Roteamento de entrada |
| PTR | `<IP_VPS>` (no provedor da VPS) | `mail.fluxbus.com.br` | — | Reverse DNS; exigido por Gmail/Outlook |
| TXT | `fluxbus.com.br` | `v=spf1 mx a:mail.fluxbus.com.br ip4:<IP_VPS> -all` | 300 | Autoriza apenas o Mailcow a enviar |
| TXT | `dkim._domainkey.fluxbus.com.br` | `v=DKIM1; k=rsa; p=<chave pública gerada pelo Mailcow>` | 300 | Assinatura DKIM (selector padrão do Mailcow) |
| TXT | `_dmarc.fluxbus.com.br` | ver §3.3 | 300 | Política DMARC e relatórios |
| A | `mta-sts.fluxbus.com.br` | `<IP_VPS>` | 300 | Host do MTA-STS |
| TXT | `_smtp._tls.fluxbus.com.br` | `v=TLSRPTv1; rua=mailto:tlsrpt@fluxbus.com.br` | 3600 | Opcional: relatórios TLS |
| CAA | `fluxbus.com.br` | `0 issue "letsencrypt.org"` | 3600 | Restringe emissão de certificados |

> **Atenção:** se outro serviço (por exemplo o SMTP `mail.z7design.com.br` usado hoje pelo sistema) também enviar como `@fluxbus.com.br`, ele precisa entrar no SPF (`include:` ou `ip4:`) **ou** parar de usar esse domínio. Caso contrário, a mensagem vai falhar DMARC. Decisão registrada em §12.

### 3.2 SPF e DKIM

- **SPF:** publicar o registro acima com `-all` somente após confirmar que todos os emissores foram mapeados. Durante a migração use `~all` (softfail) por alguns dias.
- **DKIM:** o Mailcow gera o par de chaves automaticamente ao criar o domínio na UI (`Configuration → Mail Setup → DKIM`). Publicar o TXT com o seletor exibido (`dkim` por padrão). Verificar com:

```bash
dig +short TXT dkim._domainkey.fluxbus.com.br
opendkim-testkey -d fluxbus.com.br -s dkim -vvv
```

- O cabeçalho `Authentication-Results` gerado pelo rspamd é a fonte que o backend deve persistir (§5 e §8.2).

### 3.3 DMARC — sequência de rollout

Comece monitorando; nunca publique `p=reject` no primeiro dia.

| Fase | Registro `_dmarc` | Duração | Critério para avançar |
|---|---|---|---|
| 0 — monitoramento | `v=DMARC1; p=none; rua=mailto:dmarc@fluxbus.com.br; fo=1; adkim=s; aspf=s; pct=100` | 2–4 semanas | Relatórios agregados sem remetentes legítimos não autenticados |
| 1 — quarentena parcial | `v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@fluxbus.com.br; fo=1; adkim=s; aspf=s` | 1 semana | Nenhum falso positivo em `pct=25` |
| 2 — quarentena ampliada | `... p=quarantine; pct=100 ...` | 1–2 semanas | Taxa de falha < 0,1% e emissores corrigidos |
| 3 — rejeição | `v=DMARC1; p=reject; rua=mailto:dmarc@fluxbus.com.br; fo=1; adkim=s; aspf=s; pct=100` | definitivo | Manter monitoramento dos relatórios |

`rua=mailto:dmarc@fluxbus.com.br` exige que essa caixa exista no Mailcow **antes** de publicar o registro.

### 3.4 MTA-STS e BIMI (opcional)

**MTA-STS** — publicar em `https://mta-sts.fluxbus.com.br/.well-known/mta-sts.txt`:

```text
version: STSv1
mode: enforce
mx: mail.fluxbus.com.br
max_age: 86400
```

Servir esse arquivo pelo mesmo proxy que termina 443 (Traefik/nginx) com certificado válido. Só usar `mode: enforce` depois de confirmar TLS válido no MX.

**BIMI** — somente após DMARC em `quarantine`/`reject` com alinhamento `s`, publicar `v=BIMI1; l=https://fluxbus.com.br/logo.svg; a=https://.../vmc.pem`. Requer VMC/CMC; sem marca registrada, pular.

### 3.5 Checklist de validação

```bash
dig +short MX fluxbus.com.br
dig +short TXT fluxbus.com.br
dig +short TXT dkim._domainkey.fluxbus.com.br
dig +short TXT _dmarc.fluxbus.com.br
openssl s_client -connect mail.fluxbus.com.br:993 -crlf
openssl s_client -connect mail.fluxbus.com.br:587 -starttls smtp -crlf
```

Validar também em https://www.mail-tester.com e https://mxtoolbox.com (DNS, SPF, DKIM, DMARC, PTR, blacklists).

---

## 4. Compose do Mailcow na VPS

### 4.1 Estado atual

Não há serviço de e-mail em nenhum `docker-compose*.yml`. Os exemplos de deploy apenas injetam variáveis no backend:

| Arquivo | Valores |
|---|---|
| `deploy/coolify.backend.*.example`, `deploy/ci/coolify.backend.example` | `MAIL_HOST=mail.z7design.com.br`, `MAIL_USERNAME/MAIL_FROM=securedguard@z7design.com.br` |
| `deploy/docker-compose.env-ci.yml`, `docker-compose.coolify.yml` | `MAIL_HOST` e `MAIL_FROM` com defaults `mail.z7design.com.br` / `securedguard@z7design.com.br` |
| `.github/workflows/deploy-ci-*.yml`, `pipeline-ci-dev-prod.yml` | `MAIL_HOST=${{ secrets.MAIL_HOST || 'mail.z7design.com.br' }}` |
| `backend/src/main/java/.../config/MailConfig.java`, `application.properties` | host padrão no código `186.209.113.105`; `MAIL_HOST` do ambiente tem prioridade absoluta |

### 4.2 Instalação

O Mailcow deve ser instalado com o gerador oficial (ele produz `docker-compose.yml` com todos os serviços, volumes e certificados):

```bash
git clone https://github.com/mailcow/mailcow-dockerized.git /opt/mailcow-dockerized
cd /opt/mailcow-dockerized
./generate_config.sh   # informar mail.fluxbus.com.br e TZ America/Sao_Paulo
docker compose pull
docker compose up -d
```

### 4.3 Compose ilustrativo (adaptar com o gerador oficial)

```yaml
# /opt/mailcow-dockerized/docker-compose.yml — excerpt ilustrativo
services:
  nginx-mailcow:
    image: mailcow/nginx:pre
    ports:
      - "80:80"       # HTTP-01 ACME / redirect
      - "443:443"     # UI e Admin API
    depends_on: [php-fpm-mailcow]
    networks: [mailcow-network]

  postfix-mailcow:
    image: mailcow/postfix:latest
    ports:
      - "25:25"       # entrada MX
      - "465:465"     # SMTPS (implicit TLS)
      - "587:587"     # submission (STARTTLS)
    environment:
      TZ: America/Sao_Paulo
    volumes:
      - vmail-data:/var/vmail
      - postfix-data:/var/spool/postfix
    networks: [mailcow-network]

  dovecot-mailcow:
    image: mailcow/dovecot:latest
    ports:
      - "993:993"     # IMAPS
      - "143:143"     # IMAP (STARTTLS; opcional)
    environment:
      TZ: America/Sao_Paulo
    volumes:
      - vmail-data:/var/vmail
      - dovecot-data:/var/lib/dovecot
    networks: [mailcow-network]

  rspamd-mailcow:
    image: mailcow/rspamd:latest
    networks: [mailcow-network]

  clamav-mailcow:
    image: mailcow/clamav:latest
    volumes: [clamav-db:/var/lib/clamav]
    networks: [mailcow-network]

  redis-mailcow:
    image: redis:7-alpine
    volumes: [redis-data:/data]
    networks: [mailcow-network]

  mariadb-mailcow:
    image: mariadb:10.11
    environment:
      MARIADB_ROOT_PASSWORD: ${MAILCOW_DB_ROOT_PASSWORD:?definir no .env}
    volumes: [mysql-data:/var/lib/mysql]
    networks: [mailcow-network]

  php-fpm-mailcow:
    image: mailcow/phpfpm:latest
    environment:
      MAILCOW_HOSTNAME: mail.fluxbus.com.br
      TZ: America/Sao_Paulo
      SKIP_LETS_ENCRYPT: "n"
      ENABLE_RSPAMD: "y"
      CLAMAV_ENABLED: "y"
    networks: [mailcow-network]

volumes:
  vmail-data:
  postfix-data:
  dovecot-data:
  rspamd-data:
  clamav-db:
  redis-data:
  mysql-data:

networks:
  mailcow-network:
    driver: bridge
```

> Use o compose gerado pelo Mailcow em produção; o trecho acima mostra **quais portas, volumes e variáveis precisam existir** para o planejamento de rede.

### 4.4 Variáveis de ambiente relevantes

| Variável | Valor alvo | Observação |
|---|---|---|
| `MAILCOW_HOSTNAME` | `mail.fluxbus.com.br` | Define URLs, certificado e `server_name` |
| `TZ` | `America/Sao_Paulo` | Datas de `Delivered-To`/logs consistentes com `LocalDateTime` do backend |
| `SKIP_LETS_ENCRYPT` | `n` | Deixar o Mailcow gerenciar o certificado, salvo reverse proxy externo |
| `MAILCOW_DB_ROOT_PASSWORD` | secret | Nunca versionar; guardar no cofre/secrets |
| `ENABLE_RSPAMD` / `CLAMAV_ENABLED` | `y` | Filtro e antivirus obrigatórios |
| Backend `MAIL_HOST` | `mail.fluxbus.com.br` | Substitui `mail.z7design.com.br` / `186.209.113.105` |
| Backend `MAIL_PORT` | `587` | Submission com STARTTLS |
| Backend `MAIL_FROM` | `noreply@fluxbus.com.br` (ou caixa do sistema) | Alinhado a SPF/DKIM |
| Backend `MAIL_USERNAME` / `MAIL_PASSWORD` | conta_mailcow / secret | Conta de serviço no Mailcow |
| `MAILCOW_API_KEY` | secret | Usado pelo backend para provisionar caixas (§6) |

### 4.5 Aviso crítico: conflito de portas 80/443

O Mailcow publica **80 e 443** com seu próprio `nginx-mailcow`. A VPS já roda Traefik/nginx para o FleetManager. Antes de `docker compose up`, escolha uma opção:

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A. IP dedicado (recomendado)** | Anexar segundo IP à VPS e bindar `"<IP2>:80:80"`, `"<IP2>:443:443"`, demais portas no IP principal | Sem conflito; ACME do Mailcow funciona | Requer IP extra do provedor |
| **B. Mailcow em VPS separada** | Instalar Mailcow em outra VPS e apontar MX para ela | Isolamento total, melhor segurança | Custo adicional |
| **C. Reverse proxy externo** | `SKIP_LETS_ENCRYPT=y`, publicar HTTP do Mailcow em portas internas (ex.: `8081:80`, `8443:443`) e Traefik termina TLS | Aproveita Traefik existente | Mais frágil: Mailcow espera 80 para ACME e gera URLs a partir de `MAILCOW_HOSTNAME`; exige ajuste fino |
| **D. Host nginx compartilhado** | Parar o container nginx do Mailcow e usar nginx do host | Controle central | Manutenção mais alta; não recomendado |

### 4.6 Firewall (UFW)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 25/tcp     # entrada MX + saída SMTP
sudo ufw allow 465/tcp
sudo ufw allow 587/tcp
sudo ufw allow 993/tcp
sudo ufw allow 143/tcp    # se habilitado
sudo ufw allow out 25/tcp
sudo ufw enable
```

> **Importante:** muitos provedores bloqueiam a porta 25 de saída. Solicitar liberação ao provedor ou usar smarthost.

### 4.7 Ordem de deploy

1. Validar DNS (§3) com TTL baixo.
2. Subir Mailcow, criar domínio `fluxbus.com.br`, publicar DKIM, gerar certificado.
3. Criar caixas de serviço (`noreply@`, `dmarc@`, `tlsrpt@`) e caixas profissionais via Admin API.
4. Ajustar `MAIL_HOST`/`MAIL_PORT`/`MAIL_FROM`/`MAILCOW_API_KEY` no Compose do backend e reimplementar.
5. Testar envio pelos **dois** caminhos (conta conectada e fila do sistema) e conferir `Authentication-Results`.
6. Somente então baixar MX antigo do cPanel para prioridade 20 e, após estabilização, removê-lo (§12).

---

## 5. Modelo de dados e migrações

### 5.1 Entidades atuais

| Entidade / tabela | Campos principais | Observações |
|---|---|---|
| `EmailAccount` / `email_accounts` | `company_id`, `user_id`, `email_address`, `display_name`, `imap_host/port/ssl`, `smtp_host/port/ssl`, `username`, `password_encrypted`, `auth_type`, `signature`, `status`, `last_sync_at/status/message/total` | Senha criptografada por `EmailCryptoConverter`; único por `(company_id, email_address)`; `@Filter(tenantFilter)` |
| `EmailFolder` / `email_folders` | `account_id`, `company_id`, `remote_name`, `display_name`, `delimiter`, `attributes`, `parent_id`, `uid_validity`, `highest_uid`, `total_messages`, `is_system` | Único por `(account_id, remote_name)`; **não há `sort_order`/`full_path` na entidade** |
| `EmailMessage` / `email_messages` | `account_id`, `folder_id`, `company_id`, `uid`, `message_id_header`, `in_reply_to`, `subject`, `from/to/cc/sender_address` (JSON), `date`, `body_text/html`, `is_read`, `is_flagged`, `is_answered`, `has_attachments`, `size_bytes` | Único por `(folder_id, uid)`; `date` hoje é **SentDate com fallback para ReceivedDate** (§7.3) |
| `EmailMessageAttachment` / `email_message_attachments` | `message_id`, `account_id`, `company_id`, `file_name`, `content_type`, `size_bytes`, `storage_path`, `content_id`, `inline` | `storage_path` relativo a `app.file.storage-path`; `message_id` nullable desde `V4549` (anexos de composição) |

Migrações relacionadas já presentes: `V4538__create_email_management_module.sql`, `V4549__email_outlook_features.sql`, `V4616__create_commercial_email_quotations.sql` e, principally, **`V4730__email_domain_security_and_quota.sql`**.

### 5.2 O que `V4730` já fez no banco (mas a aplicação não usa)

```sql
-- V4730 (já versionada)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_domain VARCHAR(120);
ALTER TABLE email_folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE email_folders ADD COLUMN IF NOT EXISTS full_path VARCHAR(500);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS spf_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS dkim_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS dmarc_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS spam_score NUMERIC(6,2);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS security_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20);
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
CREATE TABLE IF NOT EXISTS email_mailbox_quotas (... max_bytes BIGINT DEFAULT 1073741824, used_bytes BIGINT ...);
CREATE TABLE IF NOT EXISTS email_security_events (... event_type VARCHAR(40) ...);
```

**Interpretação correta:** o *schema* já contém domínio, segurança e cota (a migração está como arquivo novo no working tree, ainda sem commit). No código Java consolidado não existe `Company.emailDomain`, não há `EmailMailboxQuota`/`EmailSecurityEvent`, `EmailMessageDTO` não expõe os novos campos e `ImapSyncService` não preenche `spf_status`/`spam_score`. O working tree já adicionou `Company.emailDomain` e `UserConsent.PROFESSIONAL_EMAIL`, mas **não** mapeou as colunas de segurança/cota nem expôs os campos. Portanto, **funcionalmente não há cota nem classificação de segurança hoje**. Antes de criar uma migração nova, conferir `flyway_schema_history` — o próximo número livre é `V4731`.

### 5.3 Migração proposta `V4731__email_professional_hardening.sql`

> Numerar `V4731` **se** a `V4730` for commitada/versionada. Se a `V4730` ainda não foi aplicada em nenhum ambiente, o time pode optar por fundir parte deste conteúdo nela antes do primeiro deploy — nunca editar uma migração já executada.

```sql
-- 1. Domínio obrigatório e validado (companies.email_domain já existe em V4730)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_domain_verified_at TIMESTAMP;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'IMAP';
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS consent_id UUID;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS last_quota_check_at TIMESTAMP;

-- 2. Data de recebimento distinta da data de envio (INTERNALDATE)
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS received_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_email_messages_received_at
    ON email_messages(account_id, received_at DESC);

-- 3. Hash e status de segurança do anexo
ALTER TABLE email_message_attachments ADD COLUMN IF NOT EXISTS sha256 VARCHAR(64);
ALTER TABLE email_message_attachments ADD COLUMN IF NOT EXISTS security_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE email_message_attachments ADD COLUMN IF NOT EXISTS scan_detail TEXT;

-- 4. Tokens do proxy de links (se não usar HMAC stateless)
CREATE TABLE IF NOT EXISTS email_link_tokens (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    original_url TEXT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT uq_email_link_token UNIQUE (token_hash)
);

-- 5. Lock de sincronização distribuída (ShedLock)
CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP NOT NULL,
    locked_by VARCHAR(255) NOT NULL
);

-- 6. Consentimento profissional (enum + versão de termo)
--    user_consents já suporta consent_type/term_version; apenas gravar PROFESSIONAL_EMAIL 1.0.
CREATE INDEX IF NOT EXISTS idx_user_consents_type_version
    ON user_consents(user_id, consent_type, term_version);
```

> Todos os `ADD COLUMN` usam `IF NOT EXISTS` para preservar compatibilidade com bancos onde a `V4730` já rodou.

### 5.4 Mapeamento Java necessário

```java
// Company.java
@Column(name = "email_domain", length = 120)
private String emailDomain;

// EmailFolder.java
@Column(name = "sort_order")
private Integer sortOrder = 0;

@Column(name = "full_path", length = 500)
private String fullPath;

// EmailMessage.java
@Column(name = "spf_status", length = 20)      private String spfStatus;
@Column(name = "dkim_status", length = 20)     private String dkimStatus;
@Column(name = "dmarc_status", length = 20)    private String dmarcStatus;
@Column(name = "spam_score")                   private BigDecimal spamScore;
@Column(name = "security_status", length = 20) private String securityStatus = "PENDING";
@Column(name = "delivery_status", length = 20) private String deliveryStatus;
@Column(name = "delivered_at")                 private LocalDateTime deliveredAt;
@Column(name = "read_at")                      private LocalDateTime readAt;
@Column(name = "received_at")                  private LocalDateTime receivedAt;
```

Criar entidades `EmailMailboxQuota` (tabela `email_mailbox_quotas`) e `EmailSecurityEvent` (tabela `email_security_events`) com `@Filter(tenantFilter)` e repositórios em `repository/email`. Expor os novos campos em `EmailMessageDTO`, `EmailFolderDTO` e `EmailAccountDTO`.

### 5.5 Regras de integridade e tenant

- `email_messages`: manter `UNIQUE (folder_id, uid)`; o `(company_id, ...)` continua como defesa em profundidade.
- Toda consulta por ID em `EmailMessageService` deve usar **verificação explícita**, não apenas o `@Filter`:

```java
private EmailMessage findOwnedScoped(UUID id, UUID companyId) {
    UUID tenant = companyId != null ? companyId : TenantContext.get();
    EmailMessage m = messageRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));
    if (tenant != null && !tenant.equals(m.getCompanyId())) {
        throw new SecurityException("Acesso negado à mensagem");
    }
    return m;
}
```

Aplicar o mesmo padrão a `getMessage`, `getMessageAndMarkRead`, `markRead`, `toggleFlag`, `deleteMessage`, `moveMessage`, `getAttachment` e `downloadAttachment`. **Já existe uma versão equivalente no working tree** (`findMessageScoped` + `validateTenant`, com `IllegalArgumentException`), mas ainda sem commit e sem testes. Observação importante: `validateTenant` só bloqueia quando `TenantContext.get() != null`; em job agendado (sem tenant) o filtro Hibernate também não protege — por isso a checagem deve receber o `companyId` esperado da operação e falhar quando ele estiver ausente.

---

## 6. Cadastro de caixas: validação de domínio e consentimento LGPD

### 6.1 Pré-requisito administrativo

`companies.email_domain` deve ser preenchido pelo administrador (ou pelo fluxo de cadastro da empresa) com o domínio registrado, ex.: `fluxbus.com.br`. Caixa alguma pode ser criada se esse campo estiver vazio.

### 6.2 Regras de validação no `EmailAccountService.create`

> **Já implementado no working tree (não commitado):** `create()` exige `UserConsentRepository.hasAcceptedProfessionalEmail(userId)` (com exceção para `SUPER_ADMIN`) e valida que o domínio do endereço seja igual a `Company.emailDomain`. **Ainda falta:** bloqueio explícito de provedores pessoais, versionamento do termo na checagem, inclusão da senha/credencial via Mailcow Admin API (§6.4) e UI do consentimento (§6.3).

| Regra | Implementação | Erro retornado |
|---|---|---|
| Empresa identificada | `TenantContext.get()` ou `currentUser.getCompanyId()` | `Empresa não identificada` |
| `companies.email_domain` preenchido | Buscar `Company` pelo `companyId`; validar `StringUtils.hasText` | `Domínio de e-mail da empresa não configurado` |
| Domínio do endereço = domínio da empresa | Comparar `emailAddress.substring(idx+1)` com `emailDomain`, case-insensitive, após `trim()` | `Use apenas o domínio profissional @fluxbus.com.br` |
| Provedores pessoais bloqueados | Lista negra `gmail.com`, `hotmail.com`, `outlook.com`, `yahoo.com`, `icloud.com`, `bol.com.br`, `terra.com.br`, `uol.com.br` | `E-mail pessoal não é permitido para caixa profissional` |
| Consentimento LGPD ativo | `LgpdConsentService.hasAccepted(userId, PROFESSIONAL_EMAIL, "1.0")` | `É necessário aceitar o termo de uso profissional` |
| Não duplicar | Já existe `findByCompanyIdAndEmailAddressIgnoreCase` | mensagem atual |
| Hosts padrão | `imapHost = mail.fluxbus.com.br`, `imapPort = 993`, `imapSsl = true`, `smtpHost = mail.fluxbus.com.br`, `smtpPort = 587`, `smtpSsl = false` (STARTTLS) | — |
| Senha | Armazenar via `EmailCryptoConverter` (já existente) | — |

Trecho sugerido:

```java
String domain = normalizeDomain(company.getEmailDomain());
String accountDomain = normalizeDomain(request.getEmailAddress()
        .substring(request.getEmailAddress().lastIndexOf('@') + 1));
if (!domain.equalsIgnoreCase(accountDomain)) {
    throw new IllegalArgumentException("Use apenas o domínio profissional @" + domain);
}
if (!lgpdConsentService.hasAccepted(currentUser.getId(),
        UserConsent.ConsentType.PROFESSIONAL_EMAIL, "1.0")) {
    throw new ProfessionalEmailConsentRequiredException();
}
```

### 6.3 LGPD: novo tipo de consentimento

```java
// UserConsent.java
public enum ConsentType {
    TERMS_OF_USE,
    PRIVACY_POLICY,
    DATA_PROCESSING,
    PROFESSIONAL_EMAIL   // NOVO: uso exclusivamente profissional da caixa
}
```

> No **working tree**, o enum `PROFESSIONAL_EMAIL` e `UserConsentRepository.hasAcceptedProfessionalEmail` já existem; a checagem em `EmailAccountService.create` usa o método sem exigir versão do termo. A tabela `user_consents` já suporta `term_version` — basta passar `"1.0"`.

- **Termo versionado:** `PROFESSIONAL_EMAIL` v1.0 com texto explícito: a caixa é de uso **exclusivamente profissional**, o conteúdo pode ser processado para fins operacionais (sincronização, classificação, segurança e backup), não deve conter dados pessoais de terceiros sem base legal, e o titular pode revogar o consentimento solicitando o encerramento da caixa.
- **Registro:** reutilizar `LgpdConsentService.registerConsent(...)` — ele já grava `termVersion`, `acceptedAt`, `ipAddress`, `userAgent`, latitude/longitude e faz `upsert` (`V320__create_lgpd_consent_table.sql`). O `ConsentController` já expõe `/lgpd/consent`.
- **UI:** `frontend/src/pages/LgpdConsent.tsx` continua com os 3 checkboxes do primeiro acesso. O 4º consentimento deve aparecer **no wizard de nova caixa** (`EmailModule.tsx`), com checkbox obrigatório e link para o texto do termo — não deve bloquear o login.
- **Efeito da revogação:** `EmailAccount.status = SUSPENDED`, envio bloqueado e exportação/solicitação de exclusão habilitada.

Payload alvo:

```json
POST /api/email/accounts
{
  "emailAddress": "joao@fluxbus.com.br",
  "displayName": "João Silva",
  "imapHost": "mail.fluxbus.com.br",
  "imapPort": 993,
  "imapSsl": true,
  "smtpHost": "mail.fluxbus.com.br",
  "smtpPort": 587,
  "smtpSsl": false,
  "username": "joao@fluxbus.com.br",
  "password": "<senha da caixa>",
  "authType": "PASSWORD",
  "professionalEmailConsentAccepted": true,
  "consentVersion": "1.0"
}
```

### 6.4 Provisionamento no Mailcow (alvo)

Em vez de pedir ao usuário host/senha, o backend pode criar a caixa via Admin API com uma chave de serviço (`MAILCOW_API_KEY`):

```http
POST https://mail.fluxbus.com.br/api/v1/add/mailbox
X-API-Key: <MAILCOW_API_KEY>
Content-Type: application/json

{
  "local_part": "joao",
  "domain": "fluxbus.com.br",
  "name": "João Silva",
  "password": "<gerado pelo backend>",
  "quota": "1073741824",
  "active": 1
}
```

A senha gerada é devolvida uma única vez ao usuário e gravada em `email_accounts.password_encrypted` pelo conversor existente. A chave da API **nunca** entra no repositório.

---

## 7. Importação do cPanel

### 7.1 Wizard (frontend)

| Etapa | UI | Endpoint |
|---|---|---|
| 1. Domínio e termo | Exibe `@{company.email_domain}`, checkbox LGPD profissional | `GET /api/companies/{id}` (existente) + `POST /lgpd/consent` |
| 2. Credenciais | E-mail,cPanel, senha; botão "Testar conexão" | `POST /api/email/accounts/test-credentials` |
| 3. Pastas | Árvore de pastas do webmail com contadores e checkbox de inclusão | `POST /api/email/accounts/{id}/sync-folders` (evoluir para mapa completo) |
| 4. Mapeamento | Preview `remote_name` → `display_name` / `full_path` / `sort_order` | `GET /api/email/accounts/{id}/folders` |
| 5. Importação | Barra de progresso por pasta, UIDs processados/totais, erros por pasta | `POST /api/email/accounts/{id}/sync?fullSync=true` (inicial) |
| 6. Conferência | Relatório: pastas, mensagens, anexos, falhas, data/hora | `GET /api/email/accounts/{id}` (`lastSyncStatus`, `lastSyncTotal`) |

### 7.2 Preservação da organização de pastas — o que falta hoje

`ImapSyncService` usa `defaultFolder.list("*")` (um nível) e `mirrorFolder()` grava `remoteName`, `displayName` (via `computeDisplayName`), `delimiter`, `attributes`, `system` (regex `SYSTEM_FOLDER`). Para preservar pastas aninhadas do cPanel (`INBOX.Clientes/2025`, etc.):

1. trocar `list("*")` por `list("%")` recursivo com pilha sobre `Folder.HOLDS_FOLDERS`;
2. preencher `full_path` com `remoteFolder.getFullName()`, `parent_id` com o `EmailFolder` do pai e `sort_order` pela ordem retornada pelo `LIST`;
3. manter `computeDisplayName` para rótulos amigáveis (`INBOX` → `Caixa de Entrada`, `Sent` → `Enviados`, etc.) e usar `full_path` para ordenação/exibição em árvore;
4. expor `fullPath`, `sortOrder` e `parentId` em `EmailFolderDTO`/`folderToMap`.

### 7.3 Algoritmo de importação (base real)

`ImapSyncService.syncAccount(accountId, fullSync)` já faz:

- abre `Store` em READ_ONLY (não grava `\Seen` de volta no servidor);
- para cada pasta, `mirrorFolder()` e leitura do `UIDVALIDITY`; se mudou, **apaga as mensagens locais da pasta e zera `highestUid`** (comportamento a rever — §12);
- `startUid = highestUid`; `fullSync` força `startUid = 0`;
- `UID FETCH` de `startUid+1 .. UIDNext-1`; fallback para varredura completa se `UIDNext` indisponível;
- ordena por UID, limita a `app.email.sync-max-messages` (default **2000**) e processa **os mais antigos primeiro**;
- grava em lotes de `app.email.sync-batch-size` (default **50**) com `flush()`;
- em falha individual, registra `firstFailedUid` e ajusta `highestUid` para `firstFailedUid - 1` (não pula mensagem);
- extrai corpo texto/HTML e anexos recursivamente; anexos em `data/files/email-attachments/{accountId}/{messageId}/{nome}`, com guard de path traversal.

**Ajuste de data:** hoje `date = mime.getSentDate() != null ? getSentDate() : getReceivedDate()`. Para caixa estilo Outlook, persistir:

```java
.date(toLocalDateTime(mime.getSentDate()))              // data de envio (quando houver)
.receivedAt(toLocalDateTime(m.getReceivedDate()))        // INTERNALDATE do IMAP
```

e a listagem usa `receivedAt` com fallback para `date`.

### 7.4 Worker agendado com lock

```java
@Component
@RequiredArgsConstructor
public class ImapSyncScheduler {

    private final EmailAccountRepository accounts;
    private final ImapSyncService imapSyncService;

    @Scheduled(fixedDelayString = "${app.email.sync-interval-ms:900000}") // 15 min
    @SchedulerLock(name = "imapSync", lockAtMostFor = "PT20M", lockAtLeastFor = "PT1M")
    public void syncAll() {
        for (EmailAccount account : accounts.findByStatusAndDueForSync("ACTIVE",
                LocalDateTime.now().minusMinutes(15))) {
            try {
                imapSyncService.syncAccount(account.getId(), false);
            } catch (Exception e) {
                log.warn("Falha no sync automático da conta {}: {}", account.getId(), e.getMessage());
            }
        }
    }
}
```

- `@EnableScheduling` já existe em `FleetManagerApplication` e `MonitoringConfig`, mas **não há `@Scheduled` para e-mail hoje** — apenas o `EmailDispatchWorker` da fila do sistema.
- `ShedLock` (tabela `shedlock`, §5.3) evita duas réplicas sincronizando a mesma conta.
- Respeitar `syncMaxMessages` por execução e aplicar backoff exponencial para contas com `lastSyncStatus = ERROR`.
- Timeout de conexão 15 s / leitura 30 s já configurados em `connectImap`.

### 7.5 Limites e tratamento de falhas

| Situação | Comportamento |
|---|---|
| Pasta com > 2000 mensagens novas | Importa lote das mais antigas; restante nas próximas execuções |
|UID individual falho | `firstFailedUid` volta a processar na próxima execução |
| Pasta inteira falha | `log.warn`, continua nas demais; `lastSyncStatus=ERROR` se a conexão como um todo falhar |
| `UIDVALIDITY` mudou | Hoje apaga e reimporta; alvo: marcar `needsResync` e reimportar sem perder metadados de segurança |
| Servidor sem `UIDNext` | Varredura completa com filtro `uid > startUid` |
| Caixa desativada/senha inválida | `status=SUSPENDED`, `lastSyncMessage` com erro amigável via `extractFriendlyError` |
| Anexo com nome inválido | `sanitizeFileName`, truncamento em 200 caracteres |
| Path traversal | `abs.startsWith(storagePath)` — já implementado |

---

## 8. Segurança em camadas

### 8.1 Visão geral

| Camada | Ferramenta | O que bloqueia | Onde persistir |
|---|---|---|---|
| DNS | SPF/DKIM/DMARC | Falsificação de remetente | `spf_status`, `dkim_status`, `dmarc_status` |
| MTA | Postfix + rspamd | Spam, phishing, domínios forjados | `spam_score`, `security_status` |
| Antivirus | ClamAV (+ signatures não oficiais) | Malware em anexos | `email_message_attachments.security_status` |
| Quarentena | Mailcow | Mensagens suspeitas antes da caixa | Lista "Perigosos" na app + eventos |
| Ingestão | `ImapSyncService` + validador | HTML ativo, anexos perigosos | `body_html` sanitizado, `sha256` |
| Renderização | Sanitização server-side + link proxy | XSS, rastreadores, click-through | `email_security_events` |
| Auditoria | Tabela de eventos | Falta de rastreabilidade | `email_security_events` |

### 8.2 Persistir resultados de autenticação

No `saveMessage`, extrair cabeçalhos e preencher colunas criadas em `V4730`:

```java
String authResults = safeHeader(mime, "Authentication-Results");
builder.spfStatus(extractResult(authResults, "spf"))
       .dkimStatus(extractResult(authResults, "dkim"))
       .dmarcStatus(extractResult(authResults, "dmarc"))
       .spamScore(parseScore(safeHeader(mime, "X-Spam-Score")))
       .securityStatus(classify(authResults, spamScore, attachmentRisks));
```

`classify()` deve produzir `VERIFIED_SAFE`, `SUSPICIOUS`, `DANGEROUS` ou `PENDING`, nunca `null`.

### 8.3 Política de anexos

Reutilizar e generalizar `AttachmentSecurityValidator` (hoje em `service/commercial`), que já faz:

- extensões permitidas (`pdf, xlsx, xls, csv, txt, docx, doc, png, jpg, jpeg`), bloqueadas (`exe, bat, cmd, vbs, js, jar, msi, ps1, dll, hta, iso, vhd`, etc.);
- magic bytes (`%PDF`, `PK..`, `D0 CF 11 E0`) e heurística de `/JavaScript`, `/JS`, `/Launch` em PDF;
- limite de 35 MB e hash SHA-256;
- status `VERIFIED_SAFE` / `SUSPICIOUS` / `BLOCKED`.

Aplicar a **todo anexo importado** e a todo upload de composição:

| Status | Ação na UI |
|---|---|
| `VERIFIED_SAFE` | Download normal |
| `SUSPICIOUS` | Download com aviso ("arquivo não homologado") |
| `BLOCKED` / `DANGEROUS` | Ícone de perigo, download desabilitado, registrar `ATTACHMENT_BLOCKED`, manter arquivo em disco para forense |
| `PENDING` | Rodar ClamAV (clamd socket) ao importar e atualizar status |

Adicionar `sha256`, `security_status` e `scan_detail` em `email_message_attachments` (§5.3).

### 8.4 Sanitização server-side (substituir regex do front)

Hoje a única defesa é `sanitizeHtml()` em `frontend/src/pages/EmailModule.tsx` (regex que remove `<script>`, `<iframe>`, `on*=`, `javascript:`, pixels). Isso é insuficiente: o HTML bruto vem do IMAP e é gravado em `body_html`.

Alvo: sanitizar **na importação** com OWASP Java HTML Sanitizer ou jsoup `Safelist`:

```java
Safelist safelist = Safelist.relaxed()
    .removeTags("script", "iframe", "object", "embed", "svg", "math", "link", "meta", "base", "form")
    .removeAttributes("on*", "style", "srcset")
    .addProtocols("a", "href", "http", "https", "mailto")
    .preserveRelativeLinks(false);
String safeHtml = Jsoup.clean(rawHtml, "", safelist, new Document.OutputSettings().prettyPrint(false));
```

- Remover/rewrite de `<img src>` (§8.6).
- Reescrever `<a href>` para o proxy de links (§8.5).
- Manter `body_text` como fallback seguro.
- Frontend continua com escape como **defesa adicional**, não como única camada.

### 8.5 Proxy de links e interstitial

1. No ingest, todo link do HTML e URLs em texto são substituídos por `/api/email/links/{token}`; o token é HMAC-SHA256 de `messageId + url + secret` (ou registro em `email_link_tokens`).
2. `GET /api/email/links/{token}`:
   - valida assinatura/expiração e tenant;
   - se `security_status` for `SUSPICIOUS`/`DANGEROUS` → **não redireciona**: retorna página interstitial com "Link bloqueado por segurança", domínio de destino e botão "Continuar mesmo assim" (clique explícito do usuário);
   - se `VERIFIED_SAFE` → registra `LINK_CLICKED` e redireciona com `Referrer-Policy: no-referrer`.
3. Bloqueio adicional por lista de domínios de phishing do rspamd / Safe Browsing.
4. Cada Evento grava `company_id`, `account_id`, `message_id`, `actor_id`, IP, User-Agent e timestamp em `email_security_events`.

### 8.6 Imagens remotas bloqueadas

- Substituir `<img src="http...">` por placeholder "Imagem bloqueada — carregar" com `data-token`.
- Clique carrega via `/api/email/images/{token}` (proxy sem cookies, sem referrer, com allowlist de MIME e timeout).
- Nunca carregar imagens remotas automaticamente na renderização — evita pixel tracker e confirmação de leitura por terceiros.

### 8.7 Heurística de phishing e marketing

**Phishing:** rspamd (URL curta, domínio recente, homógrafo, UI de login em HTML, `From` ≠ `Reply-To`, urgência) → `spam_score` alto e `security_status = DANGEROUS`. Mensagem continua visível na lista "Perigosos", com banner e links bloqueados.

**Marketing:** classificar quando presentes `List-Id`, `List-Unsubscribe`, `Precedence: bulk` ou score rspamd de newsletter. Marcar `category = MARKETING` (nova coluna ou valor em `security_status` separado — decisão em §12) e criar visão filtrada "Marketing", **sem exclusão automática**. Botão "Cancelar inscrição" usa o cabeçalho `List-Unsubscribe` via proxy (nunca abre link diretamente).

### 8.8 Quarentena e lista "Perigosos"

- `security_status IN ('DANGEROUS','BLOCKED')` alimenta a visão **Perigosos** (`GET /api/email/messages?securityStatus=DANGEROUS`), com aviso no topo e links inativos.
- Ações: **Liberar** (reclassifica para `SUSPICIOUS`/`VERIFIED_SAFE` e chama a API do Mailcow para liberar da quarentena), **Excluir**, **Reportar phishing** (rspamd `learnspam`).
- Toda ação gera evento em `email_security_events` com ator e justificativa.

### 8.9 Gaps atuais que precisam ser fechados antes de expor a nova funcionalidade

| Gap | Arquivo | Ação |
|---|---|---|
| Sanitização apenas client-side regex | `frontend/src/pages/EmailModule.tsx` | Sanitizar no servidor (§8.4) |
| Validador restrito a orçamentos | `service/commercial/AttachmentSecurityValidator.java` | Extrair para `service/email` e aplicar a anexos de e-mail |
| Sem SPF/DKIM/DMARC/AV/quarantine/link proxy | `ImapSyncService`, `EmailMessageService` | Implementar §8.2–8.8 |
| Buscas por ID sem tenant explícito | `EmailMessageService` | Parcialmente resolvido no working tree (`findMessageScoped`); faltam commit, testes e cobertura de job sem `TenantContext` (§5.5) |
| Senha em claro `DEFAULT_COMMERCIAL_PASS = "Comerci@l2026"` | `service/commercial/CommercialEmailQuotationService.java` | Mover para `EmailConfig`/secrets e remover do código |
| Sem consentimento de e-mail profissional na UI | `UserConsent`, `LgpdConsent.tsx`, `EmailModule.tsx` | `PROFESSIONAL_EMAIL` e validação backend já no working tree; falta checkbox/wizard e commit (§6.3) |

---

## 9. Lista de mensagens (caixa estilo Outlook)

### 9.1 Campos exibidos e origem

| Campo na UI | Origem no backend | Situação hoje |
|---|---|---|
| Remetente (nome + e-mail) | `EmailMessage.fromAddress` (JSON) → `EmailMessageDTO.from` | Já existe |
| Assunto + snippet | `subject`, `bodyText` | Já existe |
| **Data de recebimento** | `receivedAt` (INTERNALDATE) com fallback `date` | **Falta:** `date` hoje prefere SentDate (§7.3) |
| Remetente/para/cc | `from`, `to`, `cc` | Já existe |
| Tamanho (`sizeBytes`) | `mime.getSize()`, exibido em KB/MB | Já existe no DTO |
| Anexos (ícone/contador) | `hasAttachments`, `attachments[]` | Já existe |
| Não lido / lido | `is_read` (flag `\Seen` local) | Já existe |
| Sinalizado / respondido | `is_flagged`, `is_answered` | Já existe |
| **Status de segurança** | `security_status` + `spf/dkim/dmarc/spam_score` | Colunas em SQL (`V4730`), **não expostas** |
| **Confirmação de entrega** | `delivery_status`, `delivered_at` (DSN) | Colunas em SQL, **não preenchidas** |
| **Confirmação de leitura** | `read_at` (MDN/\\Seen observado) | Coluna em SQL, **não preenchida** |
| **Categoria Marketing** | heurística §8.7 | Não existe |
| Contadores por pasta | `countUnreadByFolderId` em `folderToMap` | Já existe |
| **Espaço usado / cota** | `email_mailbox_quotas.used_bytes / max_bytes` | Tabela em SQL, **sem serviço/endpoint** |

### 9.2 Entrega vs leitura — não confundir

| Conceito | O que prova | Como obter |
|---|---|---|
| `\Seen` (flag IMAP) | A mensagem foi **aberta** por algum cliente (não prova que foi lida por humano) | `m.isSet(Flags.Flag.SEEN)` no sync; `updateReadStatus` quando o usuário abre |
| **DSN** (`Delivery Status Notification`) | O **servidor de destino aceitou/rejeitou/adiou** a entrega | Solicitar `mail.smtp.dsn.notify=SUCCESS,FAILURE,DELAY` no envio; parsear mensagem `Delivery Status Notification` e popular `delivery_status`/`delivered_at` |
| **MDN** (`Disposition-Notification-To`) | O destinatário **abriu**, se o cliente dele cooperar | Enviar header de solicitação; correlacionar `message-id` e preencher `read_at` |

No envio da conta conectada (`EmailAccountService.sendEmail`), adicionar ao `Session`:

```java
props.put("mail.smtp.dsn.notify", "SUCCESS,FAILURE,DELAY");
props.put("mail.smtp.dsn.ret", "FULL");
msg.setHeader("Disposition-Notification-To", account.getEmailAddress()); // opcional
```

Valores de `delivery_status`: `DELIVERED`, `DEFERRED`, `BOUNCED`, `UNKNOWN`. A UI deve mostrar ícone distinto: "Entregue", "Pendente", "Falhou", "Não solicitado".

### 9.3 Endpoints a evoluir

| Endpoint | Uso |
|---|---|
| `GET /api/email/accounts/{id}/folders` | Árvore de pastas com `unread`, `fullPath`, `sortOrder`, `totalMessages` |
| `GET /api/email/accounts/{id}/messages?folderId=&page=&size=` | Lista paginada (já existente) |
| `GET /api/email/accounts/{id}/search?q=` | Busca (já existente) |
| `GET /api/email/messages?securityStatus=DANGEROUS&category=MARKETING` | Novo: listas especiais |
| `GET /api/email/accounts/{id}/quota` | Novo: `maxBytes`, `usedBytes`, `percent`, `attachmentsBytes` |
| `POST /api/email/messages/{id}/release`, `/report-phishing` | Novo: ações de segurança |
| `GET /api/email/attachments/{id}/download` | Já existente; adicionar checagem de `security_status` e tenant |

`EmailMessageDTO` precisa ganhar: `receivedAt`, `spfStatus`, `dkimStatus`, `dmarcStatus`, `spamScore`, `securityStatus`, `deliveryStatus`, `deliveredAt`, `readAt`, `category`.

### 9.4 Cota e disco

- `used_bytes` = soma de `size_bytes` dos `email_messages` + `size_bytes` dos anexos locais por conta; atualizado no fim de cada sync e antes de cada envio/upload.
- `max_bytes` default 1 GB (`V4730`), configurável por empresa/plano.
- Bloquear importação/upload quando `used_bytes >= 0.95 * max_bytes`, registrar evento e avisar o usuário.
- Exibir na UI: barra de uso, "X GB de Y GB", e contagem de mensagens/ anexos.

---

## 10. Backup e restore

### 10.1 Ativos a proteger

| Ativo | Local | Como copiar |
|---|---|---|
| Banco FleetManager (inclui `email_*`) | PostgreSQL `fluxbus` | `pg_dump -Fc` diário |
| Banco Mailcow (caixas, domínios, DKIM, usuários) | MariaDB do Mailcow | `docker compose exec mariadb-mailcow mariadb-dump` |
| Caixas IMAP (vmail) | volume `vmail-data` | `restic backup /var/lib/docker/volumes/mailcow-dockerized_vmail-data` ou snapshot do volume |
| Anexos da app | `app.file.storage-path` (`data/files/email-attachments`) | `restic backup` do diretório |
| Chave DKIM privada | configuração do Mailcow (rspamd) | Incluída no backup de config `/opt/mailcow-dockerized` |
| Chave de criptografia de `email_accounts.password_encrypted` | segredo da app (`EmailCryptoConverter`) | Cofre de secrets; **sem ela, senhas são irrecuperáveis** |
| `MAILCOW_API_KEY`, `MAIL_PASSWORD` | secrets do Compose | Cofre, nunca em backup sem criptografia |

### 10.2 Restic

```bash
# inicialização (uma vez)
export RESTIC_REPOSITORY="s3:https://<endpoint>/fleetmanager-backup"
export RESTIC_PASSWORD_FILE="/etc/restic/password"
restic init

# backup diário (03:00, cron/systemd timer)
restic backup \
  /backups/fleetmanager-db.dmp \
  /backups/mailcow-db.sql \
  /opt/mailcow-dockerized \
  /var/lib/docker/volumes/mailcow-dockerized_vmail-data \
  /app/data/files/email-attachments \
  --tag email --tag daily

# retenção
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
restic check --read-data-subset=10%
```

`pg_dump`:

```bash
docker exec fluxbus-db-prod pg_dump -U postgres -Fc fluxbus > /backups/fleetmanager-db.dmp
docker exec mailcow-dockerized-mariadb-mailcow-1 mariadb-dump -uroot -p"$MAILCOW_DB_ROOT_PASSWORD" mailcow > /backups/mailcow-db.sql
```

### 10.3 Política e teste mensal de restore

| Item | Valor |
|---|---|
| Frequência | Diária 03:00 (incremental); semanal full |
| Retenção | 7 diários + 4 semanais + 12 mensais |
| Criptografia | AES-256 do Restic; senha em cofre separado do destino |
| RPO alvo | ≤ 24 h (e-mails no Mailcow têm replicação do volume; ajustar para 1 h se necessário) |
| RTO alvo | ≤ 4 h para banco + ≤ 8 h para caixa completa |

Teste mensal (checklist):

1. `restic restore latest --target /restore-test --tag email`.
2. Subir Postgres temporário e `pg_restore -d fluxbus_restore /restore-test/fleetmanager-db.dmp`.
3. Conferir contagens: `SELECT count(*) FROM email_messages;`, `SELECT count(*) FROM email_message_attachments;`, `SELECT count(*) FROM email_accounts;`.
4. Comparar hashes de 10 anexos amostrados com `sha256sum`.
5. Restaurar dump do Mailcow em instância isolada, verificar domínio `fluxbus.com.br`, caixas e DKIM.
6. Testar login IMAP em caixa restaurada e leitura de 5 mensagens.
7. Registrar data, duração, divergências e responsável em `docs/` ou ticket.

---

## 11. Fases de entrega

| Fase | Escopo | Entregáveis | Esforço estimado | Critério de saída |
|---|---|---|---|---|
| **Fase 0 — Desbloqueio** | Mailcow na VPS, DNS/DMARC `p=none`, domínio da empresa, remetente `@fluxbus.com.br`, correções críticas de segurança | Compose Mailcow; registros DNS; `companies.email_domain` mapeado (**parcial: já no working tree**); `MAIL_HOST/MAIL_FROM` ajustados; checagem de tenant no `EmailMessageService` (**parcial: já no working tree**); remoção de `DEFAULT_COMMERCIAL_PASS`; commit/versionamento da `V4730` | **6–10 dias-homem restantes** (parte já iniciada) | Envios pelos 2 caminhos chegam com SPF/DKIM/DMARC `pass`; nenhum ID de mensagem acessível entre tenants; mudanças commitadas e migração versionada |
| **Fase 1 — Importação** | Wizard, pastas aninhadas, `full_path`/`sort_order`, `received_at`, job agendado com ShedLock, limites/backoff | `ImapSyncScheduler`; recursão de pastas; DTOs atualizados; barra de progresso; relatório de importação | **12–16 dias-homem** | Caixa cPanel de 50k mensagens importada integralmente em execuções incrementais, com árvore de pastas idêntica |
| **Fase 2 — Segurança** | Sanitização server-side, persistência SPF/DKIM/DMARC, validador de anexos generalizado, proxy de links, imagens bloqueadas, marketing, perigosos, auditoria | `EmailSecurityService`, `LinkProxyController`, `email_security_events` preenchido, UI de "Perigosos" e "Marketing", modal de aviso | **16–20 dias-homem** | Teste com e-mail malicioso: links geram interstitial, anexo executável fica `BLOCKED`, clique é auditado |
| **Fase 3 — Confiabilidade** | Cota real, DSN/MDN, backup Restic, restore mensal, monitoramento | Endpoint de quota, DSN no envio, job de backup, runbook de restore, alertas | **10–14 dias-homem** | Restore completo validado; entrega/leitura exibidas na UI; cota bloqueia importação acima de 95% |

**Dependências:** Fase 0 → Fase 1 → Fase 2 → Fase 3. DMARC `p=reject` (§3.3) só após Fase 2 e 2–4 semanas de relatórios limpos. A correção do `DEFAULT_COMMERCIAL_PASS` e do tenant deve acontecer **antes** de qualquer exposição adicional de endpoints.

---

## 12. Riscos e decisões em aberto

| # | Risco / decisão | Impacto | Mitigação / decisão necessária |
|---|---|---|---|
| R1 | Provedor da VPS bloqueia porta 25 de saída | Alto — nenhum e-mail sai | Solicitar liberação ou contratar smarthost; incluir no SPF; validar com `telnet`/`openssl` |
| R2 | Conflito de portas 80/443 com Traefik/nginx | Alto — Mailcow não sobe | Escolher opção A/B/C/D de §4.5. Recomendado: IP dedicado ou VPS separada |
| R3 | MX do cPanel ainda ativo durante a migração | Médio — mensagens divergem entre servidores | MX antigo com prioridade 20; migrar por usuário; só remover após Fase 1 |
| R4 | Domínio por empresa vs domínio único `fluxbus.com.br` | Alto — multi-tenant | Decidir se `companies.email_domain` é obrigatório para todas as empresas ou apenas FluxBus; se multi-domínio, cada domínio precisa de DKIM/DMARC próprios |
| R5 | `companies.email_domain` vazio em empresas legadas | Médio | Backfill controlado; bloquear criação de caixa até preenchimento; não inferir do domínio do `users.email` |
| R6 | HTML bruto já armazenado em `body_html` (histórico) | Médio — XSS em mensagens antigas | Sanitização na leitura além da ingestão; job de re-sanitização do acervo |
| R7 | `UIDVALIDITY` mudou → código atual apaga mensagens locais | Alto — perda de metadados de segurança/leitura | Trocar delete por reimportação controlada com preservação de `security_status`/`read_at` |
| R8 | Estado de leitura diverge (`\Seen` não é escrito no IMAP; sync é READ_ONLY) | Médio — "lido" na app não aparece no webmail | Decidir: escrever `\Seen` de volta (READ_WRITE) ou manter leitura apenas local e documentar |
| R9 | `EmailMessageService` sem checagem explícita de tenant | **Crítico** — vazamento entre empresas | Versão parcial já no working tree; faltam commit, testes e bloqueio quando `TenantContext` estiver vazio (§5.5), incluindo download de anexos |
| R10 | `DEFAULT_COMMERCIAL_PASS` em claro | **Crítico** — credencial vazada no repositório | Rotacionar senha, remover do código, migrar para `email_configs`/secrets na Fase 0 |
| R11 | `V4730` é arquivo novo (untracked) e pode já ter sido aplicado em algum banco | Médio — conflito de versão Flyway | Checar `flyway_schema_history`; decidir se versiona como `V4730` ou renomeia para `V4731`; usar `IF NOT EXISTS`; não editar após aplicação |
| R12 | Remetente do sistema `@z7design.com.br` enviando como/para `@fluxbus.com.br` | Alto — falha DMARC | Decidir: alinhar `MAIL_FROM` e `spring.mail.properties.mail.smtp.from` a `fluxbus.com.br` ou manter domínio antigo sem mostrar como FluxBus |
| R13 | DMARC `p=reject` precipitado | Alto — e-mails legítimos rejeitados | Seguir rollout §3.3; monitorar `rua` por 2–4 semanas |
| R14 | Chave de criptografia de senhas perdida | Alto — todas as contas IMAP precisam de nova senha | Guardar em cofre com backup separado; documentar rotação |
| R15 | Classificação de marketing: rótulo ou movimento automático? | Médio — UX e LGPD | Decidir: apenas rótulo/filtro (recomendado) ou mover para pasta "Marketing" com consentimento |
| R16 | Quarantena no Mailcow vs lista local "Perigosos" | Médio — duplicidade de estados | Decidir fonte da verdade: Mailcow quarentena + espelho local com `security_status`; ação "Liberar" sincroniza via Admin API |
| R17 | Provisionar caixas via Admin API ou digitar credenciais? | Médio — segurança vs simplicidade | Recomendado Admin API com `MAILCOW_API_KEY` e senha gerada; manter modo manual para cPanel legado |
| R18 | Anexos `BLOCKED` mantidos em disco | Baixo/Médio — retenção de malware | Definir retenção curta (ex.: 30 dias) em diretório isolado, sem permissão de execução, com hash auditável |

### Decisões que precisam de confirmação do produto/infra

1. `companies.email_domain` é obrigatório para **todas** as empresas ou somente para a FluxBus?
2. Qual caixa será o `MAIL_FROM` do sistema: `noreply@fluxbus.com.br`, `suporte@fluxbus.com.br` ou outra?
3. Mailcow na VPS atual com segundo IP, ou VPS dedicada? (Recomenda-se VPS dedicada.)
4. A lista "Perigosos" deve ser virtual (filtro) ou uma pasta IMAP real no Mailcow?
5. Mover e-mails de marketing automaticamente ou apenas classificar?
6. Qual o limite de cota por plano (o default do SQL é 1 GB)?

---

## Apêndice A — Referências de código

| Tema | Arquivo |
|---|---|
| Contas IMAP/SMTP | `backend/src/main/java/com/z7design/fleet_manager/controller/EmailAccountController.java`, `service/email/EmailAccountService.java` |
| Sincronização | `backend/src/main/java/com/z7design/fleet_manager/service/email/ImapSyncService.java` |
| Mensagens/anexos | `backend/src/main/java/com/z7design/fleet_manager/controller/EmailMessageController.java`, `service/email/EmailMessageService.java` |
| Entidades | `backend/src/main/java/com/z7design/fleet_manager/model/email/{EmailAccount,EmailFolder,EmailMessage,EmailMessageAttachment}.java` |
| Fila do sistema | `backend/src/main/java/com/z7design/fleet_manager/worker/EmailDispatchWorker.java`, `model/email/EmailQueue.java`, `model/email/EmailConfig.java` |
| SMTP do sistema | `backend/src/main/java/com/z7design/fleet_manager/config/MailConfig.java`, `backend/src/main/resources/application.properties` |
| LGPD | `backend/src/main/java/com/z7design/fleet_manager/model/UserConsent.java`, `service/LgpdConsentService.java`, `frontend/src/pages/LgpdConsent.tsx` |
| Validador de anexos | `backend/src/main/java/com/z7design/fleet_manager/service/commercial/AttachmentSecurityValidator.java` |
| UI de e-mail | `frontend/src/pages/EmailModule.tsx` (`sanitizeHtml` linha ~66) |
| Migrações | `backend/src/main/resources/db/migration/V4538__create_email_management_module.sql`, `V4549__email_outlook_features.sql`, `V4730__email_domain_security_and_quota.sql` |
| Deploy | `deploy/docker-compose.prod-domains.yml`, `.github/workflows/deploy-ci-*.yml`, `deploy/coolify.backend.*.example` |
