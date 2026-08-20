# Локальный Postgres

Чтобы тестировать трекер с настоящей базой, а не только лендинг. Прод (`tracker-db` в Coolify) с этой машины не трогаем.

На этой Windows-машине стоит **портативный PostgreSQL 18.6** (как major на проде: `postgres:18-alpine`). Инсталлятор через winget потребовал права администратора, поэтому сервер лежит в профиле пользователя, без Windows Service.

| | |
| --- | --- |
| Бинарники | `%USERPROFILE%\pgsql` → `C:\Users\veran\pgsql` |
| Данные | `%USERPROFILE%\pgsql\data` |
| Лог | `%USERPROFILE%\pgsql\postgres.log` |
| Слушает | `127.0.0.1:5432` (без SSL) |
| Пользователь | `postgres` |
| База | `subscription_tracker` |
| Пароль | в `.env` → `DATABASE_URL` (файл не в git) |

После ребута Postgres **не** поднимается сам. Сначала `npm run db:up`.

## Каждый раз, когда тестируешь локально

```powershell
npm run db:up
npm run dev
```

Приложение: [http://localhost:8080](http://localhost:8080)

Остановить базу: `npm run db:down`.

## Переменные в `.env`

Скопируй `.env.example` → `.env`, если файла ещё нет. Нужное для локали:

| Имя | Локальное значение |
| --- | --- |
| `AUTH_SECRET` | любой длинный секрет (`npx auth secret`) |
| `AUTH_URL` | `http://localhost:8080` (порт как у `npm run dev`, не 3000) |
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@127.0.0.1:5432/subscription_tracker` — **без** `sslmode=require` |
| `AUTH_RESEND_KEY` | ключ Resend из Coolify, иначе magic link не уйдёт |
| `EMAIL_FROM` | тот же, что на проде, например `Subscription Tracker <noreply@vera-automation.online>` |
| `CRON_SECRET` | любой строкой, если гоняешь `/api/cron/reminders` |

Без `DATABASE_URL` приложение считает, что БД нет: сессия JWT, трекер пустой. Заглушка вида `postgresql://USER:PASSWORD@HOST/DB` — уже «как будто URL есть», запросы падают. Либо реальный адрес, либо пусто.

`DATABASE_URL` не должен указывать на Coolify `tracker-db`.

## Схема

Таблицы уже накатили (`user`, `account`, `session`, `verification_token`, `subscription`, `notification`). После изменения `src/server/db/schema.ts`:

```powershell
npm run db:up
npm run db:push
```

Посмотреть данные: `npm run db:studio`.

## Логин локально

Auth — только magic link через Resend. Postgres сам сессию не создаёт.

1. В Coolify скопируй `AUTH_RESEND_KEY` в локальный `.env`.
2. `AUTH_URL` оставь `http://localhost:8080`.
3. Перезапусти `npm run dev`.
4. Get started → своя почта. Ссылка из письма откроет localhost, не прод.

Пока ключ пустой, форма напишет «Magic link is not configured yet».

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run db:up` | Старт `%USERPROFILE%\pgsql` на `127.0.0.1:5432` |
| `npm run db:down` | Стоп |
| `npm run db:push` | Drizzle: схема → база |
| `npm run db:studio` | UI таблиц |
| `npm run dev` | Next на `0.0.0.0:8080` |

Скрипты старта/стопа: `dev/pg-start.ps1`, `dev/pg-stop.ps1`.

## Если базы ещё нет (другой ПК)

Нужны Docker **или** права администратора **или** те же портативные бинарники.

### Портативный Postgres 18 (как здесь)

1. Скачать [postgresql-18.6.0-x86_64-pc-windows-msvc.tar.gz](https://github.com/theseus-rs/postgresql-binaries/releases/download/18.6.0/postgresql-18.6.0-x86_64-pc-windows-msvc.tar.gz)
2. Распаковать в `%USERPROFILE%\pgsql` (внутри сразу `bin\`, `share\`, …)
3. Инициализация:

```powershell
$pg = "$env:USERPROFILE\pgsql"
Set-Content "$env:TEMP\pg-pw.txt" "ВЫБЕРИ_ПАРОЛЬ" -NoNewline -Encoding ascii
& "$pg\bin\initdb.exe" -D "$pg\data" -U postgres -A scram-sha-256 --pwfile="$env:TEMP\pg-pw.txt" --encoding=UTF8 --no-locale
Remove-Item "$env:TEMP\pg-pw.txt" -Force
```

4. В `%USERPROFILE%\pgsql\data\postgresql.conf` выставить `listen_addresses = '127.0.0.1'` и `port = 5432`
5. `npm run db:up`
6. Создать базу (пароль тот же):

```powershell
$env:PGPASSWORD = "ВЫБЕРИ_ПАРОЛЬ"
& "$env:USERPROFILE\pgsql\bin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres subscription_tracker
```

7. Прописать `DATABASE_URL` в `.env`, затем `npm run db:push`

### winget (нужен админ / UAC)

```powershell
winget install --id PostgreSQL.PostgreSQL.18 -e --accept-package-agreements --accept-source-agreements
```

Инсталлятор спросит пароль пользователя `postgres`. Порт 5432. Дальше `createdb` и тот же `DATABASE_URL`. Скрипты `npm run db:up` / `db:down` заточены под портативный путь `%USERPROFILE%\pgsql` — для установки в `C:\Program Files\PostgreSQL\18` стартуй службу PostgreSQL из Services.

### Docker (если появится Docker Desktop)

```yaml
# docker-compose.yml — не держи одновременно с портативным сервером на 5432
services:
  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: subscription_tracker
    ports:
      - "5432:5432"
```

Тогда `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/subscription_tracker`.

## Проверка, что база жива

```powershell
& "$env:USERPROFILE\pgsql\bin\pg_isready.exe" -h 127.0.0.1 -p 5432
```

Должно быть `accepting connections`. Если нет — `npm run db:up`, лог `%USERPROFILE%\pgsql\postgres.log`.

```powershell
$env:PGPASSWORD = "пароль_из_DATABASE_URL"
& "$env:USERPROFILE\pgsql\bin\psql.exe" -h 127.0.0.1 -p 5432 -U postgres -d subscription_tracker -c "\dt"
```

Ожидаемые таблицы: `user`, `account`, `session`, `verification_token`, `subscription`, `notification`.

## Если localhost показывает Build Error про `lightningcss`

`node_modules` ставили в Linux-окружении, а Windows-бинарник Tailwind не подтянулся. Сообщение вида `Cannot find module '../lightningcss.win32-x64-msvc.node'`.

```powershell
npm install lightningcss-win32-x64-msvc@1.32.0 @tailwindcss/oxide-win32-x64-msvc@4.3.3 --no-save
```

Потом перезапусти `npm run dev`. Не коммить эти пакеты в `package.json`.
