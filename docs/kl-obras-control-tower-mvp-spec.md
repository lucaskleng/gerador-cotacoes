# KL Obras Control Tower — Especificação Executável do MVP

## 1) Épicos e User Stories (com critérios de aceite)

### Épico E1 — Acesso e Governança

**Objetivo:** garantir acesso seguro e visão correta por perfil.

#### US-001 — Login por e-mail/senha

Como usuário autorizado,
quero entrar com credenciais,
para acessar o sistema conforme meu perfil.

**Critérios de aceite (Gherkin):**

```gherkin
Feature: Autenticação
  Scenario: Login válido
    Given que existe um usuário ativo com e-mail e senha válidos
    When ele envia as credenciais na tela de login
    Then o sistema retorna token JWT válido
    And cria sessão autenticada

  Scenario: Login inválido
    Given que o usuário informa senha incorreta
    When ele tenta autenticar
    Then o sistema bloqueia o acesso
    And exibe mensagem de credenciais inválidas
```

#### US-002 — Controle por perfil (RBAC)

Como gestor,
quero restringir ações por perfil,
para garantir governança e responsabilidade.

```gherkin
Feature: Permissões por perfil
  Scenario: Usuário sem permissão tenta alterar marco
    Given que o usuário possui perfil Engenharia
    And a ação "alterar marco contratual" exige perfil Diretor
    When ele tenta salvar a alteração
    Then o sistema retorna erro de autorização
    And mantém os dados inalterados
```

---

### Épico E2 — Cadastro da Obra e Lotes

**Objetivo:** estruturar cada obra em unidades operacionais executáveis.

#### US-003 — Criar obra

Como PM/gestor,
quero cadastrar obra com marcos contratuais,
para iniciar planejamento com baseline correta.

```gherkin
Feature: Cadastro de obra
  Scenario: Obra criada em pré-início
    Given que contrato ativo e status de sinal são informados
    When o usuário salva a obra
    Then a obra é criada com status "pré-início" se o sinal não estiver confirmado
```

#### US-004 — Criar lote por obra

Como engenharia,
quero dividir a obra em lotes,
para acompanhar avanço e risco por lote.

```gherkin
Feature: Lotes
  Scenario: Lote associado à obra
    Given uma obra existente
    When o usuário cria um lote com responsável e datas alvo
    Then o lote fica vinculado à obra
    And aparece na visão executiva por lote
```

---

### Épico E3 — Cronograma Operacional

**Objetivo:** planejar e recalcular impacto real de atraso.

#### US-005 — Criar atividades com dependências

Como PCP,
quero definir atividades com duração e predecessoras,
para montar cronograma executável por dias úteis.

```gherkin
Feature: Cronograma com dependências
  Scenario: Atividade dependente só inicia após predecessora
    Given a atividade B depende da atividade A (FS)
    When A é planejada para terminar em D+5
    Then B não pode iniciar antes de D+6
```

#### US-006 — Recalcular marco ao atrasar atividade crítica

Como gestor,
quero recalcular automaticamente os marcos,
para enxergar impacto de atraso no prazo final.

```gherkin
Feature: Recalculo de cronograma
  Scenario: Atraso em atividade crítica
    Given uma atividade crítica no caminho crítico
    When o usuário registra 3 dias úteis de atraso
    Then o marco do lote é recalculado automaticamente
    And o dashboard exibe impacto em dias
```

---

### Épico E4 — Pendências e Aprovações

**Objetivo:** eliminar gargalos de aprovação e resposta.

#### US-007 — Abrir pendência com SLA

Como engenharia,
quero registrar pendência com criticidade e prazo,
para controlar gargalos de decisão.

```gherkin
Feature: Gestão de pendências
  Scenario: Pendência crítica vencida
    Given uma pendência crítica aberta com prazo expirado
    When o relógio do sistema ultrapassa o prazo
    Then o status muda para "vencida"
    And gera alerta vermelho
```

#### US-008 — Escalonamento automático

Como diretor,
quero receber escalonamentos automáticos,
para agir antes de comprometer entrega.

```gherkin
Feature: Escalonamento
  Scenario: Pendência crítica no caminho crítico sem resposta
    Given uma pendência crítica sem resposta impactando caminho crítico
    When ela ultrapassa o SLA
    Then o sistema escalona automaticamente para o gestor
```

---

### Épico E5 — Compras Críticas

**Objetivo:** proteger marcos contra risco de material long lead.

#### US-009 — Registrar item crítico e confirmação do fornecedor

Como suprimentos,
quero controlar pedido e confirmação,
para antecipar risco de atraso de material.

```gherkin
Feature: Compras críticas
  Scenario: Pedido emitido sem confirmação no prazo
    Given um item marcado como crítico
    And pedido emitido sem data de confirmação até o limite
    When o limite é atingido
    Then o sistema gera alerta vermelho de compra crítica
```

---

### Épico E6 — Dashboard e Relatório Executivo

**Objetivo:** suportar decisão diária e ritual semanal por exceção.

#### US-010 — Dashboard responde perguntas operacionais

Como gestor,
quero visualizar exceções principais em uma tela,
para tomar decisão em minutos.

