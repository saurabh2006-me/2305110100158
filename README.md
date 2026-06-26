# Notification Platform

A production-level full-stack notification platform built with React 19, TypeScript, Material UI, Node.js, Express, MongoDB, Redis, and RabbitMQ.

## Features

- **Authentication**: JWT-based auth with evaluation service integration
- **Real-time Notifications**: WebSocket-powered live updates
- **Priority Inbox**: Smart scoring algorithm (Placement > Result > Event)
- **Bulk Notifications**: Queue-based processing for 50,000+ recipients
- **Advanced Filtering**: Type, priority, status, date range, search
- **Pagination**: Offset and cursor-based pagination
- **Caching**: Redis with TTL invalidation
- **Logging**: Centralized logging middleware with evaluation service integration
- **Dark Mode**: Theme switching support
- **Responsive Design**: Mobile-first Material UI components

## Tech Stack

### Frontend
- React 19 + TypeScript
- Material UI v6
- React Router v7
- Zustand (state management)
- React Query (data fetching)
- Axios (HTTP client)

### Backend
- Node.js + Express.js 5
- TypeScript
- MongoDB + Mongoose
- Redis (caching)
- RabbitMQ (message queue)
- WebSocket (real-time)
- JWT Authentication
- Winston (logging)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Environment Setup
```bash
cp backend/.env.example backend/.env
# Edit .env with your credentials
```

### Run with Docker
```bash
docker-compose up -d
```

### Run Locally
```bash
# Start infrastructure
docker-compose up -d mongo redis rabbitmq

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Documentation

See `docs/API.md` for complete endpoint documentation.

## Architecture

```
Client (React) → API Gateway (NGINX) → Express API → MongoDB/Redis/RabbitMQ
                                          ↓
                                    WebSocket Server
                                          ↓
                                    Background Workers
```

## Folder Structure

```
notification-platform/
├── backend/
│   ├── src/
│   │   ├── config/        # Environment configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── repositories/  # Data access layer
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript definitions
│   │   ├── utils/         # Logger, helpers
│   │   ├── workers/       # Background workers
│   │   └── server.ts      # Entry point
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios client & services
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Theme provider
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # MainLayout
│   │   ├── pages/         # Dashboard, Notifications, Priority, Detail, 404
│   │   ├── store/         # Zustand state management
│   │   ├── styles/        # Global styles
│   │   ├── types/         # Frontend types
│   │   └── utils/         # Utilities
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker/
│   └── docker-compose.yml
└── README.md
```

## License

MIT
