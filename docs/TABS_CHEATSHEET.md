# 🚀 Cheatsheet: Tabs Responsivas

## ⚡ Implementação Rápida

### 1️⃣ Imports

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3 } from 'lucide-react';
```

### 2️⃣ Template Base

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg gap-1">
    
    <Tooltip>
      <TooltipTrigger asChild>
        <TabsTrigger 
          value="tab-value" 
          className="flex items-center justify-center gap-1 px-2 py-2.5 text-xs sm:text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <IconName className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Nome Tab</span>
        </TabsTrigger>
      </TooltipTrigger>
      <TooltipContent>
        <p>Nome Completo da Tab</p>
      </TooltipContent>
    </Tooltip>
    
    {/* Repetir para outras tabs */}
    
  </TabsList>

  <TabsContent value="tab-value" className="mt-6">
    {/* Conteúdo da tab */}
  </TabsContent>
</Tabs>
```

---

## 📐 Grid Breakpoints

```css
grid-cols-2              /* Mobile: < 640px */
sm:grid-cols-3          /* Tablet pequeno: ≥ 640px */
md:grid-cols-4          /* Tablet: ≥ 768px */
lg:grid-cols-6          /* Laptop: ≥ 1024px */
xl:grid-cols-11         /* Desktop: ≥ 1280px */
```

---

## 🎨 Classes Essenciais

### TabsList
```css
grid w-full
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11
h-auto p-1
bg-gray-100 dark:bg-gray-800
rounded-lg gap-1
```

### TabsTrigger
```css
flex items-center justify-center gap-1
px-2 py-2.5
text-xs sm:text-sm
font-medium rounded-md
data-[state=active]:bg-white
data-[state=active]:shadow-sm
```

### Ícone
```css
h-4 w-4 flex-shrink-0
```

### Texto
```css
hidden sm:inline truncate
```

---

## ✅ DO's

```tsx
✅ <TabsList className="grid w-full ...">
✅ <Tooltip><TooltipTrigger asChild>
✅ <Icon className="h-4 w-4 flex-shrink-0" />
✅ <span className="hidden sm:inline truncate">
✅ grid-cols-2 sm:grid-cols-3 md:grid-cols-4
```

---

## ❌ DON'Ts

```tsx
❌ <div className="overflow-x-auto">
❌ <TabsList className="inline-flex min-w-max">
❌ <Button onClick={scrollLeft}><ChevronLeft />
❌ const tabsRef = useRef<HTMLDivElement>(null)
❌ style={{ width: '800px' }}
❌ whitespace-nowrap
```

---

## 📱 Comportamento por Dispositivo

| Dispositivo | Grid | Texto | Tooltip |
|-------------|------|-------|---------|
| 📱 Mobile | 2 cols | Oculto | ✅ Essencial |
| 📱 Tablet SM | 3 cols | Visível | ✅ Útil |
| 📲 Tablet | 4 cols | Visível | ✅ Útil |
| 💻 Laptop | 6 cols | Visível | ✅ Útil |
| 🖥️ Desktop | 11 cols | Visível | ✅ Útil |

---

## 🔧 Ajustes por Número de Tabs

### 4-6 Tabs
```tsx
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
```

### 7-9 Tabs
```tsx
grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9
```

### 10-11 Tabs
```tsx
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Tabs não responsivas | Usar `grid` em vez de `flex` |
| Texto oculto | `hidden sm:inline` |
| Ícone encolhido | `flex-shrink-0` |
| Tooltip não aparece | `asChild` no `TooltipTrigger` |
| Layout desalinhado | `max-w-7xl mx-auto px-4` no pai |

---

## 📋 Checklist de Implementação

- [ ] Import `Tooltip` components
- [ ] `TabsList` com `grid w-full`
- [ ] Breakpoints configurados
- [ ] `Tooltip` em cada `TabsTrigger`
- [ ] Ícone com `flex-shrink-0`
- [ ] Texto com `hidden sm:inline truncate`
- [ ] Testar em mobile
- [ ] Testar em tablet
- [ ] Testar em desktop
- [ ] Verificar alinhamento

---

## 🔗 Links Úteis

- [Documentação Completa](RESPONSIVIDADE_TABS.md)
- [Arquivo de Referência](../frontend/src/pages/Operacional.tsx)
- [Tailwind Grid Docs](https://tailwindcss.com/docs/grid-template-columns)

---

**💡 Dica:** Sempre copie do `Operacional.tsx` quando criar novas tabs!

