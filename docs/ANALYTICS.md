# Аналітика

## Що збираємо
- phrase hit: phraseId, category, platform, ts
- card generated, card completed
- bingo line detected
- speech confirm yes/no
- Без персональних даних, без тексту чату

## Метрики
- Топ фраз за день/тиждень/місяць
- Популярні категорії
- Платформа розподіл
- Час доби піки
- Середній час до bingo

## Візуалізація
Лендінг з графіками:
- Bar chart топ 20 фраз
- Line chart тренди
- Pie chart категорії
- Heatmap час доби

## Зберігання
Postgres:
- events таблица з колонками: id, phrase_id, category, platform, ts, anon_hash
- daily_agg агрегація

## API
POST /api/events
GET /api/analytics/top?period=week
GET /api/analytics/trends?period=month
GET /api/analytics/categories

## Приватність
anon_hash = sha256(userAgent + installId)
Не зв'язуємо з реальною особою
Opt-out в налаштуваннях плагіна
Опціональний акаунт: nickname + password (bcrypt), email для відновлення — дає вищі ліміти та історію
