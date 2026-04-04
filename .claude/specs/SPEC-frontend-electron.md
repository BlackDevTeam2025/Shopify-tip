# SPEC - Electron Frontend for LegalTech App

## Project Overview
- **Name**: AI Pháp Lý - Legal Desktop Client
- **Type**: Electron Desktop App với React + Vite
- **Purpose**: Help Vietnamese companies manage legal risk and compliance

---

## 1. UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR (Company Selector + User Menu)                   │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │              MAIN CONTENT                        │
│          │                                                  │
│ - Logo   │  (Dynamic based on selected route)              │
│ - Nav    │                                                  │
│ - Items  │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Navigation Items (Sidebar)
1. **Dashboard** - Tổng quan legal health
2. **Bản đồ nghĩa vụ** - Obligations map per company
3. **Cảnh báo** - Alerts & Timeline
4. **Hợp đồng** - Contract analysis
5. **Hỏi đáp pháp luật** - Legal Q&A Chat

### Color Palette
- Primary: `#1E40AF` (Deep Blue)
- Secondary: `#3B82F6` (Blue)
- Accent: `#F59E0B` (Amber - warnings)
- Danger: `#EF4444` (Red - critical)
- Success: `#10B981` (Green)
- Background: `#F8FAFC` (Light gray)
- Surface: `#FFFFFF` (White)
- Text Primary: `#1E293B`
- Text Secondary: `#64748B`

### Typography
- Font Family: Inter, system-ui, sans-serif
- Headings: 24px/20px/16px (h1/h2/h3)
- Body: 14px
- Small: 12px

---

## 2. Folder Structure

```
electron-app/
├── package.json              # Vite + Electron + React deps
├── vite.config.js           # Vite configuration
├── electron/
│   ├── main.js             # Electron main process
│   └── preload.js          # Preload script for IPC
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root component with Router
│   ├── index.css           # Global styles (Tailwind)
│   ├── routes/
│   │   ├── Dashboard.jsx
│   │   ├── CompanyObligations.jsx
│   │   ├── Alerts.jsx
│   │   ├── Contracts.jsx
│   │   └── ChatLaw.jsx
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   ├── CompanySelector.jsx
│   │   ├── ObligationList.jsx
│   │   ├── ObligationGraph.jsx   # Placeholder for Neo4j
│   │   ├── AlertList.jsx
│   │   ├── ContractUpload.jsx
│   │   └── ChatBox.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useApiClient.js
│   ├── api/
│   │   ├── httpClient.js
│   │   ├── authApi.js
│   │   ├── companyApi.js
│   │   ├── contractApi.js
│   │   └── askLawApi.js
│   └── utils/
│       └── mockData.js
└── index.html
```

---

## 3. Functionality Specification

### 3.1 Authentication
- Login form (email/password)
- JWT token storage in localStorage
- Auto-attach Authorization header to API calls
- Logout clears token and redirects to login

### 3.2 Dashboard
- **Legal Health Score Card**: Circular progress (0-100)
- **KPI Cards**:
  - Open Obligations (count)
  - Red Alerts (count)
  - Upcoming Deadlines (next 30 days)
- Recent Alerts list (last 5)

### 3.3 Company Obligations Map
- **Left Panel**: Filters
  - Status: All / Pending / Done
  - Severity: All / Green / Yellow / Orange / Red
- **Center**: Obligation table/list
  - Columns: Title, Deadline, Status, Severity
  - Sortable by deadline
- **Right Panel**: ObligationGraph placeholder
  - Mock static nodes showing obligation relationships

### 3.4 Alerts Page
- Grouped by severity:
  - Critical (Red) - T-7
  - Warning (Orange) - T-30
  - Notice (Yellow) - T-60
  - Info (Green) - T-90
- Each alert shows: title, description, deadline, action

### 3.5 Contracts Page
- **Upload Area**: Drag & drop or click to upload
- **Contract List**: Table with columns:
  - Name, Upload Date, Status (Analyzed/Pending), Risk Level
- **Detail Panel** (on click):
  - Contract summary
  - Risk tags (colors by severity)
  - Key clauses identified

### 3.6 Legal Q&A Chat
- Chat message history (user + assistant)
- Input field to send question
- Shows:
  - Question
  - AI Answer
  - Citations/Sources (list of legal references)

---

## 4. API Integration

### Base URL
- Development: `http://localhost:3001`
- Production: Configurable via environment

### Endpoints Used
```
POST /api/auth/login
GET  /api/me
GET  /api/companies
POST /api/companies
GET  /api/companies/:id/obligations
GET  /api/companies/:id/alerts
POST /api/contracts/upload
GET  /api/contracts/:id/analysis
POST /api/ask-law
```

### Token Management
- Store JWT in localStorage (`authToken`)
- Attach to every request: `Authorization: Bearer <token>`
- Handle 401 responses: redirect to login

---

## 5. Mock Data

Use mock data for development (no real backend required):
- 3 sample companies
- 10+ obligations with various statuses/severities
- 5+ alerts with different levels
- 3 sample contracts with analysis results
- Sample Q&A conversation history

---

## 6. Acceptance Criteria

- [ ] Electron app launches without errors
- [ ] Login/logout flow works with mock auth
- [ ] All 5 navigation routes render correctly
- [ ] Dashboard shows health score and KPIs
- [ ] Obligations page has working filters
- [ ] Alerts page groups by severity
- [ ] Contracts page has upload UI and list
- [ ] Chat page shows message history and input
- [ ] API client correctly attaches auth headers
- [ ] Responsive layout works at 1024px+ width
