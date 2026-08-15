# Frontend code style

Канон фронтенд-стилю для **Doc Hub** (Tauri + React + TypeScript).

**Джерело:** Finance Launcher `~/finance/Docs/frontend-code-style.md` ← `searates-apps/apps/ai-assistant` (+ shared `@searates/prettier`).  
**Стан:** прийнято як цільовий DX; інтеграція **поступова** (див. §9).  
**Поруч:** [ADR 0007](ADR/0007-view-scoped-zustand-hybrid.md) — view-scoped Zustand для UI state.

**Мета:** той самий DX, що у Finance / ai-assistant — папки-компоненти, SCSS modules, BEM, `classnames/bind`, Prettier.

---

## 0. Поточний стан Doc Hub (базовий)

| Зараз | Ціль (цей документ) |
| ----- | ------------------- |
| Tailwind utility classes у JSX | SCSS modules + BEM + `classnames/bind` |
| Feature-папки під `src/components/<area>/` (часто плоскі файли) | Одна папка = один компонент + `index.ts` + `*.module.scss` |
| Багато module-level Zustand у `src/stores/` | View UI → ADR 0007 factory + Provider; chrome stores лишаються |
| Немає `prettier.config.cjs` / `classnames` / sass у залежностях | ~~Додати при першому міграційному PR~~ → зроблено (tooling) |

**Правило інтеграції:** новий або суттєво розбитий UI пишемо вже під цей канон. Старий Tailwind-код не переписуємо «за компанію» — лише коли чіпаємо той самий компонент.

---

## 1. Prettier

| Option            | Value                    |
| ----------------- | ------------------------ |
| `semi`            | `true`                   |
| `tabWidth`        | `2`                      |
| `useTabs`         | `false`                  |
| `singleQuote`     | `false` (подвійні лапки) |
| `trailingComma`   | `"es5"`                  |
| `printWidth`      | `120`                    |
| `bracketSpacing`  | `true`                   |
| `bracketSameLine` | `false`                  |
| `arrowParens`     | `"always"`               |
| `endOfLine`       | `"lf"`                   |

Конфіг у репо (після §9): `prettier.config.cjs` — локальна копія правил Searates/Finance, без workspace-пакету.

---

## 2. Структура компонента

Один компонент = **одна папка**:

```text
components/
  ui/
    Card/
      Card.tsx
      Card.module.scss
      index.ts          # export * from "./Card"
  layout/
    Sidebar/
      Sidebar.tsx
      Sidebar.module.scss
      index.ts
  tasks/
    board/
      TaskBoard/
        TaskBoard.tsx
        TaskBoard.module.scss
        taskBoardUiStore.ts   # ADR 0007 factory (якщо треба)
        TaskBoardStoreContext.tsx
        index.ts
```

Опційно поруч: `*.types.ts`, `*.utils.ts`, `hooks/`.

Імпорт ззовні — через barrel `index.ts`:

```ts
import { Card } from "components/ui/Card";
```

Екрани з [screens.md](screens.md) лишаються під `src/components/<area>/` (історичний layout Doc Hub); нові атоми UI — під `components/ui/` (lowercase, як існуюча папка).

---

## 3. TypeScript / React

- Функціональні компоненти; тип `FC<Props>` або явний return `React.ReactElement`.
- Named export компонента: `export { Button };` (не лише `export default`).
- Props-тип поруч у файлі або в `*.types.ts`.
- `classnames` + bind (див. §5), не самописний `cx`, якщо немає вагомої причини.
- View UI state — [ADR 0007](ADR/0007-view-scoped-zustand-hybrid.md), не новий singleton у `src/stores/`.

---

## 4. SCSS architecture

### Глобальні стилі

```text
src/styles/                 # або src/assets/styles/
  index.scss                # entry: reset + tokens + base
  abstracts/
    _variables.scss         # кольори, шрифти, radii, shadows
    _mixins.scss            # media, reset-list, center, …
  base/
    _reset.scss
```

Підключення один раз у `main.tsx`:

```ts
import "./styles/index.scss";
```

Поки Tailwind живе поруч: не дублювати токени в двох місцях — нові модулі беруть змінні лише з `styles/abstracts`. Legacy Tailwind класи в немігрованих файлах дозволені до їхнього PR.

### CSS Modules

- Файл: `ComponentName.module.scss` поруч з `ComponentName.tsx`.
- Кореневий клас = **PascalCase ім’я компонента**: `.Button`, `.TaskBoard`, `.Sidebar`.
- Елементи — **BEM** через `&__`:

```scss
.TaskBoard {
  padding: 24px 0;

  &__column {
    display: flex;
    gap: 16px;

    &-title {
      max-width: 694px;
    }

    &.active {
      background: $surface-raised;
    }
  }
}
```

- Модифікатори — вкладені класи / flags: `&.primary`, `&.disabled`, `&.s`.
- Змінні/міксини з abstracts:

```scss
@use "styles/abstracts/variables" as v;
@use "styles/abstracts/mixins" as m;

.Button {
  font-family: v.$primary-font;

  &.primary {
    background: v.$accent;
  }
}
```

