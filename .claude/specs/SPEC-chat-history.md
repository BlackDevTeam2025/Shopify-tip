# SPEC - Chat History Feature

## 1. Overview

- **Feature**: Lưu lịch sử chat vào database
- **Mục tiêu**: User có thể xem lại các cuộc trò chuyện trước đó
- **Scope**: Backend API + Frontend integration

## 2. Database Schema

### Table: ChatHistory

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| companyId | String | Denormalized for queries |
| title | String? | Title of conversation |
| messages | JSON | Array of messages |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

### Messages JSON Structure

```json
[
  {
    "id": "msg_123",
    "role": "user" | "assistant",
    "content": "Nội dung tin nhắn",
    "sources": [
      { "documentTitle": "...", "article": "...", "content": "..." }
    ],
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

## 3. Backend Implementation

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat-history` | Get all conversations for user |
| GET | `/api/chat-history/:id` | Get specific conversation |
| POST | `/api/chat-history` | Create new conversation |
| PUT | `/api/chat-history/:id` | Update conversation |
| DELETE | `/api/chat-history/:id` | Delete conversation |

### Implementation Tasks

- [ ] Create `chat-history.controller.js`
- [ ] Create `chat-history.routes.js`
- [ ] Register routes in `routes/index.js`
- [ ] Add auth middleware

## 4. Frontend Implementation

### Integration Points

- [ ] Replace localStorage with API calls
- [ ] Fetch conversations on load
- [ ] Save new messages to backend
- [ ] Delete conversation via API

### UI Updates

- Keep existing sidebar layout
- Load history from API instead of localStorage

## 5. Dependencies

- Backend: ChatHistory model already created in Prisma
- Frontend: Use existing askLaw API

## 6. Testing

- [ ] Test create conversation
- [ ] Test update conversation (add messages)
- [ ] Test delete conversation
- [ ] Test list conversations
- [ ] Test pagination

## 7. Security

- User can only access their own conversations
- Company-scoped: filter by user's company
