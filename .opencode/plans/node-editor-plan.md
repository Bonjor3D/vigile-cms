# Node Editor — Visual Code Builder

## 1. Концепция

Визуальный нод-редактор заменяет ручное написание CSS/JS в полях CodeEditor'a.
Пользователь собирает логику из нод (блоков) на графе, а система компилирует граф в финальный CSS / JS код.

**Где размещается:**
- Кнопка `Node Editor` в `EditHeader.tsx` (рядом с Save/Undo).
- Открывается модальное окно (как RichTextModal), во весь экран.
- Внутри: левый сайдбар с палитрой нод, центр — панорамируемое полотно, правый коллапсируемый сайдбар с выходным кодом.

**Что компилируется:**
- Граф компилируется в `customCss` и `customJs` для текущего выбранного элемента.
- Можно переключить на `Global CSS` / `Global JS` (режим задаётся в тулбаре модального окна).

---

## 2. Интерфейс модального окна

```
┌─────────────────────────────────────────────────────────────┐
│ [Node Editor]                              [Save] [×]       │ ← заголовок
├────────┬────────────────────────────────────┬───────────────┤
│        │                                    │  ► Code       │ ← правый сайдбар
│ Palette │        Workspace (pan/zoom)        │  ───────────  │   (коллапсируемый)
│  ─────  │       ┌───┐    ┌───┐              │  .my-class { │
│ CSS     │       │ A │───→│ B │              │    color:red; │
│  • Color│       └───┘    └───┘              │  }           │
│  • Size │                                    │               │
│  • ...  │       ┌───┐                        │  console.log  │
│ JS      │       │ C │                        │  (...)        │
│  • Event│       └───┘                        │               │
│  • Var  │                                    │               │
│  • ...  │                                    │               │
├────────┴────────────────────────────────────┴───────────────┤
│ [CSS mode] [JS mode] [Output: Element | Global]             │ ← нижний тулбар
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Левая палитра (240px)

Категории нод (раскрывающиеся группы):

**CSS Node**
- `Color` — задаёт цвет (hex/hsl/rgb)
- `Size` — width / height (px, %, vw, vh)
- `Spacing` — margin / padding (все стороны или individual)
- `Typography` — font-size, font-family, font-weight, text-align
- `Background` — background-color, background-image, gradient
- `Border` — border-width, border-style, border-color, border-radius
- `Shadow` — box-shadow (x, y, blur, spread, color)
- `Flexbox` — display:flex, direction, wrap, justify, align
- `Grid` — display:grid, columns, rows, gap
- `Transform` — rotate, scale, translate, skew
- `Animation` — animation-name, duration, timing, keyframes
- `Filter` — blur, brightness, contrast, grayscale
- `Pseudo-class` — :hover, :focus, :active, :before, :after
- `Media Query` — @media (max-width, min-width, etc.)
- `Custom Property` — `--var-name: value` (CSS variable)
- `Raw CSS` — произвольная CSS строка
- `Selector` — определяет CSS селектор для группы свойств

**JS Node**
- `Event` — click, mouseenter, mouseleave, input, submit
- `Query Selector` — `document.querySelector()`, `.querySelectorAll()`
- `Get Attribute` — получить .textContent, .value, .dataset, .style
- `Set Attribute` — установить .textContent, .value, .style, .classList
- `Condition` — if/else (сравнение значений)
- `Logic` — AND, OR, NOT
- `Variable` — объявление let/const
- `Math` — +, -, ×, ÷, random, round
- `String` — concat, template literal, length, slice
- `Array` — push, pop, map, filter, length
- `Console` — console.log, console.warn, console.error
- `Timer` — setTimeout, setInterval, clearTimeout
- `Fetch` — HTTP GET/POST запрос
- `DOM Create` — createElement, appendChild, removeChild
- `Function` — объявление функции (вход/выход)
- `Return` — return значение
- `Comment` — // comment
- `Raw JS` — произвольный JS код

### 2.2 Центральное полотно (workspace)

- Панорамирование: Drag пустого места (mouse drag)
- Зум: Ctrl + колесо
- Сетка точек (20px интервал), как в CanvasWorkspace
- Ноды перетаскиваются из палитры (drag-n-drop)
- Ноды можно выделять (клик), перемещать по полотну
- Коннекторы: из выходного порта ноды → во входной порт другой ноды
- Кабель рисуется как кривая Безье (или ломаная)
- Multi-selection: Shift+клик или рамка
- Delete/Backspace: удалить выделенные ноды и соединения
- Ctrl+C / Ctrl+V: копировать/вставить ноды
- Ctrl+Z / Ctrl+Y: undo/redo (отдельный HistoryStore для нод)

### 2.3 Правый сайдбар (320px, коллапсируемый)

- Кнопка `► Code` (или `◄ Code`) для сворачивания/разворачивания
- Две вкладки: `CSS` и `JS`
- Редактируемый Monaco Editor (можно править код вручную, изменения синхронизируются с графом)
- Подсветка синтаксиса
- Кнопка `Copy` для копирования кода

---

## 3. Архитектура нод

### 3.1 Базовая структура ноды

```typescript
interface NodePort {
  id: string
  label: string
  type: 'exec' | 'value' | 'css' | 'js' | 'selector' | 'color' | 'number' | 'string' | 'boolean'
  direction: 'input' | 'output'
}

