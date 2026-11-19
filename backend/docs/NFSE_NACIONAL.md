# NFS-e Nacional (SEFIN) — Emissão direta

Módulo de emissão da NFS-e Nacional (leiaute **v1.01**) integrado diretamente à SEFIN
(`/API/SefinNacional`), com assinatura XMLDSig pelo certificado **A1 (e-CNPJ)** da empresa.
Não há API fiscal intermediária.

## 1. Fluxo

```
POST /api/fiscal/nfse
  -> reserva número da DPS (service_invoices.dps_number)
  -> monta a DPS (NfseXmlBuilder)
  -> assina XMLDSig enveloped, C14N inclusivo, RSA-SHA1/SHA-1 (XmlSigner)
  -> valida contra os XSDs oficiais v1.01 (NfseSchemaValidator)
  -> envia à SEFIN via mTLS (NfseSefinClient)
  -> interpreta a resposta (NfseResponseParser)
  -> persiste em service_invoices + fiscal_documents
```

Status interno da nota (`service_invoices.status`):

| Status        | Significado                                                            |
|---------------|------------------------------------------------------------------------|
| `RASCUNHO`    | DPS reservada, ainda não transmitida                                   |
| `PROCESSANDO` | DPS assinada e enviada; aguardando/indefinida a resposta da SEFIN      |
| `EMITIDA`     | NFS-e autorizada; `nfse_key` e `number` (nNFSe) preenchidos             |
| `CANCELADA`   | Evento `e101101` de cancelamento registrado na SEFIN                    |
| `ERRO`        | DPS rejeitada, inválida ou não localizada na SEFIN                      |

Enquanto não há autorização, `service_invoices.number` fica como `DPS<dpsNumber>`; após a
autorização passa a ser o `nNFSe` devolvido pela SEFIN.

### Numeração e concorrência

- `dps_number` é sequencial por `(company_id, series)`, calculado localmente
  (`max(dps_number) + 1`).
- O índice único `uk_service_invoices_dps (company_id, series, dps_number)` garante que duas
  emissões simultâneas não usem o mesmo número: a colisão é capturada e a reserva é refeita
  (até 5 tentativas).
- Ao iniciar uma emissão, notas em `PROCESSANDO` com mais de **2 minutos** são consultadas na
  SEFIN (`GET /dps/{id}` ou `GET /nfse/{chave}`):
  - autorizada -> é conciliada como `EMITIDA`;
  - HTTP 404 -> marcada como `ERRO` (a transmissão anterior não chegou à SEFIN);
  - SEFIN indisponível (HTTP 5xx/falha de rede) -> a nova emissão é bloqueada com **409**
    para evitar NFS-e duplicada para o mesmo serviço.
- A consulta manual (`POST /api/fiscal/nfse/{id}/consultar`) aplica a mesma regra: DPS em
  `PROCESSANDO` que retorna 404 é marcada como `ERRO` e pode ser emitida novamente.

## 2. Endpoints

Base: `/api/fiscal` (requer `SUPER_ADMIN`, `ADMIN`, `COMPANY_ADMIN`, `FLEX_ADMIN` ou `FINANCEIRO`).

| Método | Caminho                        | Descrição                                             |
|--------|--------------------------------|-------------------------------------------------------|
| GET    | `/nfse`                        | Lista as NFS-e da empresa                             |
| POST   | `/nfse/preview`                | Gera a DPS e valida o XSD sem transmitir              |
| POST   | `/nfse`                        | Emite a NFS-e                                         |
| GET    | `/nfse/{id}`                   | Detalhe da nota                                       |
| POST   | `/nfse/{id}/consultar`         | Consulta a SEFIN (por chave ou por Id da DPS)          |
| POST   | `/nfse/{id}/cancelar`          | Registra evento de cancelamento (`e101101`)           |
| GET    | `/nfse/{id}/xml`               | XML assinado (ou DPS não assinada, se ainda não enviada) |
| GET    | `/nfse/{id}/pdf`               | DANFSE simplificada (marca "sem validade" se não autorizada) |
| GET    | `/nfse/config`                 | Dados fiscais da empresa                              |
| PUT    | `/nfse/config`                 | Atualiza IM, IE, código IBGE e regime tributário       |
| GET    | `/certificados`                | Lista certificados A1                                 |
| POST   | `/certificados`                | Upload `multipart` (`file`, `password`)               |
| POST   | `/certificados/{id}/ativar`    | Ativa o certificado                                   |
| DELETE | `/certificados/{id}`           | Remove o certificado                                  |