- `:global { … }` — лише для сторонніх/немодульних класів усередині модуля.
- Адаптив — через міксини breakpoints, не розкидані magic numbers без коментаря.

### Що не робити

- Не тримати весь новий UI в одному `index.css` / одному `ui.module.scss` «на всіх».
- Не використовувати camelCase root (`styles.navItem`) як основний стиль — root PascalCase + BEM string keys через `cn(...)`.
- Не дублювати theme tokens у кожному модулі — тільки abstracts.
- Не змішувати Tailwind utilities і BEM module keys в одному новому компоненті без явної причини (prefer module-only для мігрованих).

---

## 5. classnames / bind

```tsx
import classNames from "classnames/bind";
import scss from "./Button.module.scss";

const cn = classNames.bind(scss);

// root + modifiers
cn("Button", type, size, { disabled });

// BEM element
cn("TaskBoard__column", role);
cn("TaskBoard__column-title");
```

Ключі в `cn("…")` — **рядки як у SCSS** (`"Button"`, `"TaskBoard__column"`), не `scss.Button` / `styles.card`.

Зовнішній `className` з props:

```tsx
className={cn("Button", type, size, { disabled }, className)}
```

---

## 6. Імпорти

Порядок (simple-import-sort / вручну):

1. React / зовнішні пакети
2. Внутрішні абсолютні аліаси (`components/…`, `hooks/…`, `styles/…`)
3. Відносні (`./`, `../`)
4. Стилі модуля (`./X.module.scss`) — зазвичай останнім серед локальних

Цільові path aliases (після міграції tsconfig):

| Alias          | Path               |
| -------------- | ------------------ |
| `components/*` | `src/components/*` |
| `styles/*`     | `src/styles/*`     |
| `hooks/*`      | `src/hooks/*`      |
| `stores/*`     | `src/stores/*`     |

Поки аліасів немає — відносні імпорти; після першого tooling PR: Vite `resolve.alias` + `tsconfig.paths`.

---

## 7. Файли / іменування

| Що                | Як                                         |
| ----------------- | ------------------------------------------ |
| Компонент / папка | `PascalCase`                               |
| Хуки              | `useSomething.ts` / `useSomething.hook.ts` |
| Утиліти           | `camelCase.ts`                             |
| Константи         | `SCREAMING_SNAKE` або `camelCase` об’єкт   |
| SCSS partials     | `_name.scss`                               |
| CSS module        | `Name.module.scss`                         |
| View UI store     | `xUiStore.ts` + `XStoreContext.tsx` (ADR 0007) |

---

## 8. Відхилення для Doc Hub (свідомі)

Finance / ai-assistant мають свої design tokens. У Doc Hub:

- **Токени свої** (існуюча dark chrome палітра з Tailwind theme / майбутні `styles/abstracts`) — не копіювати Searates `$purple` / Montserrat і не копіювати Finance Fraunces.
- **Немає** `@searates/*` workspace-пакетів — Prettier/ESLint локальні файли з тими ж правилами.
- **Tauri** — цей канон лише TS/React/SCSS; Rust / Python MCP без змін.
- **Tailwind** лишається для немігрованих екранів до їхнього PR; ціль — SCSS modules, не «Tailwind forever».
- **App chrome stores** (`src/stores/app/…`, notify, celebrate) — виняток з ADR 0007 anti-singleton; view filters — ні.

---

## 9. Чекліст міграції (Doc Hub)

- [x] Додати `prettier` + `prettier.config.cjs`, `classnames`, `sass` (`npm run format`).
- [x] Завести `src/styles/abstracts` + `styles/base` + `styles/index.scss` (токени з Tailwind theme / `--dh-*`).
- [x] Path aliases у Vite + tsconfig (`components`, `styles`, `hooks`, `stores`).
- [x] Перший пілотний компонент під канон: `src/components/ui/Card` (+ consumer `SettingsUpdateCard`).
- [x] Перший ADR 0007 view store: Task Board filters (`taskBoardUiStore` + `TaskBoardStoreProvider`).
- [ ] Наступні важкі view splits — ADR 0007 Provider + цей folder layout.
- [ ] Не чіпати Tailwind у чужих екранах у тому ж PR.

---

## 10. Приклад цільового вигляду

```tsx
// components/ui/Card/Card.tsx
import { FC, ReactNode } from "react";
import classNames from "classnames/bind";
import scss from "./Card.module.scss";

const cn = classNames.bind(scss);

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

const Card: FC<CardProps> = ({ title, children, className }) => (
  <section className={cn("Card", className)}>
    {title ? <h2 className={cn("Card__title")}>{title}</h2> : null}
    <div className={cn("Card__body")}>{children}</div>
  </section>
);

export { Card };
```

```scss
// Card.module.scss
@use "styles/abstracts/variables" as v;

.Card {
  background: v.$surface-raised;
  border: 1px solid v.$line;
  border-radius: v.$radius-card;
  padding: 1.5rem;

  &__title {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: v.$ink;
  }

  &__body {
    display: grid;
    gap: 0.75rem;
  }
}
```
