# SPEC - Contracts Feature

## Overview
- **Feature**: Upload, store, and manage company contracts
- **Components**: Backend API + MinIO storage + Frontend UI

## Architecture

### Storage: MinIO (S3-compatible)
- Enable MinIO container trong docker-compose
- Bucket: `contracts`
- Path: `{companyId}/{year}/{filename}`

### Backend: Express + Prisma
- Route: `/api/contracts`
- Methods: GET, POST (upload), DELETE
- Prisma model: Contract

### Frontend: React
- Upload area với drag & drop
- Contract list với filters
- Contract detail viewer

## Database Schema

```prisma
model Contract {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  fileName    String
  filePath    String   // MinIO path
  fileSize    Int
  mimeType    String
  description String?
  uploadedBy  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company     Company  @relation(fields: [companyId], references: [id])
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contracts | List all contracts (company filter) |
| GET | /api/contracts/:id | Get contract details |
| POST | /api/contracts/upload | Upload contract file |
| DELETE | /api/contracts/:id | Delete contract |

## Tasks

### Step 1: Infrastructure (MinIO)
- [x] Enable MinIO trong docker-compose
- [x] Add MINIO credentials to .env

### Step 2: Backend
- [x] Add Contract model to Prisma schema
- [x] Create contracts routes
- [x] Create contracts controller
- [x] Create MinIO upload service

### Step 3: Frontend
- [x] Update Contracts.jsx với real functionality
- [x] Add drag & drop upload
- [x] Add contract list view

## Next Steps

1. Rebuild backend: `docker compose build backend`
2. Restart services: `docker compose up -d`
3. Push Prisma schema: `docker exec law-backend npx prisma db push`
4. Test upload at http://localhost:8080

## Dependencies
- MinIO → Backend → Frontend

## Timeline
- Step 1: 5 min
- Step 2: 15 min
- Step 3: 15 min