Frontend: rota `/fiscal/nfse` (menu **Fiscal > Emissão NFS-e**).

## 3. Configuração

`backend/src/main/resources/application.properties` (valores via ambiente):

| Variável                             | Padrão                                                            |
|--------------------------------------|-------------------------------------------------------------------|
| `FISCAL_NFSE_ENVIRONMENT`            | `2` (1 = produção, 2 = homologação/produção restrita)              |
| `FISCAL_NFSE_SEFIN_URL_HOMOLOGACAO`  | `https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional`     |
| `FISCAL_NFSE_SEFIN_URL_PRODUCAO`     | `https://sefin.nfse.gov.br/SefinNacional`                          |
| `FISCAL_NFSE_TIMEOUT_SECONDS`        | `90`                                                               |
| `FISCAL_CERTIFICATE_ENCRYPTION_KEY`  | vazio (fallback de desenvolvimento — **obrigatório em produção**)  |
| `FISCAL_NFSE_EVENTO_PATH`            | `/eventos` (recurso de eventos na base da SEFIN)                   |

A chave do certificado deve ser AES-256 em Base64:

```bash
openssl rand -base64 32
```

O certificado A1 e sua senha são gravados criptografados com **AES-256-GCM**; trocar a chave
invalida os certificados já armazenados (é necessário reenviá-los).

## 4. Passo a passo (homologação)

1. **Dados fiscais** (`PUT /nfse/config` ou tela de configuração):
   - CNPJ da empresa (14 dígitos) já cadastrado em `companies`;
   - inscrição municipal;
   - código IBGE do município (7 dígitos);
   - regime tributário (`1` não optante, `2` MEI, `3` ME/EPP).
2. **Certificado**: envie o `.pfx/.p12` A1 e a senha e ative-o. O CNPJ do certificado precisa
   ser o mesmo da empresa (validado na emissão).
3. **Prévia**: `POST /nfse/preview` para conferir `schemaValid` e o XML.
4. **Emissão**: `POST /nfse`. Sucesso => `status = EMITIDA` com `nfseKey`.
5. **Consulta**: `POST /nfse/{id}/consultar` para reprocessar notas em `PROCESSANDO`.
6. **Cancelamento**: `POST /nfse/{id}/cancelar` com `reasonCode` (`1`, `2` ou `9`) e
   `justification` (15 a 255 caracteres). Registra o evento `e101101`, assina e envia à SEFIN;
   em caso de sucesso a nota passa para `CANCELADA`.
7. **IBS/CBS (opcional):** envie `ibscbs` no corpo da emissão com a classificação
   (`finNFSe`, `cIndOp` de 6 dígitos, `indDest`, `cst`, `cClassTrib`). O leiaute v1.01 da DPS
   aceita apenas essa classificação; alíquotas e totais são parametrizados pela SEFIN e
   extraídos da NFS-e autorizada (`parseIbscbs`), aparecendo no DANFSE.
8. **Download**: XML assinado e DANFSE em `/nfse/{id}/xml` e `/nfse/{id}/pdf`.

Requisitos para o município: o emissor precisa estar habilitado no padrão nacional e o
certificado deve ser aceito pela SEFIN (cadeia ICP-Brasil).

## 5. Limitações conhecidas

