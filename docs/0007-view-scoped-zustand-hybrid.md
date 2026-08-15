# ADR 0007 — View-scoped Zustand hybrid for UI state

**Date:** 2026-07-25  
**Status:** Accepted  
**Provenance:** Ported from Finance Launcher ADR 0005 (same decision text; Doc Hub numbering).

## Context

Desktop / SPA shells often accumulate a root component that owns every domain hook and fans out large prop bags (`value` + `setValue` pairs) into feature views. That makes views hard to split, App hard to read, and cross-product copy-paste painful.

We need a **portable** rule for where ephemeral view UI state lives versus domain / server state — without a global god-store.

Doc Hub today has many **module-level** Zustand stores under `src/stores/`. Those are fine for true app-wide chrome (navigation, workspace pin, toasts). They are **not** the pattern for view filters / selection that should reset on leave. New heavy views migrate toward this ADR; legacy singletons move only when a view is being split.

## Decision

Use a **hybrid**:

1. **View UI / filters** — view-scoped **Zustand** store created with a **factory** (`createXStore()`), held in a React **Provider** for the lifetime of the mounted view. Consumers use **selectors** (`useStore(store, selector)`), not whole-store subscriptions.
2. **Domain data** (SQLite / API / Tauri `invoke` / MCP results) — stays in a **React hook** colocated under the same Provider tree (or passed in as shared deps). Domain SoT is **not** mirrored into Zustand as a second cache.
3. **Shared cross-view deps** (i18n, workspace id, stack profile, account-less chrome lists) — thin props or existing app stores (`src/stores/app/…`); **not** stuffed into each view store.
4. **Truly local ephemeral UI** (one-shot sheet open, export toast, single-input draft used only in one component) — plain `useState` is fine; do not force every bit into Zustand.

### Canonical shape

```text
App ──thin shared deps──► ViewRoot
                            ├─ XStoreProvider  (createXStore once per mount)
                            ├─ useXDomain(...)  (reads filters from store)
                            └─ children ──useXUi(selector)──► store
```

### Put in the view Zustand store

| Yes | No |
| --- | --- |
| Filters, period presets, tabs shared by siblings | Server / DB rows as source of truth |
| Selection needed by several children of one view | Cross-view shared domain lists (unless you later add a dedicated shared store) |
| State that should reset on unmount | Secrets, workspace pin, navigation as accidental global singleton |

### Anti-patterns

- Singleton module-level `create(...)` for **view** UI that survives navigation and leaks filters across sessions.
- Replacing every domain hook with Zustand while still calling the backend from random components (double SoT).
- Passing `value` + `setValue` pairs through App after the store exists.

## Consequences

### Positive

- App wiring shrinks to shared deps + commands.
- Views can split into children without prop drilling.
- Pattern copies cleanly across products (Finance already ships it; Doc Hub adopts the same template).

### Negative / risks

- Contributors must learn the UI-vs-domain boundary; misuse as a global cache recreates the problem.
- Filters reset when leaving the view (usually desired; persist explicitly if not).
- Gradual migration: do not rewrite every `src/stores/*` singleton in one PR.

### Reference implementation

External (canonical first ship) — Finance Launcher **Reports** view:

- `~/finance/src/views/Reports/reportsUiStore.ts` — factory
- `~/finance/src/views/Reports/ReportsStoreContext.tsx` — Provider + `useReportsUi`
- `~/finance/src/views/Reports/ReportsView.tsx` — colocated domain hook + thin App props

Doc Hub first in-repo target (when splitting): Task Board / Epics — prefer colocating `*UiStore` + Provider under `src/components/tasks/` rather than growing `src/stores/taskStore.ts`.

### Follow-ups

- Apply the same template when splitting heavy screens (Task Board, Epics, Doc Browser, Wire Trace).
- Do **not** migrate app chrome stores (`navigationSlice`, workspace pin, notify/celebrate) wholesale — those are cross-view by design.
- Pair with [frontend-code-style.md](../frontend-code-style.md) when creating new component folders.

## Related

- [frontend-code-style.md](../frontend-code-style.md) — folder / SCSS / BEM / Prettier canon
- [screens.md](../screens.md) — screen catalog
- [layout.md](../layout.md) — `src/` tree