interface VisualNode {
  id: string
  type: string            // 'color', 'size', 'event', 'variable', ...
  category: 'css' | 'js'
  label: string
  x: number
  y: number
  inputs: NodePort[]
  outputs: NodePort[]
  params: Record<string, any>   // значения параметров ноды
}

interface NodeConnection {
  id: string
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}
```

### 3.2 Коннекторы (порты)

- **exec** (белый) — поток выполнения (только JS). Стрелка сверху ноды → exec выход → exec вход следующей ноды.
- **value** (серый) — передача значения (строка, число, буль).
- **css** (синий) — CSS значение (например цвет, размер).
- **selector** (зелёный) — CSS селектор.
- **color** (красный) — цвет.
- **number** (оранжевый) — число.
- **string** (жёлтый) — строка.
- **boolean** (фиолетовый) — true/false.

Порты разных типов соединять нельзя. При попытке соединения несовместимых типов — визуальный запрет (красная обводка, курсор not-allowed).

---

## 4. Каталог нод

### 4.1 CSS Nodes

| Node | Input Ports | Output Ports | Params | Генерируемый CSS |
|------|-------------|--------------|--------|------------------|
| **Selector** | — | selector:out | `.class`, `#id`, `tag` | — |
| **Color** | — | color:out | value (hex/rgba) | `color: {value}` |
| **Size** | — | css:out | width, height, unit(px/vw/%) | `width: {width}{unit}; height: {height}{unit}` |
| **Spacing** | — | css:out | marginTop/Bottom/Left/Right, padding... | `margin: ...; padding: ...` |
| **Typography** | — | css:out | fontSize, fontFamily, fontWeight, textAlign, lineHeight | `font-size:; font-family:; ...` |
| **Background** | color:in(opt) | css:out | bgColor, gradient, image | `background: ...` |
| **Border** | color:in(opt) | css:out | width, style, color, radius | `border: {w} {s} {c}; border-radius: {r}` |
| **Shadow** | color:in(opt) | css:out | x, y, blur, spread, color, inset | `box-shadow: ...` |
| **Flexbox** | — | css:out | direction, wrap, justify, align, gap | `display:flex; flex-direction:; ...` |
| **Grid** | — | css:out | columns, rows, gap, template | `display:grid; grid-template-columns:; ...` |
| **Transform** | — | css:out | rotate, scaleX/Y, translateX/Y, skewX/Y | `transform: ...` |
| **Animation** | — | css:out | name, duration, timing, delay, iteration, keyframes | `animation: ... @keyframes ...` |
| **Filter** | — | css:out | blur, brightness, contrast, grayscale, hue | `filter: ...` |
| **Pseudo-class** | selector:in | selector:out | pseudo (:hover/:focus), content (for ::before) | `{selector}:{pseudo} { ... }` |
| **Media Query** | selector:in | selector:out | minWidth, maxWidth, type | `@media ({minW} {maxW}) { ... }` |
| **Custom Property** | value:in(opt) | css:out | name, value | `--{name}: {value}` |
| **Raw CSS** | — | css:out | raw string | `{raw}` |

**Правила компиляции CSS графа:**
1. Ноды соединяются последовательно: `Selector → [Pseudo-class] → [Media Query] → Color → Size → ...`
2. Все css:out порты итоговых нод собираются в блок селектора.
3. Если селектор не задан — используется `.sc-{elementId}` (авто-селектор элемента).
4. Media Query оборачивает всё содержимое в `@media (...)`.
5. Pseudo-class добавляет `:{pseudo}` к селектору.

**Пример графа:**
```
[Selector (.button)] → [Pseudo-class (:hover)] → [Color (#ff0000)]
                                               → [Background (#eee)]
```
Результат:
```css
.button:hover {
  color: #ff0000;
  background: #eee;
}
```

### 4.2 JS Nodes

