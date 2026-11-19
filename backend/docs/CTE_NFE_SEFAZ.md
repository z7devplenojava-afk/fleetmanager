# CT-e 4.00 e NF-e 4.00 — emissão direta na SEFAZ

Além da NFS-e Nacional, o sistema emite **CT-e (modelo 57, v4.00)** e **NF-e (modelo 55, v4.00)**
com certificado A1, assinatura XMLDSig, validação nos XSDs oficiais e transmissão SOAP à SEFAZ.
Não há API fiscal de terceiros.

## 1. O que foi implementado

| Documento | Emissão real | Consulta | Cancelamento | XML/PDF | Controller | Tela |
|-----------|--------------|----------|--------------|---------|------------|------|
| CT-e 4.00 | ✅ | ✅ | ✅ (`110111`) | ✅ | ✅ | ✅ |
| NF-e 4.00 | ✅ | ✅ | ✅ (`111111`) | ✅ | ✅ | ✅ |

Fluxo comum:

```
POST /api/fiscal/cte  (ou /nfe)
  -> exige certificado A1 ativo da empresa
  -> reserva número com retry em colisão do índice único
  -> monta XML no leiaute oficial
  -> assina com A1 (XmlSigner.signElement)
  -> valida contra XSD oficial (FiscalXmlValidator)
  -> envia envelope SOAP via mTLS (SefazSoapClient)
  -> interpreta protocolo/cStat/xMotivo (Cte/NfeResponseParser)
  -> persiste no banco + espelho em fiscal_documents
```

Status internos: `RASCUNHO`, `PROCESSANDO`, `EMITIDA`, `ERRO`. Notas canceladas recebem
`cancelled_at`/`cancellation_reason` e o espelho vira `CANCELLED`.

## 2. Endpoints

Base `/api/fiscal` (mesmos papéis financeiros da NFS-e).

### CT-e
| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/cte` | Lista |
| POST | `/cte` | Emite (XML, assinatura, XSD, SOAP) |
| GET | `/cte/{id}` | Detalhe |
| POST | `/cte/{id}/consultar` | Consulta situiação na SEFAZ |
| GET | `/cte/{id}/xml` | XML assinado |
| GET | `/cte/{id}/pdf` | DACTE gerada localmente |
| POST | `/cte/{id}/cancelar` | Evento `110111` |

### NF-e
| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/nfe` | Lista |
| POST | `/nfe` | Emite (XML, assinatura, XSD, SOAP) |
| GET | `/nfe/{id}` | Detalhe |
| POST | `/nfe/{id}/consultar` | Consulta situação na SEFAZ |
| GET | `/nfe/{id}/xml` | XML assinado |
| GET | `/nfe/{id}/pdf` | DANFE simplificada |
| POST | `/nfe/{id}/cancelar?justificativa=...` | Evento `111111` |

Frontend: `/fiscal/cte` (**Fiscal > Emissão de CT-e**) e `/fiscal/nfe`
(**Fiscal > Emissão NF-e (55)**).

## 3. Configuração

As URLs **devem** ser as do WebService da UF do emitente e do ambiente. Se ficarem vazias,
a emissão falha rapidamente com mensagem explicativa — nenhuma URL é inventada.

### CT-e

```properties
fiscal.cte.environment=${FISCAL_CTE_ENVIRONMENT:2}
fiscal.cte.sefaz-url-homologacao=${FISCAL_CTE_SEFAZ_URL_HOMOLOGACAO:}
fiscal.cte.sefaz-url-producao=${FISCAL_CTE_SEFAZ_URL_PRODUCAO:}
fiscal.cte.timeout-seconds=${FISCAL_CTE_TIMEOUT_SECONDS:90}
fiscal.cte.soap-action=${FISCAL_CTE_SOAP_ACTION:}
```

Quando `soap-action` fica vazio, o cliente usa as actions oficiais por serviço
(`CTeRecepcaoV4`, `CTeConsultaV4`, `CTeRecepcaoEventoV4`).

### NF-e

