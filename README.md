# HireMind

**HireMind** - прототип платформы для заказчиков, фрилансеров и администраторов, где основной упор сделан на прояснении задачи до старта работы. В текущем репозитории уже есть рабочий backend API, React-фронтенд, админская панель, AI-сценарии для брифа, Docker-конфигурация и тесты.

## Статус

Активная MVP-разработка. Это уже не просто продуктовая идея: в коде реализованы регистрация, авторизация, восстановление пароля, профиль, каталог фрилансеров, заказы, отклики, AI-помощник, контактные запросы, Telegram-интеграция и админский контур.

## Что решает HireMind

Большая часть проблем во фрилансе начинается до начала работы:

- заказчик описывает задачу слишком общо
- scope и критерии "готово" не зафиксированы
- ожидания по бюджету, срокам и результату расходятся
- фрилансер соглашается на работу без достаточного контекста

HireMind пытается убрать эту размытость заранее:

- сохраняет сырой запрос клиента
- помогает превратить его в структурированный бриф
- фиксирует уточняющие вопросы, границы scope, done criteria и риски
- дает обеим сторонам единое рабочее пространство по заказу
- поддерживает жизненный цикл заказа от публикации до оценки результата

## Основная идея

В центре проекта не просто "карточка заказа", а рабочая спецификация проекта.

Сейчас заказ хранит и обслуживает:

- `rawDescription` и `technicalSpecification`
- структурированные секции брифа: цель, аудитория, экраны, функции, контент, дизайн, ограничения, открытые вопросы
- список уточняющих вопросов
- scope items с корзинами `included`, `excluded`, `later`
- done criteria
- список рисков
- `readinessScore`
- workflow stages: `raw`, `clarification`, `brief`, `review`, `approved`
- order statuses: `Draft`, `Published`, `Paused`, `In_Progress`, `Completed`, `Cancelled`, `Archived`

AI-модуль умеет:

- генерировать структурированный бриф из сырого описания
- возвращать вопросы, scope items, done criteria и риски
- отвечать в режиме project assistant внутри заказа

## Роли и сценарии

### Заказчик

- регистрируется и подтверждает email
- создает заказ вручную или через AI-генерацию брифа
- публикует заказ и получает отклики
- выбирает исполнителя
- подтверждает или отклоняет завершение
- оценивает фрилансера после выполнения

### Фрилансер

- регистрируется как `Freelancer`
- заполняет профиль, навыки, ставку и контакты
- просматривает заказы
- отправляет proposal на интересующий заказ
- отвечает на clarifying questions
- подтверждает согласование и отправляет заказ на завершение

### Администратор

- просматривает пользователей и заказы
- редактирует пользователей и заказы
- может повысить пользователя до администратора
- может забанить или удалить пользователя
- может удалить заказ
- может запустить смену email пользователя через подтверждающий код

## Что уже реализовано в репозитории

- cookie-based JWT-аутентификация с ролями `Client`, `Freelancer`, `Admin`
- регистрация, логин, `me`, logout, подтверждение email, восстановление пароля
- профиль пользователя с контактами, навыками, ставкой, валютой, рейтингом и completed orders
- генерация Telegram connect-link для профиля
- публичный список заказов и детальная страница заказа
- создание, обновление и удаление заказа клиентом
- отклики фрилансеров, выбор исполнителя, withdraw proposal
- client/freelancer approvals, completion flow и рейтинг по заказу
- AI brief generation и project assistant
- каталог фрилансеров и contact requests
- админская страница для управления пользователями и заказами
- homepage counters для количества пользователей и проектов по категориям

## Scope текущего MVP

Текущий код покрывает:

- frontend SPA с основными страницами `/`, `/sign-up`, `/sign-in`, `/profile`, `/projects`, `/projects/new`, `/projects/:projectId`, `/freelancers`, `/admin`
- backend API с префиксом `/api/v1`
- PostgreSQL persistence через Entity Framework Core
- unit и integration tests для backend
- unit tests и e2e tests для frontend
- контейнерный запуск через Docker Compose

## Что пока не входит в текущий репозиторий, но планируется в дальнеишем развитии

В кодовой базе пока не реализованы как полноценные рабочие подсистемы:

