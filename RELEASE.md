# Куда зайти и что нажать

Делай строго сверху вниз. После каждого **СТОП** пиши мне в чат, что получилось. Не перескакивай.

Ты работаешь только в браузере. Ноутбук с кодом не нужен.

---

## ШАГ 1. GitHub — аккаунт и пустой репозиторий

1. Открой [https://github.com](https://github.com)
2. Если не залогинен: **Sign in**. Нет аккаунта — **Sign up**, почта, пароль, подтверди письмо.
3. Справа сверху нажми **«+»** → **New repository**.
4. **Repository name:** `subscription-tracker`
5. **Private** (зелёная галка / выбран Private).
6. **Не** ставь галки Add README, .gitignore, license.
7. Нажми зелёную **Create repository**.
8. На белой странице скопируй адрес вида  
   `https://github.com/ТВОЙ_НИК/subscription-tracker`

**СТОП.** Пришли мне в чат эту ссылку.

Дальше я положу код в репозиторий. Для этого нужен ключ:

9. Открой [https://github.com/settings/tokens](https://github.com/settings/tokens)
10. **Generate new token** → **Generate new token (classic)**
11. Note: `tracker-push`
12. Expiration: **30 days**
13. Галка только **repo**
14. **Generate token**
15. Скопируй `ghp_...` сразу — второй раз не покажут.

**СТОП.** Пришли токен в чат одним сообщением со ссылкой на репо. Потом токен можно удалить на той же странице Tokens.

---

## ШАГ 2. Жди меня

Я запушу код. Когда напишу «код на GitHub» — иди на шаг 3.

---

## ШАГ 3. Hetzner — сервер

1. Открой [https://console.hetzner.cloud](https://console.hetzner.cloud)
2. Зайди в аккаунт.
3. Если видишь список проектов — нажми любой, или **+ New project** → имя `tracker` → **Add project**.
4. В проекте нажми **Create Server** / **Add Server** (большая кнопка).

Заполни сверху вниз:

5. **Location:** `Falkenstein` или `Helsinki` (что ближе).
6. **Image:** вкладка **Ubuntu** → **24.04**.
7. **Type:** категория **Shared vCPU** → **CX22** (2 vCPU, 4 GB). Не бери dedicated.
8. **Networking:** IPv4 включён.
9. **SSH keys:** если ключа нет — пропусти. Зайдём через браузер.
10. **Name:** `tracker`
11. Внизу **Create & Buy now**.

Подожди 20–40 секунд, пока статус станет running.

12. Нажми на сервер `tracker`.
13. Скопируй **IPv4** (четыре числа через точки).

**СТОП.** Пришли мне IP. Потом сразу шаг 4.

---

## ШАГ 4. Поставить Coolify (панель, чтобы не ковырять сервер руками)

1. На странице сервера в Hetzner нажми **Console** (терминал в браузере, чёрное окно).
2. Если спросит логин: `root`. Пароль — тот, что Hetzner прислал на почту, или кнопка **Reset root password** на той же странице сервера → новое письмо / показ пароля.
3. В чёрном окне вставь **одной строкой** (правый клик → Paste или Shift+Insert) и Enter:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

4. Жди 3–8 минут. В конце будет что-то вроде `http://ТВОЙ_IP:8000`.
5. Открой в новой вкладке: `http://IP:8000`  
   (подставь свой IP, без https).
6. Создай админа Coolify: имя, почта, пароль. Запиши пароль.
7. Если браузер пишет «небезопасно» — это нормально на IP, жми «дополнительно» → перейти.

**СТОП.** Напиши «Coolify открылся». Если скрипт красный — скопируй текст ошибки.

---

## ШАГ 5. Домен → на этот IP

Если домена нет: купи любой дешёвый (Cloudflare, Porkbun, Namecheap, Hetzner DNS). Потом:

1. Зайди в DNS этого домена (у регистратора кнопка **DNS** / **Manage DNS**).
2. **Add record**
   - Type: **A**
   - Name: `@` (или пусто — это сам домен)
   - Value / IPv4: IP сервера из шага 3
   - Proxy: **DNS only** (серое облако в Cloudflare, не оранжевое)
3. Ещё одна запись, если хочешь `www`:
   - Type: **A**
   - Name: `www`
   - Value: тот же IP
   - Proxy: DNS only

Подожди 10–30 минут.

**СТОП.** Пришли точное имя: `example.com` или `app.example.com`.

---

## ШАГ 6. Resend — почта для входа

1. Открой [https://resend.com](https://resend.com) → **Sign up** / **Log in**.
2. Слева **Domains** → **Add Domain**.
3. Введи свой домен (тот же, что в шаге 5).
4. Resend покажет таблицу DNS (SPF, DKIM…).
5. Для **каждой** строки: у регистратора **Add record**, скопируй Type / Name / Value один в один.
6. Вернись в Resend → **Verify**. Статус должен стать **Verified** (иногда 10–30 мин).
7. Слева **API Keys** → **Create API Key**
   - Permission: **Sending access**
   - **Add**
8. Скопируй ключ `re_...` в блокнот.

**СТОП.** Напиши «домен Verified» и сохрани ключ у себя. Ключ в чат можно не слать, если страшно — вставишь сам в Coolify на шаге 8.

---

## ШАГ 7. Postgres внутри Coolify

1. Coolify (`http://IP:8000`) → слева **Servers** — должен быть localhost / твой сервер. Если мастер просит добавить сервер: **Localhost**, validate.
2. **Projects** → **+ Add** (или Default project).
3. Открой проект → **+ New** → **Database** → **PostgreSQL**.
4. Имя: `tracker-db`
5. **Start** / Deploy и дождись зелёного.
6. Открой базу → вкладка **Credentials** / **Connection**.
7. Скопируй **URL** вида `postgresql://...`  
   Нужен тот, что для приложений на **этом же** сервере (internal / docker).

**СТОП.** Напиши «база зелёная». URL вставишь в шаг 8.

---

## ШАГ 8. Задеплоить сайт

1. Coolify → тот же проект → **+ New** → **Application** → **Public Repository** (или GitHub, если подключил аккаунт).
2. URL репозитория: `https://github.com/ТВОЙ_НИК/subscription-tracker`
   - Если репо **Private**: Coolify → Settings → GitHub App / Source → подключи GitHub и дай доступ к репо. Иначе сделай репо Public на время деплоя (Settings репо → Change visibility).
3. Build Pack: **Nixpacks**
4. Port: **8080**
5. **Continue** / создай приложение.

Потом **Environment Variables** → Add, по одной строке:

| Ключ | Что вписать |
| --- | --- |
| `DATABASE_URL` | URL из шага 7 |
| `AUTH_SECRET` | придумай длинный пароль, 32+ символа |
| `AUTH_URL` | `https://ТВОЙ_ДОМЕН` без слэша в конце |
| `AUTH_RESEND_KEY` | `re_...` из шага 6 |
| `EMAIL_FROM` | `Subscription Tracker <noreply@ТВОЙ_ДОМЕН>` |
| `CRON_SECRET` | ещё один длинный пароль |

6. **Domains** / **Settings**: домен `ТВОЙ_ДОМЕН`, включи HTTPS / Let's Encrypt.
7. **Deploy**. Жди лог. В конце — зелёный.

Открой `https://ТВОЙ_ДОМЕН` — должен быть **лендинг** «See the next charge…».

**СТОП.** Ссылка на живой сайт или текст ошибки деплоя.

---

## ШАГ 9. Таблицы в базе

1. Coolify → приложение → **Terminal** / **Execute Command** (или один раз **Console**).
2. Запусти:

```bash
npm run db:push
```

3. Если спросит подтверждение — yes.

**СТОП.** «push ok» или ошибка целиком.

---

## ШАГ 10. Проверка входа

1. Открой сайт → **Get started**.
2. Свою почту → **Email me a link**.
3. Почта (и Спам) → ссылка → должен открыться **пустой трекер**, не лендинг.
4. **Add subscription** → сохрани → обнови страницу — строка на месте.

**СТОП.** Получилось / не пришло письмо / пустая страница / ошибка.

---

## ШАГ 11. Напоминания раз в час

1. Coolify → приложение → **Scheduled Tasks** / **Cron Jobs** (название может быть Cron).
2. **Add**
   - Schedule: `0 * * * *` (каждый час)
   - Command:

```bash
curl -fsS -H "Authorization: Bearer СЮДА_CRON_SECRET" https://ТВОЙ_ДОМЕН/api/cron/reminders
```

Подставь тот же `CRON_SECRET`, что в шаге 8.

3. Сохрани.

Это уже релиз. Дальше — бэкап базы в Coolify (Backups) и всё.

---

## Если застрял

Пиши мне одной фразой, на каком номере шага, и что видишь (скрин или текст). Не иди дальше красной ошибки.