```properties
fiscal.nfe.environment=${FISCAL_NFE_ENVIRONMENT:2}
fiscal.nfe.sefaz-url-homologacao=${FISCAL_NFE_SEFAZ_URL_HOMOLOGACAO:}
fiscal.nfe.sefaz-url-producao=${FISCAL_NFE_SEFAZ_URL_PRODUCAO:}
fiscal.nfe.timeout-seconds=${FISCAL_NFE_TIMEOUT_SECONDS:90}
fiscal.nfe.soap-action=${FISCAL_NFE_SOAP_ACTION:}
fiscal.nfe.consulta-url-homologacao=${FISCAL_NFE_CONSULTA_URL_HOMOLOGACAO:}
fiscal.nfe.consulta-url-producao=${FISCAL_NFE_CONSULTA_URL_PRODUCAO:}
fiscal.nfe.evento-url-homologacao=${FISCAL_NFE_EVENTO_URL_HOMOLOGACAO:}
fiscal.nfe.evento-url-producao=${FISCAL_NFE_EVENTO_URL_PRODUCAO:}
```

As quatro URLs opcionais de consulta/evento, quando vazias, usam a URL única de autorização.
Configure-as se o autorizador da UF expuser serviços separados.

## 4. XSDs oficiais empacotados

- `backend/src/main/resources/fiscal/xsd/cte/` — pacote CT-e 4.00 (PL_CTe_400_NT2026.004 RTC 1.01)
- `backend/src/main/resources/fiscal/xsd/nfe/` — pacote NF-e 4.00 (PL_010g_v1.03)
- `backend/src/main/resources/fiscal/xsd/v1.01/` — NFS-e Nacional v1.01

`FiscalXmlValidator` resolve os imports/include pelo nome do arquivo dentro da pasta,
bloqueia acesso externo (DTD/XSD) e remove DOCTYPE remoto do xmldsig.

## 5. Testes

`backend/src/test/java/com/z7design/fleet_manager/fiscal/`:

| Teste | Cobertura |
|-------|-----------|
| `NfseXmlRoundTripTest` | DPS v1.01 + assinatura |
| `NfseEventXmlTest` | DPS com IBS/CBS, pedRegEvento, evento assinado, parser |
| `CteXmlRoundTripTest` | CT-e assinado vs XSD + evento de cancelamento |
| `NfeXmlRoundTripTest` | NF-e assinada vs XSD |

Todos passam com `./gradlew test --tests "com.z7design.fleet_manager.fiscal.*"`.

## 6. Limitações

**CT-e**
- XML gerado sem atributo `versao` na raiz `<CTe>` porque o XSD oficial não o permite
  (`versao="4.00"` fica em `<infCte>`).
- `infDoc` usa `infOutros` com `tpDoc=99` (o request não tem documento originário).
- `CteResponse` não expõe protocolo/rejeição; os detalhes ficam no banco.
- Colunas extras de transmissão são gravadas via `JdbcTemplate` (a entidade não foi alterada).
- Roteamento por UF é manual: uma URL por ambiente; UFs em SVC-AN/SVC-RS exigem configuração.
- `xml()` só serve XML assinado (a assinatura é filha obrigatória da raiz no XSD).

**NF-e**
- Cancelamento implementado com `tpEvento=111111` (o evento canônico da NF-e 4.00).
- CSTs suportados: `00`, `40/41/50`, CSOSN `101/102/103/300/400`. PIS/COFINS por alíquota.
- DANFE é simplificada e gerada localmente, com aviso de que não tem validade fiscal.
- Notas em `PROCESSANDO` (cStat 101) exigem consulta manual; não há reprocessamento automático.
- Ambiente sempre o da configuração (o campo `environment` do DTO é ignorado).

**Geral**
- Cancelamento irreversible: não há "desfazer"; a SEFIN/SEFAZ decide.
- Sem contingência (EPEC/EPEC-CT-e) e sem emissão em lote.
- Nenhuma integração foi validada contra serviços reais da SEFAZ: é obrigatório testar em
  homologação com o certificado da empresa e o WebService da UF antes de produção.
- Além disso, o módulo genérico `FiscalController.upload` e `FiscalService.importXml` seguem
  como `TODO` (fora do escopo desta entrega).

## 7. Checklist antes de produção

- [ ] `fiscal.cte.environment=1` e `fiscal.nfe.environment=1`.
- [ ] URLs de homologação e produção preenchidas com o WebService da UF autorizada.
- [ ] Actions SOAP conferidas no WSDL do autorizador.
- [ ] Certificado A1 válido, ativo, do CNPJ da empresa.
- [ ] CT-e: fornecer documento originário real em vez de `tpDoc=99`.
- [ ] NF-e: revisar CSTs/PIS/COFINS e a DANFE emitida.
- [ ] Teste ponta a ponta em homologação: emitir, consultar, cancelar, baixar XML/PDF.
- [ ] Definir política de reprocessamento de notas em `PROCESSANDO`.