- Встроенный чат
- загрузка файлов и объектное хранилище
- Логгирование
- production-ready CI/CD и observability

## Архитектура проекта

### Архитектурный стиль

Проект построен как `client-server` система с `SPA`-клиентом и единым backend-приложением. По сути это модульный монолит: все бизнес-сценарии живут в одном ASP.NET Core приложении и одной PostgreSQL базе, но внутри разделены по предметным зонам: авторизация, профиль, заказы, фрилансеры, AI-ассистент, Telegram и админский контур.

Это не микросервисная архитектура и не строгая Clean Architecture с отдельными assembly для `Domain` и `Application`. Здесь используется практичная слоистая модель: HTTP-слой, слой сценариев приложения, слой доступа к данным и слой внешних интеграций.

### Основная архитектурная идея

Центр системы - не просто "заказ", а рабочая спецификация проекта, которая постепенно уточняется по мере прохождения жизненного цикла.

Система строится вокруг одного основного потока:

- клиент создает заказ из сырого описания
- AI помогает превратить его в структурированный бриф
- фрилансер уточняет детали и отправляет предложение
- заказчик выбирает исполнителя и запускает рабочую фазу
- обе стороны проходят согласование, завершение и итоговую оценку

Из-за этого архитектура ориентирована не на набор независимых CRUD-таблиц, а на один связанный workflow вокруг `Order`, `Proposal`, `Brief`, `ClarificationQuestions`, `ScopeItems`, `DoneCriteria`, `Risks` и `Rating`.

### Backend как слоистый монолит

Backend организован вокруг нескольких уровней ответственности:

- транспортный слой принимает HTTP-запросы, проверяет авторизацию и преобразует входные данные в use case
- сервисный слой реализует бизнес-операции: регистрация, публикация заказа, выбор фрилансера, completion flow, email change, contact requests, AI-генерация
- слой данных хранит агрегаты и связи через Entity Framework Core и PostgreSQL
- интеграционный слой общается с внешними системами: SMTP, Telegram Bot API и Groq-compatible AI API

Важная особенность: контроллеры здесь тонкие, а основная логика находится в сервисах. При этом сервисы работают с `AppDbContext` напрямую, без отдельного repository-слоя. То есть по стилю это именно pragmatic layered architecture, а не DDD/CQRS стек.

### Модель взаимодействия клиента и сервера

Frontend работает как stateful SPA, а backend остается единственным источником истины для бизнес-данных и правил.

Ключевые принципы обмена такие:

- все пользовательские действия идут через REST API с префиксом `/api/v1`
- после логина backend выдает JWT, который хранится в `HttpOnly` cookie
- последующие запросы автоматически идут с cookie, а backend извлекает токен из cookie в JWT middleware
- роли `Client`, `Freelancer`, `Admin` ограничивают доступ к сценариям через `[Authorize]`
- ошибки нормализуются на backend через `ProblemDetails`, а frontend старается показывать именно сообщение сервера, а не скрывать его общим fallback

### Frontend как feature-oriented SPA

Frontend - это единое React-приложение, собранное вокруг пользовательских сценариев, а не вокруг низкоуровневых API вызовов.

Его архитектурная роль:

- держать клиентскую навигацию, route guards и состояние текущего пользователя
- собирать пользовательские действия в понятные сценарии: sign-in, sign-up, profile update, order workspace, admin actions
- централизованно вызывать backend через общий API wrapper
- отображать backend-состояние почти без дублирования бизнес-правил на клиенте

Иными словами, frontend отвечает за UX и оркестрацию взаимодействия, а не за хранение собственной независимой бизнес-модели.

### Интеграционные контуры

Помимо основного CRUD и workflow, в архитектуру встроены три внешних контура:

- `Email` для подтверждения регистрации, восстановления пароля и административных уведомлений
- `Telegram` для привязки аккаунта и отправки уведомлений пользователю
- `AI` для генерации брифа и режима project assistant внутри заказа

Эти интеграции подключаются как инфраструктурные зависимости. Если AI или Telegram не настроены, backend не меняет основную предметную модель, а переключается на безопасные fallback-реализации.

### Развертывание

В контейнерном режиме архитектура остается той же, но появляется отдельный edge-слой:

- `Nginx` раздает собранный SPA frontend
- он же проксирует `/api/v1/*` в backend
- backend обслуживает API, авторизацию и интеграции
- PostgreSQL хранит все прикладные данные

Таким образом, если назвать архитектуру коротко, то это:

- `трехзвенная client-server архитектура`
- `SPA + REST API + PostgreSQL`
- `модульный слоистый монолит на backend`
- `feature-oriented frontend`

## Технологический стек

### Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- Npgsql / PostgreSQL
- MailKit
- Telegram.Bot
- Swagger / Swashbuckle

### Frontend

- React 19
- TypeScript
- React Router 7
- Vite 8
- Vitest
- Playwright
- ESLint

### Infrastructure

- Docker
- Docker Compose
- Nginx
- PostgreSQL 18

### AI

- Groq-compatible OpenAI API endpoint
- переменные `GROQ_API_KEY`, `GROQ_BASE_URL`, `GROQ_MODEL`

## Структура репозитория

```text
.
├── backend/         # ASP.NET Core API
├── backend.Tests/   # backend tests
├── frontend/        # React SPA
├── compose.yaml     # docker stack
├── Dockerfile       # backend image
└── README.md
```

## Требования

Для локальной работы с проектом понадобятся:

- .NET 10 SDK
- Node.js 22+ и `npm`
- Docker и Docker Compose
- PostgreSQL 18 или совместимая локальная инсталляция PostgreSQL
- доверенные локальные HTTPS-сертификаты для сценариев с `dotnet run`, Vite dev server или Docker HTTPS

## Локальный запуск проекта

1. Создайте `.env` на основе корневого `.env.example`.
2. Заполните минимум:
   `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT__SECRET`, `JWT__COOKIE_NAME`, `HTTP_CERT_PASSWORD`.
3. Убедитесь, что сертификаты существуют по путям, которые ожидает `compose.yaml`:
   - `/mnt/c/dev-certs/hiremind.pfx`
   - `/mnt/c/dev-certs/frontend.crt`
   - `/mnt/c/dev-certs/frontend.key`
4. При необходимости добавьте SMTP, Groq и Telegram переменные.
5. Запустите:

```bash
docker compose up --build
```

После старта:

- frontend будет доступен на `https://localhost`
- backend будет доступен на `https://localhost:8443` и `http://localhost:8080`
- PostgreSQL наружу не опубликован, он доступен только внутри compose-сети

Важно:

- backend-контейнер запускается в `Production`, поэтому Swagger в Docker по умолчанию не поднимается
- без сертификатов из пунктов выше compose-стек не соберется в текущем виде

## Переменные окружения

### Корневой `.env`

Основные группы переменных:

- БД: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- JWT: `JWT__ISSUER`, `JWT__AUDIENCE`, `JWT__SECRET`, `JWT__ACCESS_TOKEN_EXPIRATION_MINUTES`, `JWT__COOKIE_NAME`, `JWT__COOKIE_SECURE`, `JWT__COOKIE_SAME_SITE`
- Email: `Email__Username`, `Email__Password`, `Email__FromName`, `Email__From`, `Email__SmtpHost`, `Email__SmtpPort`
- Telegram: `Telegram__BotToken`, `Telegram__Bot_Username`
- AI: `GROQ_API_KEY`, `GROQ_BASE_URL`, `GROQ_MODEL`
- Docker HTTPS: `HTTP_CERT_PASSWORD`

Примечания:

- без SMTP-переменных backend запустится, но email-ориентированные сценарии не смогут отправлять письма
- без `GROQ_API_KEY` AI endpoints будут недоступны и вернут ошибку сервиса
- без Telegram bot token уведомления в Telegram не отправляются, но остальная система работает

### `frontend/.env`

- `VITE_API_BASE_URL` - базовый путь API, по умолчанию `/api/v1`
- `API_PROXY_TARGET` - нужен для локальной разработки через Vite proxy

## Полезные команды

### Backend

```bash
dotnet build HireMind.sln
dotnet test HireMind.sln
```

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run test:run
npm run build
```

### Frontend e2e

```bash
cd frontend
npm run test:e2e
```

Playwright-конфиг поднимает Vite dev-server на `https://127.0.0.1:5173`. Часть e2e сценариев изолирована от backend через mock API helpers.
