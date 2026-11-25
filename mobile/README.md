# FluxBus Mobile — Motorista + Financeiro

App Flutter que replica no celular as funcionalidades do **portal do motorista** do sistema web
(`/driver-dashboard`, `/driver/checklist`, `/driver/trips`, `/driver/work-orders`,
`/rh/ponto-eletronico`, `/employee-portal`, `/mensagens`).

## Funcionalidades implementadas

| Tela | O que faz (equivalente web) |
|---|---|
| Login | `POST /api/auth/login`, extrai `empresaId` do JWT, envia `X-Company-Id` |
| Início | 9 atalhos, escalas do mês, resumo de multas, contador de pendências offline, sincronização |
| Checklist | Check-out/Check-in, itens configuráveis por veículo, KM, fotos, odômetro, envio offline |
| Escalas | Lista do mês, filtros, registrar ponto (±10 min + justificativa), finalizar com KM, abrir execução |
| Execução da viagem | Direção IDA/VOLTA, iniciar/finalizar, validar QR (câmera) ou CPF/matrícula com GPS, lista de passageiros |
| Ordens de Serviço | Listar/abrir OS com veículo, KM, urgência, descrição e fotos; PDF |
| Ponto eletrônico | Registrar ENTRADA/SAÍDA/ALMOÇO com GPS e foto, solicitar ajuste, histórico do dia |
| Portal do empregado | Perfil, ponto, holerites, benefícios, documentos, treinamentos, férias e avisos |
| Mensagens | Recebidas/enviadas, marcar como lida, nova mensagem |
| Multas | Lista e resumo das multas do motorista vinculado |
| Operação | Códigos de percurso (criar/excluir), parte diária (criar/listar), horas do motorista |
| Perfil | Dados do usuário, vínculo com motorista, URL do servidor, logout |

## Endpoints usados

- Autenticação: `/api/auth/login`, `/api/drivers`
- Escalas/viagens: `/api/schedules/me`, `/api/schedules/date`, `/api/schedules/{id}/register-point`,
  `/api/schedules/{id}/finish-trip`, `/api/trips/start/{id}`, `/api/schedules/me/pdf`
- Checklist: `/api/frota/checklist-configs`, `/api/frota/vehicle-gate-checklists` (inclui upload de fotos)
- OS: `/api/fleet-work-orders`, `/api/fleet-work-orders/upload-photos`, `/{id}/pdf`
- Ponto: `/api/time-records/register`, `/today/{employeeId}`, `/next-record-type/{employeeId}`,
  `/request-adjustment`, `/api/employee-portal/time-records/*`
- Embarque: `/api/passengers/route/{routeId}`, `/api/boardings/validate-qr`, `/api/boardings/my-history`
- Portal: `/api/employee-portal/profile|payslips|benefits|documents|trainings|vacations|notifications`
- Mensagens: `/api/v1/messages/received|sent`, `PUT /{id}/read`, `POST /api/v1/messages`
- Multas: `/api/fines/driver/{driverId}`

## Módulo Financeiro

O app também contém o módulo financeiro completo, com navegação própria:

| Tela | Funcionalidades |
|---|---|
| Início | Resumo (a pagar, pago, vencido, a receber), vencidas, a receber em 7 dias |
| Contas a pagar | Listar/filtrar/buscar, criar/editar/excluir, dar baixa com comprovante, marcar paga, boleto (copiar linha/open PDF), importar boletos |
| Contas a receber | Listar/filtrar, criar/editar/excluir, marcar recebida, importar NFS-e, sincronizar medições |
| Fluxo de caixa | Entradas/saídas por vencimento, saldo atual e projetado, períodos 7/30/90 dias |
| Centros de custo | CRUD, orçamento/gasto e ativar/inativar |
| Relatórios | PDF de contas a pagar/receber e relatório personalizado PDF/Excel |
| Mais | Bancos, agências, fornecedores, conciliação bancária (upload/relatório), DDA, ordens de compra (aprovação financeira), medições e transações |

Endpoints principais: `/api/invoices`, `/api/accounts-receivable`, `/api/cost-centers`,
`/api/banks`, `/api/agencies`, `/api/suppliers`, `/api/bank-reconciliation`, `/api/dda`,
`/api/procurement/purchase-orders`, `/api/measurements`, `/api/financial/transactions` e
`/api/reports/contas-a-pagar/custom/pdf|excel`.

