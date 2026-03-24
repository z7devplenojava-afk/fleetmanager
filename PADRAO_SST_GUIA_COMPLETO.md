# 📱 PADRÃO SST - Guia Completo para Ajustar Telas

## 🎯 **Por que este padrão?**

O **Controle SST** foi identificado como a tela que **funciona melhor em mobile**. Este documento mostra EXATAMENTE como replicar esse padrão em outras telas.

---

## ✅ **Telas Já Ajustadas:**

- [x] **Holerites** - 100% padrão SST aplicado
- [x] **Comprovantes** - 100% padrão SST aplicado
- [x] **Logs de Envio** - Já estava simples
- [x] **Unificação** - Simplificado

---

## 📋 **Telas Pendentes de Ajuste:**

- [ ] **Frota** - Precisa ajustar (7 tabs!)
- [ ] **Dashboard** - Verificar
- [ ] **Financeiro** - Verificar
- [ ] **RH** - Verificar
- [ ] **Clientes** - Verificar
- [ ] **Contratos** - Verificar
- [ ] **Funcionários** - Verificar
- [ ] **Outros módulos** - Verificar conforme necessário

---

## 🎨 **PADRÃO SST - Anatomia Completa**

### **1. HEADER (Cabeçalho)**

#### ❌ **NÃO FAZER (complexo demais):**
```tsx
<div className="bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black rounded-xl border border-gray-700 p-6 shadow-lg">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-4 mb-3">
        <div className="p-3 bg-seguranca-red rounded-xl shadow-lg">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-seguranca-lightgray truncate">
            <span className="hidden sm:inline">Gestão de </span>Nome<span className="hidden md:inline"> e Mais Texto</span>
          </h1>
          // ... muitos elementos condicionais ...
```

#### ✅ **FAZER (padrão SST):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
      <IconName className="h-8 w-8 text-seguranca-yellow" />
      Nome da Tela
    </h1>
    <p className="text-gray-400 mt-1">Descrição breve</p>
  </div>
  <div className="flex gap-2">
    <Button 
      variant="outline"
      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
    >
      <Icon className="h-4 w-4 mr-2" />
      Ação Secundária
    </Button>
    <Button className="bg-seguranca-red hover:bg-seguranca-darkred">
      <Icon className="h-4 w-4 mr-2" />
      Ação Principal
    </Button>
  </div>
</div>
```

**Características:**
- ✅ `flex flex-col sm:flex-row` (empilha em mobile)
- ✅ Título direto (sem textos condicionais)
- ✅ 1 ícone apenas (h-8 w-8)
- ✅ Botões à direita (gap-2)

---

### **2. TABS (Abas)**

#### ❌ **NÃO FAZER (complexo demais):**
```tsx
<div className="relative tab-container">
  <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
    <TabsList className="bg-gradient-to-r from-seguranca-graphite to-gray-800 border border-gray-600/50 rounded-2xl p-2 w-full shadow-2xl backdrop-blur-sm">
      <div className="flex w-full gap-1">
        <TabsTrigger className="group relative flex-1 min-w-[110px] md:min-w-0 tab-trigger tab-transition tab-hover-effect data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-yellow data-[state='active']:to-yellow-500 data-[state='active']:text-seguranca-black data-[state='active']:shadow-xl ...">
          // ... 10 linhas de classes ...
```

#### ✅ **FAZER (padrão SST):**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-seguranca-graphite border-gray-600">
    <TabsTrigger value="tab1" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
      Nome Tab 1
    </TabsTrigger>
    <TabsTrigger value="tab2" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
      Nome Tab 2
    </TabsTrigger>
    <TabsTrigger value="tab3" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
      Nome Tab 3
    </TabsTrigger>
    <TabsTrigger value="tab4" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
      Nome Tab 4
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="tab1" className="space-y-6 mt-6">
    {/* Conteúdo */}
  </TabsContent>
</Tabs>
```

**Características:**
- ✅ `grid` (não flex)
- ✅ `grid-cols-2 md:grid-cols-4` (2x2 mobile, 1x4 desktop)
- ✅ `data-[state='active']:bg-seguranca-red` (ativo = vermelho)
- ✅ `text-xs sm:text-sm` (texto responsivo)
- ✅ Sem gradientes, sem animações complexas

**Ajuste o grid-cols conforme número de tabs:**
- 3 tabs: `grid-cols-3`
- 4 tabs: `grid-cols-2 md:grid-cols-4`
- 5 tabs: `grid-cols-2 md:grid-cols-5`
- 6+ tabs: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`

---

### **3. CARDS DE ESTATÍSTICAS**

#### ❌ **NÃO FAZER (complexo demais):**
```tsx
<div className="group bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/10">
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <p className="text-red-300/80 text-sm font-medium">Total de Items</p>
      <p className="text-3xl font-bold text-white">80</p>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        <span className="text-red-300/60 text-xs">Ativo</span>
      </div>
    </div>
    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
      <Icon size={28} className="text-white" />
    </div>
  </div>