```gherkin
Feature: Dashboard executivo
  Scenario: Visão de exceções
    Given dados atualizados de cronograma, pendências e compras
    When o gestor abre o dashboard
    Then ele visualiza atrasos do dia, responsáveis, lotes em risco e buffer restante
```

#### US-011 — Relatório semanal de 1 página

Como diretor,
quero relatório consolidado automático,
para conduzir reunião sem retrabalho manual.

```gherkin
Feature: Relatório semanal
  Scenario: Geração automática
    Given uma obra ativa com dados da semana
    When o usuário clica em "Gerar relatório"
    Then o sistema cria relatório com status geral, riscos, compras críticas e decisões pendentes
```

---

## 2) Modelo ER Inicial (MVP)

### Entidades principais

- **users** (id, name, email, password_hash, active, created_at)
- **roles** (id, code, description)
- **user_roles** (user_id, role_id)
- **projects** (id, name, client_name, start_date, contractual_deadline, first_delivery_deadline, final_deadline, contract_status, signal_status, status)
- **lots** (id, project_id, name, priority, owner_user_id, target_start, target_end, status)
- **tasks** (id, lot_id, name, stage, owner_user_id, planned_start, planned_end, actual_start, actual_end, duration_business_days, critical, status, delay_reason)
- **task_dependencies** (id, predecessor_task_id, successor_task_id, type)
- **issues** (id, project_id, lot_id, origin, category, criticality, owner_user_id, due_at, status, impact_critical_path, description)
- **purchases** (id, project_id, lot_id, description, supplier_id, lead_time_days, quote_date, po_date, confirmation_date, expected_delivery, status, critical)
- **suppliers** (id, name, contact_name, contact_email)
- **risks** (id, project_id, lot_id, title, probability, impact_days, severity, status, owner_user_id)
- **alerts** (id, project_id, lot_id, type, level, source_entity, source_id, message, status, created_at)
- **quality_gates** (id, lot_id, inspection_done, fat_done, released_for_dispatch)
- **audit_log** (id, actor_user_id, entity, entity_id, action, old_value, new_value, created_at)

### Relacionamentos-chave

- projects 1:N lots
- lots 1:N tasks
- tasks N:N tasks (via task_dependencies)
- projects/lots 1:N issues
- projects/lots 1:N purchases
- suppliers 1:N purchases
- projects/lots 1:N alerts
- users N:N roles
- users 1:N registros operacionais (owner_user_id)

---

## 3) Contratos de API (REST) do MVP

Base URL: `/api/v1`

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Obras e lotes

- `POST /projects`
- `GET /projects`
- `GET /projects/:projectId`
- `PATCH /projects/:projectId`
- `POST /projects/:projectId/lots`
- `GET /projects/:projectId/lots`

### Cronograma

- `POST /lots/:lotId/tasks`
- `PATCH /tasks/:taskId`
- `POST /tasks/:taskId/dependencies`
- `GET /lots/:lotId/schedule`
- `POST /lots/:lotId/schedule/recalculate`

### Pendências

- `POST /issues`
- `GET /issues`
- `PATCH /issues/:issueId`
- `POST /issues/:issueId/escalate`

### Compras críticas

- `POST /purchases`
- `GET /purchases?critical=true`
- `PATCH /purchases/:purchaseId`

### Alertas e riscos

- `GET /alerts`
- `PATCH /alerts/:alertId/ack`
- `POST /risks`
- `GET /risks`

### Dashboard e relatório

- `GET /dashboard/:projectId`
- `POST /reports/weekly/:projectId`
- `GET /reports/:reportId`

### Exemplos de payload

`POST /projects`

```json
{
  "name": "Subestação Cliente X",
  "clientName": "Cliente X",
  "startDate": "2026-04-01",
  "contractualDeadline": "2026-09-30",
  "firstDeliveryDeadline": "2026-06-03",
  "finalDeadline": "2026-09-30",
  "contractStatus": "active",
  "signalStatus": "confirmed"
}
```

`POST /issues`

```json
{
  "projectId": "prj_123",
  "lotId": "lot_1",
  "origin": "engineering",
  "category": "technical",
  "criticality": "high",
  "ownerUserId": "usr_45",
  "dueAt": "2026-04-08T18:00:00Z",
  "impactCriticalPath": true,
  "description": "Aprovação de unifilar revisado R03"
}
```

---

## 4) Plano de Sprints (Sprint 1 a Sprint 6)

### Sprint 1 — Fundação (2 semanas)

- Setup backend/frontend/db
- Auth + RBAC
- Entidades base: users, roles, projects, lots
- Tela Login + Cadastro de obra/lote

**DoD:** login funcional, criação de obra e lote com persistência.

### Sprint 2 — Cronograma núcleo (2 semanas)

- tasks + dependencies
- motor de calendário em dias úteis
- cálculo inicial de caminho crítico
- tela de cronograma (lista + visão temporal básica)

**DoD:** criação de atividades dependentes e cálculo de datas planejadas.

### Sprint 3 — Pendências + escalonamento (2 semanas)

