# Архітектура ZINGO

## High Level
Плагін MV3 → Content Script інжектить UI → Підписка на DOM / Speech → IndexedDB кеш → API бекенд → Генератор карток → UI бінго
Аналітика: кожна подія → бекенд → графіки

## Компоненти

### Background Service Worker
- Lifecycle плагіна
- Оновлення бази фраз
- Керування дозволами

### Content Script
- Виявляє сторінку чат-рулетки
- Створює Shadow Root зі UI
- Парсить чат повідомлення
- Запускає Speech API при бажанні

### Offscreen Document
- Для Web Speech API на Chrome MV3
- Обробка аудіо без popup

### Popup / Options
- Створення/вибір картки
- Налаштування детекту
- Експорт/імпорт

## Потоки даних

1. Ініціалізація: завантаження фраз і карток з IndexedDB
2. Генерація: алгоритм вагового вибору → створення BingoCard
3. Детект: DOM Mutation або Speech Transcript → fuzzy match → toast підтвердження
4. Відмітка: user клікає або підтверджує → оновити GameSession → перевірити bingo line

## Безпека та Аналітика
- Відправляємо анонімну аналітику: фраз hit, категорія, платформа, час
- Не відправляємо персональні дані, текст чату
- anon_hash = sha256(userAgent + installId) — не зв'язується з реальною особою
- Rate limit 100 req/min на anon_hash
- Cloudflare WAF + DDoS protection
- Весь контент кешується локально
- Content Security Policy сумісний

## Масштабування
Бекенд з першого дня для аналітики, графіків популярності та лідербордів.
