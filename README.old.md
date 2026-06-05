# Полноценный план разработки визуального CMS/Website Builder
## Архитектура, функционал, структура проекта, UX, режим редактирования, система компонентов и хранения

---

# 1. Общая концепция проекта

## 1.1 Основная идея

Проект представляет собой полноценную визуальную CMS/Website Builder систему с inline-редактированием всего сайта прямо на странице.

Основная цель:

- создание сайтов без отдельной классической админ-панели;
- редактирование сайта непосредственно в интерфейсе страницы;
- визуальный DOM-редактор;
- гибкая система компонентов;
- хранение структуры сайта в БД;
- возможность использовать систему как основу для создания новых сайтов;
- возможность дальнейшего расширения функционала.

По архитектуре это гибрид:

- CMS;
- конструктора сайтов;
- визуального редактора;
- low-code платформы.

Фактически система ближе к:

- Figma;
- Webflow;
- Google Sites;
- Elementor;
- Dreamweaver;
- Wix;
- Tilda.

Но с упором:

- на полный контроль;
- собственную архитектуру;
- структурированность;
- возможность программного расширения.

---

# 2. Выбор технологий

# 2.1 Почему Razor не лучший вариант

Razor Pages и MVC подходят для:

- серверного рендеринга;
- классических сайтов;
- административных панелей.

Но плохо подходят для:

- полноценного live-редактирования;
- визуального DOM-конструктора;
- drag-and-drop редактора;
- сложного frontend state management;
- SPA-архитектуры.

Для такого проекта Razor станет слишком ограниченным.

Особенно проблемы появятся:

- при live preview;
- при обновлении DOM;
- при визуальном редактировании;
- при работе с компонентами;
- при редакторе кода;
- при реактивности интерфейса.

---

# 2.2 Рекомендуемый стек

## Frontend

### Основной вариант

- React
- TypeScript
- Vite
- Zustand
- TailwindCSS
- TipTap Editor
- Monaco Editor
- Framer Motion

## Backend

- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT + Cookies Auth

## Почему именно так

### React

Подходит идеально для:

- реактивного интерфейса;
- редактора;
- динамического DOM;
- live state;
- overlay системы;
- drag-and-drop;
- hot updates.

### TypeScript

Позволяет:

- жестко типизировать DOM-модель;
- типизировать компоненты;
- безопасно хранить schema;
- масштабировать проект.

### ASP.NET Core

Отлично подходит:

- для API;
- авторизации;
- хранения данных;
- файлов;
- генерации страниц;
- middleware;
- серверной логики.

---

# 3. Общая архитектура

# 3.1 Архитектура приложения

Проект делится на:

- frontend editor;
- backend API;
- renderer engine;
- storage system;
- auth system;
- component system;
- asset system.

---

# 4. Структура проекта

# 4.1 Frontend структура

```txt
frontend/
│
├── src/
│   ├── app/
│   ├── pages/
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   ├── shared/
│   ├── editor/
│   ├── builder/
│   ├── renderer/
│   ├── stores/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   ├── components/
│   ├── modals/
│   ├── overlays/
│   ├── dom/
│   ├── layout/
│   ├── api/
│   └── types/
│
├── public/
└── package.json
```

---

# 4.2 Backend структура

```txt
backend/
│
├── Controllers/
├── Services/
├── Repositories/
├── Models/
├── DTO/
├── Database/
├── Middleware/
├── Authentication/
├── Authorization/
├── Pages/
├── Components/
├── Assets/
├── Storage/
├── Editors/
├── Validation/
├── Extensions/
├── Helpers/
├── Configuration/
└── Program.cs
```

---

# 5. Система авторизации

# 5.1 Общая логика

Существует одна форма:

- логин;
- пароль;
- запомнить меня.

Если пользователя не существует:

- автоматически создается аккаунт;
- выполняется автологин.

Если пользователь существует:

- выполняется вход.

---

# 5.2 Функционал авторизации

## Поля

### Login

Тип:

```txt
input[type=text]
```

Проверки:

- минимальная длина;
- запрещенные символы;
- trim;
- уникальность.

---

### Password

Тип:

```txt
input[type=password]
```

Проверки:

- минимальная длина;
- хэширование;
- защита от brute-force.

---

### Remember Me

Тип:

```txt
checkbox
```

Функционал:

- хранение refresh token;
- долгосрочная cookie;
- автологин.

---

# 5.3 Система сессий