</div>
```

#### ✅ **FAZER (padrão SST):**
```tsx
<Card className="bg-seguranca-graphite border-gray-600">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-seguranca-lightgray">
      Nome do Card
    </CardTitle>
    <IconName className="h-4 w-4 text-seguranca-yellow" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-seguranca-lightgray">80</div>
    <p className="text-xs text-gray-400 mt-1">Descrição breve</p>
  </CardContent>
</Card>
```

**Características:**
- ✅ Componente `Card` do Shadcn
- ✅ Sem gradientes
- ✅ Ícone pequeno (h-4 w-4)
- ✅ Texto de 2xl (não 3xl ou 4xl)
- ✅ Sem animações hover

**Grid para os cards:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards aqui */}
</div>

// Ou para 4 cards:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards aqui */}
</div>
```

---

### **4. BOTÕES**

#### ❌ **NÃO FAZER (complexo demais):**
```tsx
<Button className="group relative bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-110 px-8 py-6 text-lg font-bold rounded-2xl border border-pink-400/30">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
      <Plus size={20} className="text-white" />
    </div>
    <span>Texto do Botão</span>
  </div>
</Button>
```

#### ✅ **FAZER (padrão SST):**
```tsx
<Button className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto">
  <IconName className="h-4 w-4 mr-2" />
  Texto do Botão
</Button>
```

**Variações:**
```tsx
// Botão primário
<Button className="bg-seguranca-red hover:bg-seguranca-darkred">

// Botão secundário
<Button variant="outline" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">

// Botão destrutivo
<Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
```

**Responsividade:**
- `w-full sm:w-auto` - Largura total em mobile, automática em desktop

---

### **5. LISTA DE ITENS**