Conversão de status (igual ao web): `ABERTA → PENDENTE` (pagar) / `PENDING` (receber),
`VENCIDA → PENDENTE` / `OVERDUE`, `RECEBIDA → PAID`. O app envia `Authorization` e `X-Company-Id`
em todas as chamadas.

A navegação entre motorista e financeiro é automática conforme o papel do usuário; quando ele tem
acesso aos dois, aparece uma tela de escolha. Também é possível alternar pelo menu lateral.

> Não replicamos mocks do web: os serviços `/fluxo-caixa/*`, relatórios analíticos avançados,
> sincronização ERP/banco e histórico de pagamentos não possuem backend e por isso não foram
> transportados. O fluxo de caixa é calculado a partir dos endpoints reais de contas.

## Módulo de Gestão de Manutenção

Implementado em `lib/maintenance/` com shell próprio (`MaintenanceShell`) e navegação por perfil
(`EQUIPMENTS_*`, `MECANICO`, `MANUTENCAO`, `PORTARIA`, admin).

| Tela | Funcionalidades |
|---|---|
| Dashboard | Contadores de OS, varredura de preventivas, alertas de plano/componentes, últimas OS |
| Ordens de serviço | Busca/filtros por status/tipo, criar/editar, fotos, PDF, iniciar/aguardar peça/concluir/cancelar, duplicar, aprovar serviço externo, histórico |
| Planos | Alertas de KM/dias, registrar execução, excluir plano, atalho para criar OS |
| Mecânico | Quadros A Fazer / Em Andamento / Aguardando Peça / Externo / Finalizado; assumir, iniciar, notas, fotos, aprovar/recusar, concluir |
| Mais | Componentes preventivos, pneus (montar/desmontar/recap/sucata), checklists de portaria, laudos de inspeção com evidências, limpeza/lavajato, certificações CFME, garagens e veículos |

Endpoints usados: `/api/fleet-work-orders`, `/api/maintenance-plans`, `/api/fleet-component-controls`,
`/api/vehicle-inspections`, `/api/tires`, `/api/frota/vehicle-gate-checklists`,
`/api/client-checklists`, `/api/frota/vehicle-cleanings`, `/api/cfme-documents` e `/api/garages`.

Regras portadas do backend: prioridades `LOW/MEDIUM/HIGH/URGENT`, conclusão exige
`maintenancePerformed`, alertas de plano com tolerância 500 km / 7 dias ( igual ao backend ),
envio de fotos por multipart e fila offline para OS sem conexão.

> Não replicados: módulo de avarias e planos comerciais por cliente (são mocks no web), assinaturas
> manuscritas em canvas e geração de PDFs de portaria/limpeza no dispositivo (o PDF da OS vem do backend).

## Configuração

A URL base pode ser trocada na tela de login (**Servidor**) ou por build:

```bash
flutter build apk --dart-define=API_BASE_URL=https://ci.fluxbus.com.br
```

Padrão: `https://ci.fluxbus.com.br`.

Permissões já declaradas: INTERNET, CAMERA, ACCESS_COARSE_LOCATION e ACCESS_FINE_LOCATION
(Android) e descrições de uso de câmera/localização (iOS).

## Offline

Checklists, ponto e abertura de OS são enfileirados em `SharedPreferences` quando não há conexão.
A sincronização é manual (ícone na barra) e segue a regra do web: **4xx descarta**, **5xx reententa**.
O mesmo mecanismo é usado para validações de embarque registradas sem rede.

## Diferenças em relação ao web

- O mapa Leaflet do web foi substituído por coordenadas e endereço textual (sem dependência de mapa);
  o trajeto pode ser adicionado depois com `flutter_map`.
- A leitura de QR usa `mobile_scanner`; a digitação manual de CPF/matrícula está disponível como fallback.
- Os mocks do web (`INITIAL_PASSENGERS_LIST`, coordenadas fixas) não foram replicados: o app usa
  os dados reais dos endpoints. Se a rota não estiver cadastrada, a lista aparece vazia.
- Não há canvas de assinatura manuscrita (o web também não usa no fluxo do motorista); o aceite
  LGPD deve ser tratado no primeiro acesso do backend.

## Validação

```bash
flutter pub get
flutter analyze   # No issues found
flutter test      # 4 testes
```