Использовать:

- Access Token;
- Refresh Token;
- HttpOnly Cookie.

---

# 5.4 Защита

Обязательно:

- CSRF protection;
- XSS sanitization;
- CSP;
- rate limit;
- anti brute force;
- secure cookies.

---

# 6. Главная концепция редактора

# 6.1 Режим редактирования

В обычном режиме сайт отображается как обычный сайт.

После включения edit mode:

- появляется overlay;
- сайт уменьшается;
- появляются боковые панели;
- появляется edit header;
- включается DOM selection system.

---

# 6.2 Кнопка включения edit mode

Находится в header.

Внешний вид:

- квадратная;
- минималистичная;
- только иконка.

Состояния:

- inactive;
- active;
- loading;
- unsaved.

---

# 6.3 Анимация входа в edit mode

При активации:

- страница плавно уменьшается;
- появляется shadow;
- боковые панели выезжают;
- активируется grid overlay;
- включается selection layer.

---

# 7. Layout редактора

# 7.1 Общая структура

```txt
┌─────────────────────────────────────────┐
│ Edit Header                             │
├─────────────┬──────────────┬────────────┤
│ Left Panel  │   Website    │ RightPanel │
│ Tools       │   Preview    │ DOM Tree   │
│             │              │            │
└─────────────┴──────────────┴────────────┘
```

---

# 8. Верхний edit header

# 8.1 Левая часть

## Название страницы

Редактируемое поле.

Функции:

- название страницы;
- title вкладки;
- SEO title.

---

## Иконка страницы

По нажатию:

- открывается файловый менеджер;
- выбор favicon;
- preview.

Поддержка:

- png;
- jpg;
- svg;
- ico;
- webp.

---

# 8.2 Правая часть

## Кнопка Save

Появляется только если:

- есть изменения.

Состояния:

- hidden;
- active;
- saving;
- success;
- error.

---

## Кнопка структуры сайта

Иконка:

```txt
...
```

Открывает:

- panel;
- site structure manager.

---

# 9. Site Structure Manager

# 9.1 Возможности

## Список страниц

Отображает:

- title;
- slug;
- icon;
- visibility;
- status.

---

## Создание страницы

Параметры:

- название;
- slug;
- template;
- visibility;
- parent page.

---

## Вложенные страницы

Поддержка:

- древовидной структуры;
- nested routes.

---

## Drag-and-drop сортировка

Возможность:

- менять порядок;
- делать вложенность.

---

# 10. Левая панель инструментов

# 10.1 Вкладки

Система вкладок:

- Add;
- Text;
- Layout;
- Style;
- Element;
- Animation;
- Data;
- Code;
- Assets.

---

# 11. Вкладка Add

# 11.1 Добавление элементов

## Text

Элементы:

- p;
- h1-h6;
- span;
- blockquote;
- code;
- pre;
- small.

---

## Containers

Элементы:

- div;
- section;
- article;
- aside;
- main;
- nav.

---

## Media

Элементы:

- img;
- video;
- audio;
- iframe.

---

## Interactive

Элементы:

- button;
- input;
- textarea;
- checkbox;
- switch.

---

## Lists

Элементы:

- ul;
- ol;
- li.

---

## Layout

Элементы:

- grid;
- flex container;
- spacer;
- divider.

---

# 12. Drag-and-drop система

# 12.1 Основная логика

Элемент можно:

- перетаскивать;
- вставлять;
- перемещать;
- копировать;
- дублировать.

---

# 12.2 Drop zones

Подсветка:

- сверху;
- снизу;
- внутрь;
- между элементами.

---

# 13. DOM Tree Panel

# 13.1 Основной функционал

Показывает:

- body;
- hierarchy;
- вложенность.

---

# 13.2 Отображение элемента

Каждый элемент отображает:

- имя;
- tag;
- icon;
- visibility;
- lock state.

Пример:

```txt
Hero Section
DIV
[icon]
```

---

# 13.3 Иконки тегов

У каждого тега:

- визуальная иконка;
- собственный цвет;
- quick type recognition.

Как в:

- Dreamweaver;
- VS Code explorer.

---

# 13.4 Функции DOM tree

## Collapse/Expand

## Drag-and-drop

## Rename

## Duplicate

## Delete

## Lock

## Hide

## Quick jump

## Scroll to element

---

# 14. Selection System

# 14.1 Выделение элементов

Выделение происходит:

- кликом по странице;
- кликом по DOM.

---

# 14.2 Поведение selection

Selection не снимается:

- при пустом клике;
- случайном клике.

Снимается только:

- explicit unselect;
- selection другого элемента.

---

# 14.3 Hover overlay

При наведении:

- outline;
- размеры;
- margins;
- padding.

---

# 14.4 Active selection overlay

Показывает:

- resize handles;
- move handles;
- quick actions.

---

# 15. Text Editor

# 15.1 Форматирование текста

## Inline formatting

- bold;
- italic;
- underline;
- strike;
- code;
- color;
- background.

---

## Alignment

- left;
- center;
- right;
- justify.

---

## Typography

- font family;
- font size;
- font weight;
- line height;
- letter spacing.

---

## Lists

- unordered;
- ordered;
- nested.

---

## Rich blocks

- quotes;
- code blocks;
- callouts;
- notices.

---

# 16. Layout Editor

# 16.1 Flex editor

Настройки:

- direction;
- wrap;
- justify-content;
- align-items;
- gap.

---

# 16.2 Grid editor

Настройки:

- columns;
- rows;
- areas;
- gap;
- alignment.

---

# 16.3 Position editor

Настройки:

- static;
- relative;
- absolute;
- fixed;
- sticky.

---

# 17. Image System

# 17.1 Upload

Поддержка:

- drag-and-drop;
- explorer;
- paste.

---

# 17.2 Image settings

## Размеры

- width;
- height;
- max-width;
- aspect ratio.

---

## Position

- alignment;
- object-fit;
- float;
- z-index.

---

## Обтекание текстом

Важный функционал.

При float:

- система автоматически меняет position элемента в DOM;
- пересчитывает flow текста;
- обновляет container layout.

Иначе обтекание будет ломаться.

---

# 17.3 Advanced image settings

- lazy loading;
- optimization;
- compression;
- alt;
- title;
- responsive sources.

---

# 18. Button System

# 18.1 Типы кнопок

## Hyperlink

## Modal opener

## Page navigation

## API action

## JavaScript action

## Custom script

---

# 18.2 Button editor

Настройки:

- text;
- icon;
- style;
- hover;
- transition;
- action.

---

# 18.3 Script Editor

При выборе custom code:

- открывается popup;
- встроенный Monaco Editor.

---

# 18.4 Monaco Editor

Функции:

- syntax highlighting;
- autocomplete;
- intellisense;
- formatting;
- line numbers;
- minimap;
- themes.

---

# 18.5 Стартовый код

```js
console.log("Hello world")
```

---

# 19. CSS Editor

# 19.1 CSS поле элемента

Каждый элемент имеет:

- custom css field.

---

# 19.2 CSS popup editor

Открывает:

- Monaco Editor.

---

# 19.3 Поведение

По умолчанию:

- вставляется текущий css элемента.

---

# 19.4 CSS scope

CSS должен быть:

- scoped;
- isolated.

Чтобы:

- стили одного элемента;
- не ломали весь сайт.

---

# 20. Animation System

# 20.1 Базовые анимации

- fade;
- slide;
- scale;
- rotate;
- blur.

---

# 20.2 Trigger system

Triggers:

- on load;
- on hover;
- on click;
- on scroll;
- on visible.

---

# 21. Assets Manager

# 21.1 Хранилище файлов

Поддержка:

- images;
- video;
- audio;
- documents.

---

# 21.2 Функции

- upload;
- rename;
- delete;
- folders;
- tags;
- preview.

---

# 22. Undo/Redo System

# 22.1 История изменений

Система должна хранить:

- snapshots;
- operations;
- diff changes.

---

# 22.2 Возможности

- undo;
- redo;
- restore point;
- autosave recovery.

---

# 23. Autosave System

# 23.1 Автосохранение

Интервал:

- каждые 10-30 секунд.

---

# 23.2 Draft system

Хранение:

- unsaved state;
- crash recovery.

---

# 24. Система хранения сайта

# 24.1 Как хранить сайт

НЕ хранить HTML как строку.

Хранить:

- JSON schema;
- component tree.

---

# 24.2 Пример структуры

```json
{
  "id": "root",
  "type": "div",
  "children": [
    {
      "type": "h1",
      "text": "Hello"
    }
  ]
}
```

---

# 25. Renderer Engine

# 25.1 Renderer

Отдельный модуль:

- преобразует JSON;
- в React components.

---