| Node | Input Ports | Output Ports | Params | Генерируемый JS |
|------|-------------|--------------|--------|-----------------|
| **Event** | exec:in | exec:out, event:out | type (click/mouseenter/...), selector | `document.querySelector('{selector}').addEventListener('{type}', (e) => { exec });` |
| **Query Selector** | — | value:out | selector, all (bool) | `document.querySelector('{selector}')` / `querySelectorAll(...)` |
| **Get Attr** | value:in (element) | value:out | attr (textContent/innerHTML/value/dataset.xx) | `{element}.{attr}` |
| **Set Attr** | exec:in, value:in (val) | exec:out | attr, selector/valueFromInput | `{element}.{attr} = {value}` |
| **Condition** | exec:in, value:in (a), value:in (b) | exec:out (true), exec:out (false) | operator (===, !==, >, <, >=, <=) | `if ({a} {op} {b}) { execTrue } else { execFalse }` |
| **Logic** | value:in (a), value:in (b) | value:out | op (AND/OR/NOT) | `{a} && {b}` / `{a} \|\| {b}` / `!{a}` |
| **Variable** | value:in (init) | value:out | name, kind (let/const), initValue | `let {name} = {initValue}` |
| **Math** | value:in (a), value:in (b) | value:out | op (+, -, *, /, %, pow) | `({a} {op} {b})` |
| **String** | value:in (a), value:in (b) | value:out | op (concat, template) | `{a} + {b}` / `` `${a}${b}` `` |
| **Array** | value:in (items) | value:out | op (push/pop/map/filter/length) | `{arr}.{op}()` |
| **Console** | exec:in, value:in | exec:out | level (log/warn/error) | `console.{level}({value})` |
| **Timer** | exec:in | exec:out, timerId:out | type (timeout/interval), ms | `setTimeout(() => { exec }, {ms})` |
| **Fetch** | exec:in | exec:out, data:out | url, method, body | `fetch('{url}', {method, body}).then(r => r.json()).then(data => { exec })` |
| **DOM Create** | exec:in | exec:out, element:out | tag, className, textContent | `const el = document.createElement('{tag}'); el.className='{cls}'; el.textContent='{txt}'; parent.appendChild(el)` |
| **Function** | exec:in | exec:out | name, params[], isAsync | `async function {name}({params}) { exec }` |
| **Return** | exec:in, value:in | — | — | `return {value};` |
| **Comment** | — | — | text | `// {text}` |
| **Raw JS** | exec:in | exec:out | code | `{code}` |

**Правила компиляции JS графа:**
1. Начальная нода — `Event` (без exec:in). Она запускает цепочку выполнения.
2. exec порты образуют последовательность (как операторы `;`).
3. value порты передают значения (как переменные).
4. Несколько exec-входов в ноду: код генерируется для каждого входа отдельно.
5. Если у ноды нет exec:in — она считается "выражением" (expression mode), и код вставляется как выражение.
6. Все value-соединения генерируются как переменные (let _tmp1 = ...) и передаются по имени.

**Пример графа:**
```
[Event (click, .btn)] → [Variable (count, let, 0)] → [Set Attr (.counter, textContent, variable:count)] → [Console (log, variable:count)]
```
Результат:
```javascript
document.querySelector('.btn').addEventListener('click', (e) => {
  let count = 0;
  document.querySelector('.counter').textContent = count;
  console.log(count);
});
```

---

## 5. Компиляция графа → код

### 5.1 CSS Compiler

```typescript
interface CompileResult {
  css: string
  js: string
}

function compileGraph(nodes: VisualNode[], connections: NodeConnection[]): CompileResult
```

**Алгоритм CSS:**
1. Найти все ноды типа `Selector`. Если нет — создать дефолтный `.sc-{elementId}`.
2. Для каждого селектора собрать цепочки: `Selector → [Pseudo] → [Media] → {properties}`.
3. Для каждой цепочки собрать все css:out значения.
4. Сгруппировать по Media Query → селектор → свойства.
5. Отсортировать: сначала без media, потом media ascending.
6. Склеить в строку.

### 5.2 JS Compiler

**Алгоритм JS:**
1. Найти все ноды без exec:in (начальные) — обычно `Event`.
2. Для каждой начальной ноды построить AST обходом exec-соединений (DFS, избегая циклов по visited set).
3. Для каждой ноды сгенерировать JS код на основе её типа и параметров.
4. value-соединения: если выходной порт соединён с несколькими входами — создать временную переменную.
5. Склеить в строку с правильными отступами (каждый exec-уровень +2 пробела).

---

## 6. Хранение данных

### 6.1 В сторе (editor.ts или новый nodeEditorStore.ts)

```typescript
interface NodeEditorState {
  nodes: VisualNode[]
  connections: NodeConnection[]
  activeMode: 'css' | 'js'
  outputMode: 'element' | 'global'
  viewBox: { x: number; y: number; zoom: number }
  showCodePanel: boolean
}
```

### 6.2 В ComponentNode

Поле `customCss` и `customJs` остаются, но теперь генерируются из графа.
Либо добавляется новое поле:

```typescript
interface ComponentNode {
  // ... existing fields
  nodeGraph?: {
    nodes: VisualNode[]
    connections: NodeConnection[]
  }
}
```

