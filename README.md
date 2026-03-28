# 🎉 Eventra — Backend API

**Eventra** is a secure, production-ready REST API powering a full-stack event management platform. It handles user authentication, event lifecycle management, role-based access control, payment processing, and real-time participation workflows.

---

## 🔗 Live URLs

| Resource | URL |
|---|---|
| 🌐 Backend Live API | [https://eventra-backend-two.vercel.app](https://eventra-backend-two.vercel.app) |
| 🖥️ Frontend Live App | [https://eventra-frontend-one.vercel.app](https://eventra-frontend-one.vercel.app) |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Authentication | Better-Auth (JWT-based) |
| Payments | Stripe |
| Validation | Zod |
| Build Tool | tsup |

---

## ✨ Core Features

### 🔐 Authentication
- User registration and login via **Better-Auth**
- Secure JWT-based session management
- Cookie-based auth with CORS support

### 👥 Role-Based Access Control (RBAC)
- **Admin** — Monitor all events, manage users, delete inappropriate content
- **User** — Create events, join events, manage participations

### 📅 Event Management
- Full CRUD operations for events
- Events can be **Public** or **Private**
- Events can be **Free** or **Paid**

### 🤝 Participation System
| Event Type | Join Flow |
|---|---|
| Public Free | Instant join |
| Public Paid | Payment → Instant join |
| Private Free | Request → Host approval |
| Private Paid | Payment → Request → Host approval |

### 📧 Invitation System
- Hosts can invite users to private events
- Invitees can accept, decline, or pay & accept

### 💳 Payment Integration
- Integrated with **Stripe** for payment processing
- Paid join attempts create pending requests awaiting host approval

### ⭐ Reviews & Ratings
- Users can rate and review events they attended
- Edit and delete reviews within the review window

### 🛡️ Error Handling
- Centralized error handling middleware
- Zod-based input validation
- Proper HTTP status codes for all errors

---

## 📁 Project Structure

```
Eventra-Backend/
├── prisma/
│   └── schema/          # Prisma schema files
├── src/
│   ├── modules/
│   │   ├── user/        # User auth & profile
│   │   ├── admin/       # Admin operations
│   │   ├── event/       # Event CRUD
│   │   ├── Participation/ # Join & approval flows
│   │   ├── Invitation/  # Invite system
│   │   ├── Payment/     # Stripe integration
│   │   └── Reviews/     # Ratings & reviews
│   ├── middlewares/     # Auth, error, RBAC middleware
│   ├── lib/             # Prisma & auth clients
│   ├── routes/          # Route aggregator
│   ├── utils/           # Helper utilities
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL database (or a [Neon](https://neon.tech) account)
- Stripe account (for payment testing)

### 1. Clone the repository
```bash
git clone https://github.com/jisan-05/Eventra-Backend.git
cd eventra-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:5000

FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
```

### 4. Run database migrations
```bash
npm run migrate
```

### 5. Seed the admin account
```bash
npm run seed:admin
```

### 6. Start the development server
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

---

## 📡 API Endpoints Overview

| Module | Method | Endpoint | Access |
|---|---|---|---|
| Auth | POST | `/api/auth/sign-up` | Public |
| Auth | POST | `/api/auth/sign-in` | Public |
| Events | GET | `/api/events` | Public |
| Events | POST | `/api/events` | User |
| Events | PATCH | `/api/events/:id` | Owner |
| Events | DELETE | `/api/events/:id` | Owner/Admin |
| Participation | POST | `/api/participation/join/:eventId` | User |
| Participation | PATCH | `/api/participation/approve/:id` | Owner |
| Invitations | POST | `/api/invitations` | Owner |
| Payment | POST | `/api/payment/create-checkout` | User |
| Reviews | POST | `/api/reviews/:eventId` | User |
| Admin | GET | `/api/admin/users` | Admin |
| Admin | DELETE | `/api/admin/events/:id` | Admin |

---

## 🔑 Admin Credentials

```
Email    : admin@gmail.com
Password : 12345678
```

---

## 🚀 Deployment

This project is deployed on **Vercel**. The `vercel.json` configuration handles routing for the Express server.

```bash
# Build for production
npm run build
```

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript for production |
| `npm start` | Start production server |
| `npm run migrate` | Run Prisma database migrations |
| `npm run generate` | Generate Prisma client |
| `npm run seed:admin` | Create the initial admin user |
| `npm run format` | Format code with Prettier |