# 25.2 Component registry

Все элементы:

- регистрируются;
- через component registry.

---

# 26. Компонентная система

# 26.1 Components

Каждый элемент:

- независимый component.

---

# 26.2 Структура компонента

```txt
Component/
├── renderer
├── editor
├── toolbar
├── schema
├── styles
└── validators
```

---

# 27. Система шаблонов

# 27.1 Templates

Поддержка:

- page templates;
- section templates;
- reusable blocks.

---

# 27.2 Global components

Пример:

- header;
- footer.

Изменение:

- автоматически обновляет все страницы.

---

# 28. Header/Footer режимы

# 28.1 Dropdown режима редактирования

Режимы:

- page;
- header;
- footer.

---

# 28.2 Поведение

При выборе:

- редактируется отдельная область.

---

# 29. Responsive System

# 29.1 Режимы устройств

- desktop;
- tablet;
- mobile.

---

# 29.2 Device preview

Переключение:

- размеров;
- breakpoints.

---

# 30. Grid Overlay

# 30.1 Layout grid

Функции:

- snapping;
- guides;
- spacing helper.

---

# 31. Performance

# 31.1 Важные требования

- virtualized DOM tree;
- lazy rendering;
- memoization;
- batching updates.

---

# 32. Безопасность пользовательского JS

# 32.1 Sandbox

Custom JS должен:

- выполняться изолированно;
- иметь ограничения.

---

# 32.2 Запрещать

- eval;
- доступ к backend;
- доступ к cookies;
- доступ к local storage.

---

# 33. Database Structure

# 33.1 Основные таблицы

## Users

## Pages

## Components

## Assets

## SiteSettings

## Revisions

## Templates

---

# 34. Revisions System

# 34.1 Версионирование

Каждое сохранение:

- новая ревизия.

---

# 34.2 Возможности

- restore;
- compare;
- rollback.

---

# 35. SEO система

# 35.1 SEO поля

- title;
- description;
- keywords;
- og image.

---

# 36. Routing System

# 36.1 Dynamic routing

Страницы:

- создаются динамически.

---

# 37. Будущие расширения

# 37.1 Возможные модули

- ecommerce;
- forms;
- blog;
- comments;
- analytics;
- plugins.

---

# 38. Архитектура масштабирования

# 38.1 Важно

Сразу проектировать:

- plugin system;
- extension system;
- component registry;
- event system.

---

# 39. Event System

# 39.1 Global events

Система событий:

- element selected;
- element updated;
- page saved;
- asset uploaded.

---

# 40. Визуальный UX

# 40.1 Главная цель

Редактор должен ощущаться:

- как desktop приложение;
- а не сайт.

---

# 41. Технические сложности

# 41.1 Самые сложные части

## DOM synchronization

## Undo/Redo

## Drag-and-drop

## Responsive layout

## Rich text editing

## Custom CSS isolation

## Runtime rendering

## Safe JS execution

---

# 42. Рекомендуемые библиотеки

# 42.1 Frontend

## React DnD

## TipTap

## Monaco Editor

## Zustand

## Framer Motion

## React Query

## React Aria

---

# 43. Этапы разработки

# 43.1 Этап 1

Основа:

- auth;
- API;
- pages;
- renderer.

---

# 43.2 Этап 2

Editor core:

- edit mode;
- DOM tree;
- selection.

---

# 43.3 Этап 3

Rich editor:

- text;
- images;
- layout.

---

# 43.4 Этап 4

Advanced:

- undo/redo;
- revisions;
- responsive.

---

# 43.5 Этап 5

Production:

- optimization;
- security;
- deployment.

---

# 44. Deployment

# 44.1 Backend

- Docker;
- Nginx;
- ASP.NET Core.

---

# 44.2 Frontend

- static hosting;
- CDN.

---

# 45. Git стратегия

# 45.1 Основная идея

После завершения:

- проект становится шаблоном;
- reusable base system.

---

# 45.2 Что хранить отдельно

Разделить:

- engine;
- themes;
- components;
- sites.

---

# 46. Итоговая концепция

Итоговая система должна быть:

- визуальной;
- реактивной;
- расширяемой;
- компонентной;
- масштабируемой;
- пригодной для повторного использования.

Это уже не просто сайт.

Это полноценный:

- visual builder engine;
- inline CMS;
- runtime editor platform.

И архитектура должна проектироваться именно как отдельный движок, а не как обычный веб-сайт.

