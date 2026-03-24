# 📘 PRD – Gestão de Escalas e Jornada do Motorista

## 1. Visão Geral
Este documento define os requisitos para o módulo de "Gestão de Escalas", com foco na integração da funcionalidade de "Gestão de Jornada e Otimização de Horas do Motorista". O objetivo é garantir que a definição de escalas seja equilibrada, justa e conforme as regras trabalhistas.

---

## 2. Objetivo da Funcionalidade
Garantir que a definição de escalas de motoristas seja feita de forma **equilibrada, justa e conforme regras trabalhistas**, evitando:
* Motoristas com excesso de horas extras
* Motoristas com saldo negativo elevado
* Risco legal e operacional

O sistema deve **apoiar o Gestor de Tráfego na decisão**, não apenas permitir a criação da escala.

---

## 3. Conceito-Chave
> **Toda escala impacta a jornada do motorista.**
> O sistema deve calcular, alertar e sugerir ajustes antes da escala ser confirmada.

---

## 4. Controle de Jornada do Motorista
Para cada **Motorista**, o sistema deve manter:

### 4.1 Parâmetros de Jornada
* Carga horária contratual (ex: 44h semanais)
* Limite diário de horas trabalhadas
* Limite semanal
* Limite mensal
* Regras de horas extras (configurável)

### 4.2 Banco de Horas
* Saldo atual (positivo ou negativo)
* Histórico de apuração
* Horas previstas (escalas futuras)
* Horas realizadas (viagens finalizadas)

---

## 5. Cálculo Automático de Horas Trabalhadas
### 5.1 Fonte do Cálculo
As horas devem ser calculadas com base em:
* Início real da viagem
* Fim real da viagem
* Pausas operacionais registradas
* Eventos de troca de motorista

### 5.2 Troca de Motorista
Quando ocorrer troca:
* As horas são **divididas proporcionalmente**
* Cada motorista recebe apenas o tempo que executou
* O histórico mantém vínculo com a mesma viagem

---

## 6. Apoio à Decisão na Criação da Escala
Durante a **definição da escala**, o Gestor de Tráfego deve visualizar:
* Saldo atual de horas do motorista
* Horas previstas para a nova escala
* Saldo projetado após a execução
* Indicadores visuais:
  * 🟢 OK (equilibrado)
  * 🟡 Atenção
  * 🔴 Risco (excesso ou déficit)

### 6.1 Sugestão Inteligente
O sistema deve sugerir:
* Motoristas com menor risco de extrapolação
* Melhor equilíbrio entre o time
* Alternativas quando houver conflito

---

## 7. Alertas e Regras Automáticas
### 7.1 Alertas Preventivos
Gerar alertas quando:
* Motorista se aproxima do limite diário
* Limite semanal/mensal será ultrapassado
* Saldo negativo ultrapassa limite configurado
* Excesso de horas extras recorrente

### 7.2 Regras de Bloqueio (Configurable)
O sistema pode:
* Apenas alertar
* Bloquear a escala
* Exigir justificativa do gestor

---

## 8. Relatórios de Jornada
Relatórios disponíveis:
* Horas trabalhadas por motorista (dia / semana / mês)
* Banco de horas consolidado
* Comparativo planejado x realizado
* Ranking de equilíbrio de jornada

---

## 9. Métricas de Sucesso da Funcionalidade
* Redução de horas extras excessivas
* Redução de saldo negativo acumulado
* Melhor distribuição de horas entre motoristas
* % de escalas criadas sem violar regras de jornada
* Redução de ajustes manuais pós-escala

---

## 10. Benefício Estratégico
Com essa funcionalidade, o sistema deixa de ser apenas **operacional** e passa a ser:
* Preventivo
* Inteligente
* Conformidade legal
* Apoio real à gestão de pessoas
