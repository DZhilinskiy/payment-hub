# Payment Hub — KZ/UK → BY

Инструмент прогноза стоимости переводов из Казахстана (юрлицо в БЦК) и Великобритании (Airwallex) в Беларусь. Считает все сценарии по всем каналам с разбивкой комиссий и эффективным курсом.

## Локально

Просто откройте `index.html` в браузере — работает как есть. Курсы НБРБ подтянутся напрямую (CORS открыт), курсы НБ РК локально не загрузятся (нужен серверный прокси — он только на Vercel).

## Деплой на Vercel

Node.js локально не требуется. Vercel соберёт сам.

### Через GitHub (рекомендую)

```bash
cd payment-hub
git init
git add .
git commit -m "init"
# Создайте пустой репозиторий на github.com, потом:
git remote add origin git@github.com:USER/payment-hub.git
git push -u origin main
```

Дальше:

1. Зайдите на [vercel.com/new](https://vercel.com/new).
2. Импортируйте репозиторий `payment-hub`.
3. Framework preset — оставьте **Other**.
4. Build command — пусто.
5. Output directory — пусто (root).
6. Deploy.

Vercel сам развернёт статический `index.html` и serverless-функцию `api/rates-kz`.

### Или через drag-and-drop

Заархивируйте папку `payment-hub` в zip и перетащите на [vercel.com/new](https://vercel.com/new) в блок «Deploy from local». Работает так же, но без git-истории.

## Структура

- `index.html` — весь UI и клиентская логика (расчёты, сценарии, сводная таблица).
- `api/rates-kz.js` — Vercel edge-функция, проксирует XML НБ РК и возвращает JSON с CORS.
- `vercel.json` — конфиг.

## Что править

Все курсы, комиссии и параметры каналов редактируются прямо в UI. Значения сохраняются в `localStorage` вашего браузера.

Сценарии зашиты в массив `SCENARIOS` внутри `index.html` — добавить новый маршрут (например RUB через ЕАЭС из БЦК) значит дописать одну запись.

## Источники данных

- НБРБ: `https://api.nbrb.by/exrates/rates?periodicity=0` (публичный API, CORS открыт).
- НБ РК: `https://nationalbank.kz/rss/get_rates.cfm?fdate=DD.MM.YYYY` (XML, CORS закрыт — идёт через `api/rates-kz`).
- Комиссии банков — из вашего `payment_scenarios.html` (по факту 8 мая 2026) плюс редактируемые дефолты.