- issues CRUD
- SLA e vencimento automático
- regra de escalonamento crítico
- feed de alertas iniciais

**DoD:** pendência crítica vencida gera alerta vermelho e escalonamento.

### Sprint 4 — Compras críticas (2 semanas)

- purchases + suppliers
- painel de exceções de suprimentos
- regra de alerta por falta de confirmação

**DoD:** item crítico sem confirmação no prazo aparece como risco vermelho.

### Sprint 5 — Dashboard executivo e relatório (2 semanas)

- endpoint consolidado de dashboard
- KPI de buffer e marcos
- geração de relatório semanal 1 página

**DoD:** dashboard responde perguntas operacionais essenciais.

### Sprint 6 — Hardening + piloto (2 semanas)

- auditoria completa (audit_log)
- melhorias de UX/performance
- testes de regressão e ajustes do caso zero
- treinamento e checklist de go-live

**DoD:** operação assistida com a obra piloto rodando no fluxo real.

---

## 5) Não-funcionais mínimos do MVP

- Latência de leitura do dashboard: alvo < 2s (p95).
- Disponibilidade em horário comercial: 99,5%.
- Trilha de auditoria para operações críticas: 100%.
- Segurança: senha com hash forte, JWT com expiração curta, RBAC validado em backend.

---

## 6) Riscos de implementação e mitigação

- **Risco:** dados desatualizados por baixa disciplina operacional.  
  **Mitigação:** telas com atualização rápida (<3 cliques), rotina diária de fechamento.
- **Risco:** cronograma complexo no início.  
  **Mitigação:** começar com dependências FS/SS e evoluir depois.
- **Risco:** escopo inflar para ERP.  
  **Mitigação:** governança de backlog por P0/P1/P2 e regra "feature só entra se proteger prazo".

---

## 7) Backlog priorizado por sprint (com esforço)

Escala sugerida de esforço: **P** (pequeno), **M** (médio), **G** (grande).

### Sprint 1

- US-001 Login por e-mail/senha (**M**)
- US-002 RBAC por perfil (**M**)
- US-003 Cadastro de obra (**M**)
- US-004 Cadastro de lote por obra (**P**)

### Sprint 2

- US-005 Atividades com dependências (**G**)
- US-006 Recalcular marco com atraso crítico (**G**)

### Sprint 3

- US-007 Pendência com SLA (**M**)
- US-008 Escalonamento automático crítico (**M**)

### Sprint 4

- US-009 Compras críticas e confirmação de fornecedor (**M**)

### Sprint 5

- US-010 Dashboard de exceções operacionais (**G**)
- US-011 Relatório semanal automático (**M**)

### Sprint 6

- Auditoria completa (regra 7) (**M**)
- Hardening de performance, segurança e usabilidade (**M**)

---

## 8) Definition of Ready (DoR) e Definition of Done (DoD)

### Definition of Ready (antes de desenvolver)

- História com objetivo de negócio explícito (qual pergunta operacional responde).
- Critérios de aceite em Gherkin definidos.
- Dependências técnicas identificadas (dados, permissões, integrações internas).
- Mock/tela de referência disponível para frontend.
- Métrica de sucesso definida (ex.: tempo de resposta, precisão do alerta).

### Definition of Done (para aceitar entrega)

- Critérios de aceite da história aprovados em teste funcional.
- Permissões de perfil validadas no backend.
- Evento de auditoria registrado para ações críticas.
- Testes automatizados mínimos cobrindo caminho feliz + erro crítico.
- Sem regressão nas perguntas-chave do dashboard executivo.

---

## 9) Plano de testes do MVP (objetivo e cobertura)

### Tipos de teste

- **Unitários:** regras de negócio (SLA, criticidade, cálculo de atraso, níveis de alerta).
- **Integração:** fluxos de API por módulo (Auth, Projetos/Lotes, Tasks, Issues, Purchases).
- **E2E:** cenários ponta a ponta da obra piloto (abertura → planejamento → execução → monitoramento).

### Cenários críticos obrigatórios

1. Atraso em atividade crítica recalcula marco do lote e atualiza dashboard.
2. Pendência crítica vencida dispara alerta vermelho e escalonamento.
3. Compra crítica sem confirmação no prazo entra no painel de exceções.
4. Usuário sem papel adequado recebe erro de autorização.
5. Entrega não pode ser liberada com gate de qualidade/FAT pendente.

### Critério de saída para go-live

- 0 falhas críticas abertas em cenários obrigatórios.
- Dashboard com atualização consistente em dados de até 24h.
- Ritual semanal executado com relatório automático sem edição manual.

---

## 10) Decisões de arquitetura para evitar retrabalho

- Adotar **eventos de domínio** para geração de alertas (ex.: `issue.overdue`, `purchase.unconfirmed`).
- Separar serviço de cálculo de cronograma do serviço de API para permitir evolução futura.
- Garantir que regras de negócio críticas existam no backend (não apenas na UI).
- Estruturar `audit_log` desde o início para rastreabilidade e compliance operacional.
- Padronizar enumerações de status (obra, lote, tarefa, pendência, compra, alerta) em contrato único.
