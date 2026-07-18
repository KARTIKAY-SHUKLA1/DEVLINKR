# 🚀 DevLinkr — Connect. Collaborate. Code.

DevLinkr is a full-stack developer matchmaking and collaboration platform designed for students and professionals to build real connections based on common tech skills and interests.

---

## 📌 Table of Contents
- [Features](#features)
- [Polyglot Persistence Architecture](#polyglot-persistence-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running with Docker Compose](#running-with-docker-compose)
- [Production Backend Features](#production-backend-features)
- [API Reference](#api-reference)
- [Folder Structure](#folder-structure)
- [License](#license)

---

## ✨ Features

- 🔐 OTP-based 3-step signup (email verification → password → profile setup)
- 🎯 Intelligent skill-based matching with paginated results
- 💬 Real-time chat with seen status, typing indicator, online status (Socket.IO)
- 📁 File & image sharing in chat
- 👨‍💻 Pair programming with collaborative code editor (Monaco + Socket.IO, debounced)
- 🔔 Connection requests & notifications system
- 📝 Editable profile with full tech stack & interests
- 🌍 Connect with developers worldwide (Student & Professional roles)
- 🔒 JWT-authenticated routes (Postgres UUID in payload)
- 🛡️ Redis-backed rate limiting on auth endpoints
- ⚡ Background job queue (BullMQ) for async session analysis
- 🗄️ Polyglot persistence: PostgreSQL + MongoDB + Redis

---

## 🏗 Polyglot Persistence Architecture

DevLinkr uses three databases, each chosen for what it does best:

```
┌──────────────────────────────────────────────────────────────────┐
│                        DevLinkr Backend                          │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL     │  │    MongoDB       │  │     Redis        │  │
│  │   (Prisma ORM)   │  │   (Mongoose)     │  │   (ioredis)      │  │
│  │                 │  │                 │  │                 │  │
│  │ • users table   │  │ • Messages       │  │ • Rate limiting  │  │
│  │   (auth + full  │  │ • Sessions       │  │   store          │  │
│  │   profile data) │  │ • SessionSummary │  │ • BullMQ queue   │  │
│  │                 │  │ • UserSocial     │  │ • Room presence  │  │
│  │ • otp_codes     │  │   (connections,  │  │   tracking       │  │
│  │   table         │  │   requests,      │  │                 │  │
│  │                 │  │   notifications) │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Why PostgreSQL for users & auth?
- **Relational integrity**: email uniqueness, ACID transactions on signup
- **Structured schema**: user profile fields are well-defined and rarely change shape
- **Array support**: PostgreSQL native `text[]` for `skills` and `interests` — efficient for skill-match queries with GIN indexes (future)
- **OTP management**: short-lived rows with strict expiry semantics suit SQL well
- **Prisma ORM**: type-safe schema-as-code with versioned migrations

### Why MongoDB for rooms, chat & social graph?
- **Flexible document shape**: chat messages may gain fields (reactions, threads) without schema migrations
- **Social graph**: connection arrays and notification arrays are naturally embedded lists
- **Session data**: code content is a single large string blob — document storage is ideal
- **High write throughput**: chat messages append-only workload fits MongoDB well

### Why Redis?
- **Rate limiting**: atomic counters across requests, Redis TTL handles window expiry automatically
- **BullMQ**: Redis Streams/Sorted Sets are the native backing store for reliable job queues
- **Room presence**: Redis Sets (`SADD`/`SREM`/`SMEMBERS`) survive server restarts, work across horizontal scaling

### Cross-DB Linking Key: Email
The `email` field is the natural key used to link data across PostgreSQL and MongoDB. It is present in:
- Postgres `users` table (unique, indexed)
- MongoDB `UserSocial` documents (unique, indexed)
- MongoDB `Message` documents (`sender`, `receiver` fields)
- JWT payload (`{ id: postgresUUID, email: userEmail }`)

This avoids the complexity of syncing surrogate keys across two different database systems, while still being a stable identifier.

---

## 🛠 Tech Stack

**Frontend:**
- React.js (Vite), Tailwind CSS, React Router, Axios

**Backend:**
- Node.js + Express.js
- **PostgreSQL** (via Docker) + **Prisma ORM** — user auth & profile
- **MongoDB** (Atlas or local) — messages, sessions, social graph
- **Redis** (via Docker) — rate limiting, BullMQ, room presence
- **BullMQ** — background session analysis jobs
- Socket.IO — real-time collaborative editor & chat
- JWT — stateless authentication
- Cloudinary + Multer — profile photo & file uploads
- Nodemailer — OTP email delivery
- express-rate-limit + rate-limit-redis — IP-based rate limiting

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- **Docker Desktop** (for Redis + PostgreSQL)

---

## 🐳 Running with Docker Compose

The `docker-compose.yml` at the project root starts **both Redis and PostgreSQL** together.

```bash
# From the project root
cd DevLinkr/

# Start Redis + PostgreSQL (detached)
docker-compose up -d

# Verify both containers are healthy
docker ps
# Expected:
# devlinkr-postgres   Up X seconds (healthy)   0.0.0.0:5432->5432/tcp
# devlinkr-redis      Up X seconds (healthy)   0.0.0.0:6379->6379/tcp

# Stop both (data preserved in named volume)
docker-compose down

# Stop and DELETE all data
docker-compose down -v
```

> **Note:** If you previously ran `docker run -d --name devlinkr-redis ...` manually,
> stop and remove it first: `docker stop devlinkr-redis && docker rm devlinkr-redis`

### Backend Setup

```bash
cd backend/
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<your_gmail>
EMAIL_PASS=<your_gmail_app_password>
CLOUDINARY_CLOUD_NAME=<cloudinary_cloud>
CLOUDINARY_API_KEY=<cloudinary_key>
CLOUDINARY_API_SECRET=<cloudinary_secret>

# Redis — start with: docker-compose up -d
REDIS_URL=redis://127.0.0.1:6379

# PostgreSQL — start with: docker-compose up -d
DATABASE_URL=postgresql://devlinkr:devlinkr_secret@localhost:5432/devlinkr_auth
```

### Run Prisma Migration (first time only)

```bash
cd backend/
npx prisma migrate dev --name init   # applies schema, creates tables
npx prisma generate                  # generates the Prisma client
```

### Start the Backend

```bash
npm start
```

Expected startup logs (all three databases connected):
```
🌐 Server running at http://localhost:5000
✅ Redis connected: redis://127.0.0.1:6379
✅ PostgreSQL Connected (Prisma)
✅ MongoDB Connected
```

### Frontend Setup

```bash
cd frontend/
npm install
npm run dev
```

---

## 🏭 Production Backend Features

### 🔴 Redis — Presence Tracking
Room presence is stored in Redis Sets (`room:{roomId}:users`).

```
GET /rooms/:roomId/online-users
→ { roomId, onlineUsers: [...], count: N }
```

### 🛡️ Rate Limiting (Redis-backed)

| Endpoint | Limit | Window |
|---|---|---|
| `POST /login`, `/signup`, `/send-otp` | 10 req | 15 min |
| `POST /verify-otp` | 5 req | 15 min |
| `GET /rooms/:id/online-users` | 30 req | 1 min |

Exceeded limit → HTTP `429` with `{ msg, retryAfter }`.

### ⚡ BullMQ Background Jobs
`POST /save-session` → saves to MongoDB + enqueues `analyzeSession` job.
Worker computes: `linesOfCode`, `charCount`, `language` → stores in `SessionSummary`.

### 📑 MongoDB Indexes

| Collection | Index | Reason |
|---|---|---|
| `users` (PG) | email (unique), skills[] | Prisma handles PG indexes |
| `messages` | `{sender,receiver,createdAt}` | Chat history compound |
| `messages` | `{receiver,status}` | Unseen count per connection |
| `sessions` | `{updatedAt:-1}` | Sort by last activity |
| `sessionsummaries` | `{room:1}` | Lookup by room ID |
| `usersocials` | `{email:1}` | Social graph lookup |

### 📄 Pagination

**Chat History** (cursor-based):
```
GET /api/auth/chat-history?user1=a@x.com&user2=b@x.com&limit=20&cursor=<id>
→ { messages[], nextCursor }
```

**Matches** (offset-based):
```
GET /api/auth/matches?email=a@x.com&limit=10&offset=0
→ { matches[], total, limit, offset, hasMore }
```

### 🎹 Socket.IO Debouncing
`codeUpdate` events in PairProgramming.jsx are debounced to 300ms — at most 1 emit per 300ms pause instead of every keystroke.

---

## 📁 Folder Structure

```
DevLinkr/
├── docker-compose.yml          # Redis + PostgreSQL together
│
├── frontend/
│   └── src/pages/PairProgramming.jsx   # Debounced socket editor
│
├── backend/
│   ├── index.js                # Server: Redis presence, online-users endpoint
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema (User, OtpCode)
│   │   └── migrations/         # Versioned SQL migrations
│   ├── prisma.config.ts        # Prisma datasource URL config
│   ├── routes/
│   │   └── auth.js             # All API routes (Postgres auth + Mongo social/chat)
│   ├── models/
│   │   ├── UserSocial.js       # NEW — social graph (MongoDB only)
│   │   ├── Message.js          # Chat messages (MongoDB, indexed)
│   │   ├── Session.js          # Coding sessions (MongoDB, indexed)
│   │   └── SessionSummary.js   # BullMQ analysis results (MongoDB)
│   ├── queues/
│   │   └── sessionQueue.js     # BullMQ Queue + Worker
│   ├── middleware/
│   │   └── rateLimiter.js      # Redis-backed rate limiters (3 tiers)
│   └── utils/
│       ├── prisma.js           # Prisma Client singleton (@prisma/adapter-pg)
│       └── redis.js            # ioredis singleton
│
└── README.md
```

---

## 🧑‍💻 Author

Kartikay Shukla
3rd Year ECE @ IIIT Kota
GitHub: [KARTIKAY-SHUKLA1](https://github.com/KARTIKAY-SHUKLA1)
LinkedIn: [linkedin.com/in/kartikay-shukla](https://linkedin.com/in/kartikay-shukla)

---

## 📄 License

This project is licensed under the MIT License.