- **IBS/CBS parcial (por leiaute):** a DPS v1.01 só admite a classificação tributária; valores,
  alíquotas e totalizadores vêm da NFS-e devolvida pela SEFIN. Não é possível informá-los na DPS.
- **Eventos:** implementado apenas o cancelamento (`e101101`). Substituição (`e105102`),
  manifestações e eventos de ofício não têm endpoint.
- **Sem emissão em lote** e sem controle de municípios que ainda não aderiram ao padrão nacional.
- **Assinatura RSA-SHA1/SHA-1**: exigida pelo leiaute v1.01; não alterar sem revisar o manual.
- **Um certificado ativo por empresa** (índice parcial `uk_fiscal_certificates_active`).
- **Numeração local**: caso a base seja restaurada de um backup antigo, os números de DPS
  podem retroceder e a SEFIN rejeitará a duplicidade; nesse caso é necessário ajustar
  `dps_number` manualmente.

## 6. Checklist para produção

- [ ] `FISCAL_NFSE_ENVIRONMENT=1`.
- [ ] `FISCAL_CERTIFICATE_ENCRYPTION_KEY` definida e guardada em cofre de segredos.
- [ ] Certificado A1 válido, do CNPJ correto, com validade monitorada (a tela mostra o
      vencimento; renove antes de expirar).
- [ ] Dados fiscais conferidos (IM, IBGE, regime) e serviço com `cTribNac` de 6 dígitos.
- [ ] Teste completo em homologação: prévia, emissão, consulta, cancelamento, XML e PDF.
- [ ] Confirmar com a SEFIN o caminho real do recurso de eventos (`FISCAL_NFSE_EVENTO_PATH`).
- [ ] Definir processo de contingência para notas em `PROCESSANDO` e para rejeições.
- [ ] Definir rotina de backup da tabela `service_invoices` (contém XML assinado e resposta).

## 7. Problemas comuns

| Sintoma                                              | Causa provável                                                        |
|------------------------------------------------------|-----------------------------------------------------------------------|
| `Nenhum certificado A1 ativo`                        | Nenhum certificado enviado/ativado para a empresa                     |
| `O certificado A1 ativo pertence ao CNPJ ...`        | Certificado de outro CNPJ do grupo                                    |
| `Certificado A1 ativo está vencido`                  | Renovar o A1                                                          |
| `O XML da DPS não passou na validação do leiaute`    | Campo fora do padrão; a mensagem aponta o nó/valor                    |
| HTTP 403 da SEFIN                                    | mTLS recusado (cadeia incompleta) ou ambiente incorreto               |
| `DPS não localizada na SEFIN`                        | Envio anterior não concluiu; a nota foi marcada como `ERRO`           |
| 409 ao emitir                                        | Existe DPS em `PROCESSANDO` sem confirmação; consulte-a primeiro      |

## 8. Estrutura

```
backend/src/main/java/com/z7design/fleet_manager/
  fiscal/
    CertificateCrypto.java          AES-256-GCM do A1 e da senha
    FiscalCertificateMaterial.java  chave privada + cadeia + SSLContext
    NfseDpsId.java                  Id da DPS (45 posições)
    NfseXmlBuilder.java             DPS v1.01
    NfseSchemaValidator.java        validação XSD local
    XmlSigner.java                  XMLDSig RSA-SHA1
    NfseSefinClient.java            cliente mTLS (POST /nfse, GET /nfse/{chave}, GET /dps/{id})
    NfseResponseParser.java         interpretação da resposta
  service/
    NfseEmissionService.java        orquestração, numeração, concorrência, conciliação
    FiscalCertificateService.java   upload/ativação/material
  controller/NfseController.java    API REST
backend/src/main/resources/
  db/migration/V4715__create_electronic_cte_and_service_invoice.sql
  db/migration/V4716__nfse_emission_and_fiscal_certificates.sql
  fiscal/xsd/v1.01/                 XSDs oficiais
frontend/src/
  pages/fiscal/NfseEmissionPage.tsx
  services/nfseService.ts
```