#### ❌ **NÃO FAZER:**
```tsx
<div className="bg-seguranca-black/30 rounded-lg border border-gray-600/30">
  <div className="divide-y divide-gray-600/30">
    {items.map(item => (
      <div className="p-4 hover:bg-seguranca-graphite/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-full">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{item.name}</p>
              // ... muitos elementos ...
            </div>
          </div>
          
          {/* 5 botões lado a lado - NÃO CABE EM MOBILE! */}
          <div className="flex space-x-2">
            <Button>Ver</Button>
            <Button>Editar</Button>
            <Button>Email</Button>
            <Button>WhatsApp</Button>
            <Button>Excluir</Button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

#### ✅ **FAZER (padrão SST):**
```tsx
<div className="space-y-2">
  {items.map(item => (
    <Card key={item.id} className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected.includes(item.id)}
            onCheckedChange={(checked) => handleSelect(item.id, checked)}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <IconName className="h-4 w-4 text-seguranca-yellow flex-shrink-0" />
              <p className="text-white font-medium truncate">{item.name}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span>{item.info1}</span>
              <span>•</span>
              <span>{item.info2}</span>
              <span>•</span>
              <span>{item.info3}</span>
            </div>
            
            {/* Botões responsivos */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => handleView(item)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black text-xs"
              >
                <Eye size={14} className="mr-1" />
                <span className="hidden sm:inline">Visualizar</span>
                <span className="sm:hidden">Ver</span>
              </Button>
              
              <Button
                onClick={() => handleAction1(item)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black text-xs"
              >
                <Icon1 size={14} className="sm:mr-1" />
                <span className="hidden sm:inline">Ação 1</span>
              </Button>
              
              <Button
                onClick={() => handleAction2(item)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black text-xs"
              >
                <Icon2 size={14} className="sm:mr-1" />
                <span className="hidden sm:inline">Ação 2</span>
              </Button>
              
              {/* Botões menos importantes - apenas desktop */}
              <Button
                onClick={() => handleDownload(item)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black text-xs hidden md:flex"
              >
                <Download size={14} className="mr-1" />
                Baixar
              </Button>
              
              <Button
                onClick={() => handleDelete(item)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-red-400 hover:bg-red-500/10 text-xs hidden md:flex"
              >
                <Trash2 size={14} className="mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

**Características:**
- ✅ Cada item é um `Card`
- ✅ Checkbox para seleção
- ✅ Texto com `truncate` (não quebra)
- ✅ Info com `flex-wrap` (quebra se necessário)
- ✅ Botões em `flex-wrap` (quebram linha em mobile)
- ✅ Ações principais visíveis, secundárias `hidden md:flex`
- ✅ Ícone só em mobile, texto+ícone em desktop

---

### **6. CONTAINERS/CARDS DE SEÇÃO**

#### ❌ **NÃO FAZER:**
```tsx
<Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm mb-8">
```

#### ✅ **FAZER:**
```tsx
<Card className="bg-seguranca-graphite border-gray-600 rounded-lg p-6">
```

ou com responsividade:
```tsx
<Card className="bg-seguranca-graphite border-gray-600 rounded-lg p-3 md:p-6">
```

---

## 📐 **GRIDS RESPONSIVOS**

### **Para 2 Cards:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

### **Para 3 Cards:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### **Para 4 Cards:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### **Para 5+ Cards:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
```

---

## 🎨 **TAMANHOS E CORES PADRÃO**

### **Ícones:**
```tsx
// Headers
<Icon className="h-8 w-8 text-seguranca-yellow" />

// Cards de estatística
<Icon className="h-4 w-4 text-seguranca-yellow" />

// Botões
<Icon className="h-4 w-4 mr-2" />

// Lista items
<Icon className="h-4 w-4 text-seguranca-yellow flex-shrink-0" />
```

### **Textos:**
```tsx
// Título principal
<h1 className="text-2xl font-bold text-seguranca-lightgray">

// Subtítulo
<p className="text-gray-400 mt-1">

// Card título
<CardTitle className="text-sm font-medium text-seguranca-lightgray">

// Card valor
<div className="text-2xl font-bold text-seguranca-lightgray">

// Card descrição
<p className="text-xs text-gray-400 mt-1">

// Info secundária
<span className="text-xs text-gray-400">
```

### **Spacing:**
```tsx
// Entre seções
<div className="space-y-6">

// Entre cards
gap-6

// Padding cards
p-6 ou p-3 md:p-6

// Margin top
mt-6
```

---

## 🛠️ **PASSO A PASSO PARA AJUSTAR UMA TELA:**

### **Passo 1: Identificar a Tela**
Exemplo: Vou ajustar `Frota.tsx`

### **Passo 2: Fazer Backup**
```bash
cp frontend/src/pages/Frota.tsx frontend/src/pages/Frota.tsx.backup
```

### **Passo 3: Ajustar Header**
Trocar o header complexo pelo padrão SST (copiar de `SST.tsx` linha 233-258)

### **Passo 4: Ajustar Tabs**
Trocar tabs complexas pelo padrão SST (copiar de `SST.tsx` linha 261-275)

**IMPORTANTE:** Ajustar `grid-cols-X` conforme número de tabs!

### **Passo 5: Ajustar Cards**
Trocar cards com gradientes pelo padrão SST (copiar de `SST.tsx` linha 280-341)

### **Passo 6: Ajustar Listas** (se tiver)
Usar o padrão de lista simplificada (ver seção 5 acima)

### **Passo 7: Testar**
```bash
npm run dev
# Acessar no celular: http://192.168.1.116:3000/rota-da-tela
```

### **Passo 8: Ajustar se Necessário**
- Se tabs não cabem: reduzir `grid-cols`
- Se botões não cabem: adicionar `hidden md:flex` nos menos importantes
- Se texto quebra: adicionar `truncate`

---

## 📋 **CHECKLIST PARA CADA TELA:**

### **Header:**
- [ ] Usa `flex flex-col sm:flex-row`?
- [ ] Título tem ícone de h-8 w-8?
- [ ] Botões à direita com gap-2?
- [ ] Sem gradientes complexos?

### **Tabs:**
- [ ] Usa `TabsList` com `grid`?
- [ ] `grid-cols-X` apropriado?
- [ ] `data-[state='active']:bg-seguranca-red`?
- [ ] `text-xs sm:text-sm`?

### **Cards:**
- [ ] Usa componente `Card` do Shadcn?
- [ ] `bg-seguranca-graphite border-gray-600`?
- [ ] Ícone h-4 w-4?
- [ ] Texto 2xl (não 3xl ou 4xl)?

### **Lista:**
- [ ] Cada item é um `Card`?
- [ ] Texto com `truncate`?
- [ ] Botões com `flex-wrap`?
- [ ] Ações secundárias `hidden md:flex`?

### **Teste Mobile:**
- [ ] Tabs cabem (2x2 ou scroll)?
- [ ] Cards legíveis?
- [ ] Botões fáceis de tocar?
- [ ] Sem scroll horizontal?
- [ ] Igual ao SST?

---

## 🎯 **EXEMPLOS COMPLETOS:**

### **Exemplo 1: Frota (7 tabs)**

```tsx
// TABS - Usar grid-cols-2 md:grid-cols-4 lg:grid-cols-7
<TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-seguranca-graphite border-gray-600">
  <TabsTrigger value="veiculos" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
    Veículos
  </TabsTrigger>
  {/* ... outras 6 tabs ... */}
</TabsList>
```

### **Exemplo 2: Dashboard (sem tabs, só cards)**

```tsx
<div className="space-y-6">
  {/* Header padrão SST */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
        <BarChart3 className="h-8 w-8 text-seguranca-yellow" />
        Dashboard
      </h1>
      <p className="text-gray-400 mt-1">Visão geral do sistema</p>
    </div>
  </div>

  {/* Cards de estatísticas - padrão SST */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total Usuários</CardTitle>
        <Users className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-seguranca-lightgray">225</div>
        <p className="text-xs text-gray-400 mt-1">Usuários ativos</p>
      </CardContent>
    </Card>
    {/* Outros 3 cards... */}
  </div>
</div>
```

---

## ⚠️ **O QUE EVITAR:**

### **❌ Não usar:**
- Gradientes triplos: `from-X via-Y to-Z`
- Animações lentas: `duration-500` ou mais
- Hover scale: `hover:scale-105` ou maior
- Sombras complexas: `shadow-2xl hover:shadow-X/50`
- Efeitos blur: `backdrop-blur-sm`
- Rotações: `group-hover:rotate-12`
- Translações: `hover:-translate-y-2`
- Skew effects: `-skew-x-12`
- Múltiplos divs aninhados

### **✅ Usar:**
- Card componente do Shadcn
- Cores sólidas
- Transições rápidas (padrão ou 200ms)
- Grid nativo
- Classes responsivas simples

---

## 📱 **TESTE SEMPRE:**

### **No navegador desktop:**
```
http://localhost:3000
```
1. Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Testar: 375px, 768px, 1024px, 1440px

### **No celular real:**
```
http://192.168.1.116:3000
```
1. Testar todas as abas
2. Testar botões
3. Verificar scroll horizontal (não deve ter!)
4. Comparar com SST

---

## 🎯 **REGRA DE OURO:**

> **"Se funciona no SST, copie EXATAMENTE o código dele!"**

Não tente "melhorar" ou "deixar mais bonito" - o SST já está perfeito para mobile!

---

## 📂 **ARQUIVOS DE REFERÊNCIA:**

### **Modelo Perfeito:**
```
frontend/src/pages/RH/SST.tsx
```

### **Exemplo Aplicado:**
```
frontend/src/pages/Holerites.tsx
```
- Linhas 3117-3142: Header padrão SST
- Linhas 3145-3160: Tabs padrão SST
- Linhas 3163-3199: Cards padrão SST
- Linhas 3462-3548: Lista padrão SST

---

## ✅ **RESUMO VISUAL:**

### **Mobile (<768px):**
```
┌─────────────────────┐
│ 📄 Título Tela      │ ← h-8 w-8
│ Descrição           │
│ [Botão][Botão]      │ ← w-full em mobile
├─────────────────────┤
│ [Tab1][Tab2]        │ ← grid-cols-2
│ [Tab3][Tab4]        │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Card 1       📊 │ │ ← h-4 w-4
│ │   80            │ │ ← text-2xl
│ │ Descrição       │ │ ← text-xs
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Card 2       📈 │ │
│ └─────────────────┘ │
├─────────────────────┤
│ ☑️ 📄 Item 1        │
│   Info • Info       │
│   [Ver][📧][💬]    │ ← 3 principais
└─────────────────────┘
```

### **Desktop (≥768px):**
```
┌──────────────────────────────────────────┐
│ 📄 Título      [Botão1][Botão2]         │
│ Descrição                                │
├──────────────────────────────────────────┤
│ [Tab1][Tab2][Tab3][Tab4]                │ ← grid-cols-4
├──────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│ │C1📊│ │C2📈│ │C3📉│ │C4📌│            │
│ └────┘ └────┘ └────┘ └────┘            │
├──────────────────────────────────────────┤
│ ☑️ 📄 Item Nome Completo                │
│   Info1 • Info2 • Info3                 │
│   [Visualizar][Email][WhatsApp][Baixar][Excluir] │
└──────────────────────────────────────────┘
```

---

## 💾 **SALVAR ESTE DOCUMENTO!**

**Amanhã:**
1. Abra este arquivo: `PADRAO_SST_GUIA_COMPLETO.md`
2. Escolha uma tela para ajustar
3. Copie o código do padrão SST
4. Cole na tela que vai ajustar
5. Teste no celular
6. Repita para próxima tela

---

## 🎯 **Meta:**

Ajustar **TODAS as telas** para o padrão SST = **Sistema 100% responsivo!**

**Boa sorte amanhã! 💪📱✨**

