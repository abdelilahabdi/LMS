# LMS

A Learning Management System API built with Node.js, Express, MongoDB, Mongoose, JWT, and Multer.

## Technologies
- Node.js / Express
- MongoDB / Mongoose
- JWT authentication (teammate-managed)
- Multer file uploads
- Swagger/OpenAPI documentation
- Docker (MongoDB + API)

## Installation

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and set values. Never commit real secrets.

Required variables:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_DRIVER_FOLDER_ID` (optional for uploads)

## Start

```bash
npm run dev
# or with Docker
# docker-compose up --build
```

## Tests

```bash
node --test test/*.test.js
```

## Main routes
- `POST /api/auth/register` (public, learner role)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/courses`
- `GET /api/enrollment`
- `POST /api/enrollment`
- `GET /api/progression`
- `PATCH /api/progression/{id}/resources/{resourceId}`
- `GET /api/trainer/enrolled`

## Documentation
- Swagger: `/api-docs`
- Progression docs: `docs/progression.md`
