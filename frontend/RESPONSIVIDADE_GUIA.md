# 📱 Guia de Responsividade - Secured Guard

## 🎯 Objetivo
Tornar o sistema totalmente responsivo para dispositivos mobile, tablet e monitores grandes SEM precisar de frontend separado.

## 📊 Breakpoints Tailwind
```
sm:  640px  - Phones (landscape)
md:  768px  - Tablets
lg:  1024px - Laptops
xl:  1280px - Desktops
2xl: 1536px - Large Displays
```

## ✅ Problemas Corrigidos

### 1. MainLayout.tsx
**Antes:**
```tsx
<div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
```

**Depois:**
```tsx
<div className="w-full max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1800px] mx-auto">
```

**Benefícios:**
- ✅ Monitores pequenos (até 1024px): conteúdo ocupa toda largura
- ✅ Laptops (1024px-1280px): max 1200px
- ✅ Desktops (1280px-1536px): max 1400px
- ✅ Monitores grandes (1536px+): max 1800px

### 2. Cards Responsivos
**Padrão recomendado:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* cards */}
</div>
```

### 3. Sidebar e Conteúdo
**Mobile:**
- Sidebar overlay (sobre o conteúdo)
- Botão hambúrguer para abrir/fechar

**Desktop:**
- Sidebar fixa lateral
- Conteúdo se ajusta automaticamente

### 4. Tabelas
**Mobile:**
- Scroll horizontal ou cards empilhados
- Colunas menos importantes ocultas

**Desktop:**
- Tabela completa

## 🛠️ Checklist de Implementação

### Layouts
- [x] MainLayout responsivo
- [ ] Holerites: grid de cards
- [ ] Frota: grid de resumo
- [ ] Dashboard: widgets responsivos

### Componentes
- [ ] Tabelas: scroll horizontal em mobile
- [ ] Modais: largura adaptativa
- [ ] Forms: inputs em coluna única em mobile
- [ ] Botões: tamanho reduzido em mobile

### Tipografia
- [ ] Títulos: text-xl sm:text-2xl lg:text-3xl
- [ ] Textos: text-sm sm:text-base
- [ ] Padding/Margin: p-2 sm:p-4 lg:p-6

## 📝 Padrões de Código

### Spacing Responsivo
```tsx
className="p-2 md:p-4 lg:p-6"  // padding
className="space-y-2 md:space-y-4"  // vertical spacing
className="gap-2 md:gap-4 lg:gap-6"  // grid gap
```

### Flexbox Responsivo
```tsx
className="flex flex-col md:flex-row"  // coluna mobile, linha desktop
className="items-start md:items-center"
className="justify-start md:justify-between"
```

### Visibility Condicional
```tsx
className="hidden md:block"  // só aparece em desktop
className="block md:hidden"  // só aparece em mobile
className="truncate sm:whitespace-normal"  // texto truncado mobile
```

### Grid Responsivo
```tsx
// 1 coluna mobile, 2 tablet, 3 desktop, 4 grande
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
```

## 🎨 Exemplo Completo

```tsx
<div className="space-y-4 md:space-y-6">
  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
      Título
    </h1>
    <Button className="w-full md:w-auto">
      Ação
    </Button>
  </div>

  {/* Cards Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <Card className="p-4">
      <CardTitle className="text-sm sm:text-base">Card 1</CardTitle>
      <CardContent className="text-xs sm:text-sm">
        Conteúdo
      </CardContent>
    </Card>
  </div>

  {/* Tabela */}
  <div className="overflow-x-auto">
    <table className="w-full min-w-[600px]">
      {/* ... */}
    </table>
  </div>
</div>
```

## 🚀 Próximos Passos

1. ✅ Corrigir MainLayout
2. ⏳ Atualizar Holerites page
3. ⏳ Atualizar Frota page
4. ⏳ Revisar componentes de UI
5. ⏳ Testar em diferentes dispositivos