При save: граф компилируется → customCss / customJs записываются.
При load: customCss / customJs читаются, но если есть nodeGraph — он восстанавливается и используется для визуального редактора.

---

## 7. Компоненты React

### 7.1 Файловая структура (новые файлы в `src/editor/`)

```
src/editor/
├── NodeEditorModal.tsx       — модальное окно (обёртка)
├── NodeEditorToolbar.tsx     — нижний тулбар (CSS/JS mode, output mode)
├── NodePalette.tsx           — левая палитра нод
├── NodeWorkspace.tsx         — центральное полотно (pan/zoom, grid)
├── NodeBlock.tsx             — одна нода на полотне (drag, ports)
├── NodePort.tsx              — порт (коннектор)
├── NodeConnectionLine.tsx    — линия соединения (Безье)
├── NodeCodePanel.tsx         — правый сайдбар с кодом (Monaco)
├── NodeEditorStore.ts        — Zustand store для графа
├── cssCompiler.ts            — компилятор CSS
├── jsCompiler.ts             — компилятор JS
├── nodeDefinitions.ts        — описание всех типов нод
└── nodes/
    ├── cssNodes.ts           — CSS ноды (определения и генераторы кода)
    └── jsNodes.ts            — JS ноды (определения и генераторы кода)
```

### 7.2 Приблизительная структура NodeEditorModal

```tsx
export function NodeEditorModal({ elementId, onClose }) {
  const [mode, setMode] = useState<'css' | 'js'>('css')
  const [showCode, setShowCode] = useState(true)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2>Node Editor</h2>
        <button onClick={onClose}>×</button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <NodeWorkspace />
        {showCode && <NodeCodePanel />}
      </div>

      {/* Footer toolbar */}
      <NodeEditorToolbar mode={mode} onModeChange={setMode} />
    </div>
  )
}
```

---

## 8. Взаимодействия

| Действие | Результат |
|----------|-----------|
| Drag ноды из палитры на полотно | Создаётся новая нода в позиции drop |
| Drag ноды по полотну | Перемещение (обновление x,y) |
| Drag из выходного порта → входной порт | Создание соединения (connection dropped если типы совместимы) |
| Клик по порту + клик по другому порту | Альтернативный способ соединения |
| Shift+клик по ноде | Добавить/убрать из выделения |
| Delete при выделении | Удалить ноды и их соединения |
| Ctrl+C / Ctrl+V | Копировать/вставить выделенные ноды |
| Ctrl+Z / Ctrl+Y | Undo/Redo |
| Клик по пустому месту | Сброс выделения |
| Resize правого сайдбара | Изменение ширины (drag границы) |
| Ctrl+колесо | Zoom полотна |
| Drag пустого места | Pan полотна |
| Двойной клик по пустой ноде | Редактирование параметров (inline или popup) |

---

## 9. Этапы реализации

### Phase 1: Основа (2-3 дня)
1. `nodeDefinitions.ts` + `cssNodes.ts` + `jsNodes.ts` — определения всех нод
2. `NodeEditorStore.ts` — Zustand store (nodes, connections, CRUD)
3. `NodeEditorModal.tsx` — каркас модального окна
4. `NodePalette.tsx` — палитра с drag-n-drop

### Phase 2: Полотно и ноды (2-3 дня)
5. `NodeWorkspace.tsx` — pan/zoom, сетка, рендер нод
6. `NodeBlock.tsx` — визуальный блок, перемещение, выделение
7. `NodePort.tsx` — порты (визуальные точки)
8. `NodeConnectionLine.tsx` — соединения (Безье)

### Phase 3: Компиляция (1-2 дня)
9. `cssCompiler.ts` — компиляция CSS графа
10. `jsCompiler.ts` — компиляция JS графа

### Phase 4: Интеграция (1 день)
11. Кнопка `Node Editor` в `EditHeader.tsx`
12. Привязка к `elementId` — сохранение графа в `ComponentNode.nodeGraph`
13. `NodeCodePanel.tsx` — правый сайдбар с Monaco + авто-компиляция

### Phase 5: Полировка (1 день)
14. Copy/paste нод
15. Undo/redo графа
16. Multi-selection
17. Inline редактирование параметров
18. Анимации соединений

---

## 10. Потенциальные сложности и решения

| Сложность | Решение |
|-----------|---------|
| Циклы в графе | DFS с visited set; при обнаружении цикла — ошибка компиляции |
| Производительность при 50+ нодах | Canvas/SVG для рендера; виртуализация (только visible ноды) |
| Совместимость типов портов | Цветовая кодировка + запрет соединения несовместимых |
| Undo/Redo для графа | Отдельный store с historical; snapshot полного графа |
| Большие графы | Collapse/expand групп нод |
| Перевод существующего CSS/JS в граф | Парсер CSS → AST → граф (Phase 5+, опционально) |
