# CLAUDE.md - AI Red Team Platform

## Project Overview

This is the **AI Red Team Platform** by TrilogyWorks - a security testing platform designed to identify vulnerabilities in AI systems through automated red-teaming.

**Deployment**: Railway (API) + Vercel/Railway (Web) with Supabase PostgreSQL backend.

## Tech Stack

### Frontend (Web Dashboard)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (with code splitting)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Lucide React
- **Charts**: Recharts
- **Validation**: Zod (form validation hook)
- **Error Tracking**: Sentry
- **Testing**: Vitest + React Testing Library

### Backend (API)
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt (12 rounds)
- **Rate Limiting**: express-rate-limit
- **Logging**: Pino (structured JSON logs with request IDs)
- **Error Tracking**: Sentry
- **Documentation**: OpenAPI/Swagger
- **Real-time**: Server-Sent Events (SSE)

### SDK
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Builds**: Dual ESM + CommonJS output

## Project Structure

This is an npm workspaces monorepo with three packages:

```
ai-redteam-platform/
├── package.json              # Monorepo root with workspaces
├── CLAUDE.md
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD
├── packages/
│   ├── api/                  # Backend (@trilogyworks/api)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Includes AuditLog model
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── app.ts        # Express app with rate limiting, CORS
│   │       ├── config/
│   │       │   ├── database.ts
│   │       │   ├── env.ts
│   │       │   └── logger.ts # Pino structured logging
│   │       ├── middleware/
│   │       │   ├── auth.ts
│   │       │   ├── error-handler.ts
│   │       │   └── audit.ts  # Audit logging middleware
│   │       ├── controllers/
│   │       ├── services/
│   │       │   ├── auth.service.ts    # bcrypt password hashing
│   │       │   └── testing-engine.service.ts
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   ├── auth.routes.ts
│   │       │   ├── user.routes.ts     # Admin user management
│   │       │   ├── sse.routes.ts      # Real-time test streaming
│   │       │   └── export.routes.ts   # CSV data export
│   │       └── data/
│   │           └── seed-payloads.ts
│   ├── web/                  # Frontend (@trilogyworks/web)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts    # Code splitting config
│   │   ├── tailwind.config.js
│   │   ├── index.html
│   │   ├── public/
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx       # Lazy loading, protected routes
│   │       ├── index.css
│   │       ├── types.ts
│   │       ├── pages/
│   │       │   ├── Login.tsx
│   │       │   ├── Register.tsx
│   │       │   ├── Users.tsx # Admin user management
│   │       │   └── ...
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   │   ├── Toast.tsx         # Toast notifications
│   │       │   │   ├── Skeleton.tsx      # Loading skeletons
│   │       │   │   └── ...
│   │       │   ├── ErrorBoundary.tsx
│   │       │   └── ProtectedRoute.tsx
│   │       ├── contexts/
│   │       │   ├── AuthContext.tsx
│   │       │   ├── ToastContext.tsx
│   │       │   └── ThemeContext.tsx
│   │       ├── hooks/
│   │       │   ├── useApi.ts
│   │       │   ├── useFormValidation.ts  # Zod validation hook
│   │       │   └── useTestStream.ts      # SSE hook
│   │       ├── services/
│   │       └── __tests__/
│   └── sdk/                  # Client SDK (@trilogyworks/ai-redteam)
│       ├── package.json      # Dual ESM/CJS builds
│       ├── tsconfig.json
│       ├── tsconfig.cjs.json
│       └── src/
│           ├── index.ts
│           ├── client.ts
│           └── types.ts
```

## Key Commands

```bash
# From monorepo root

# Development
npm run dev          # Start web dev server (Vite)
npm run dev:api      # Start API with hot reload

# Build
npm run build        # Build all packages

# Testing
npm run test         # Run tests in all packages
npm run test:watch   # Watch mode for tests

# Type Checking
npm run typecheck    # Run tsc across all packages

# Linting
npm run lint         # ESLint all packages

# Database (API)
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed the database

# Individual package commands
npm run dev --workspace=@trilogyworks/web
npm run dev --workspace=@trilogyworks/api
npm run build --workspace=@trilogyworks/sdk
npm run test --workspace=@trilogyworks/web
```

## Core Domain Concepts

### Payloads
Security test payloads organized by category:
- `PROMPT_INJECTION` - Attempts to override AI instructions
- `DATA_EXTRACTION` - Attempts to leak training data or sensitive info
- `GUARDRAIL_BYPASS` - Attempts to bypass safety filters
- `INTEGRATION_VULN` - Exploits in tool/API integrations

### Projects
AI systems being tested, with target types:
- `API` - REST/GraphQL AI endpoints
- `CHATBOT` - Conversational AI interfaces
- `COPILOT` - AI coding assistants
- `AGENT` - Autonomous AI agents
- `CUSTOM` - Other AI systems

### Tests
Automated test runs that execute payloads against project targets. Tracks:
- Status: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`
- Progress: total/completed payloads, successful attacks
- Real-time updates via SSE streaming

### Findings
Security vulnerabilities discovered during testing:
- Severities: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`
- Statuses: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ACCEPTED_RISK`, `FALSE_POSITIVE`

### Reports
Generated security reports:
- `EXECUTIVE_SUMMARY` - High-level overview for stakeholders
- `TECHNICAL_DETAIL` - Detailed technical findings
- `FULL_REPORT` - Comprehensive report with all details

### User Roles
- `ADMIN` - Full access to all features and user management
- `USER` - Can create and manage projects, tests, and findings
- `VIEWER` - Read-only access to view projects and reports

## API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET/PUT/DELETE /api/users/:id`, `POST /api/users/:id/role`, `POST /api/users/:id/toggle-status` |
| Payloads | `GET/POST /api/payloads`, `GET/PUT/DELETE /api/payloads/:id` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id` |
| Tests | `GET/POST /api/tests`, `GET /api/tests/:id`, `POST /api/tests/:id/cancel` |
| Test SSE | `GET /api/tests/:id/stream` (Server-Sent Events) |
| Findings | `GET/POST /api/findings`, `GET/PUT/DELETE /api/findings/:id` |
| Reports | `GET/POST /api/reports`, `GET /api/reports/:id` |
| Analytics | `GET /api/analytics/*` |
| Export | `GET /api/export/findings`, `GET /api/export/test-results/:testId`, `GET /api/export/payloads` |
| Health | `GET /api/health` (unauthenticated) |
| Docs | `GET /api/docs` (Swagger UI) |

## Environment Variables

### Required
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
```

### Optional
```bash
PORT=3000                                    # API server port
CORS_ORIGIN=http://localhost:5173            # Allowed frontend origins (comma-separated)
SENTRY_DSN=https://xxx@sentry.io/xxx         # Error tracking
NODE_ENV=production                          # Environment mode
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000           # API base URL
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx    # Frontend error tracking
```

## Security Features

### Database Security (Supabase RLS)
All tables have Row Level Security enabled with policies:
- Users can only access their own data
- Admins have full access
- Sensitive columns (password hashes, API keys) are protected

### Authentication
- JWT tokens with configurable expiration
- bcrypt password hashing (12 rounds)
- Protected routes require valid token
- SSE supports query parameter tokens for EventSource API

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- Configurable per-route limits

### CORS
- Configurable allowed origins via `CORS_ORIGIN` env var
- Supports multiple origins (comma-separated)
- Credentials enabled for authenticated requests

## Frontend Architecture

### Code Splitting
Vite manual chunks for optimal loading:
- `vendor-react`: React, React DOM, React Router
- `vendor-charts`: Recharts
- `vendor-ui`: Lucide React, clsx
- `vendor-query`: TanStack Query

### State Management
- **Server State**: TanStack Query with automatic cache invalidation
- **Auth State**: React Context (`AuthContext`)
- **UI State**: React Context (`ToastContext`, `ThemeContext`)

### Error Handling
- `ErrorBoundary` component wraps all routes
- Toast notifications for user feedback
- Sentry integration for error tracking

### Accessibility (WCAG 2.1)
- ARIA labels on all interactive elements
- Focus trapping in modals
- Keyboard navigation support
- Skip links for main content
- Screen reader announcements

### Real-time Updates
- `useTestStream` hook for SSE connections
- Auto-reconnect with exponential backoff
- Progress updates every 2 seconds during tests

## Hooks

### `useFormValidation(schema: ZodSchema)`
Form validation hook with Zod schemas:
```tsx
const { errors, validate, clearErrors, hasError, getError, setFieldError } = useFormValidation(schema);

const result = validate(formData);
if (result.success) {
  // result.data contains validated/transformed data
}
```

### `useTestStream(testId: string)`
SSE hook for real-time test progress:
```tsx
const { progress, isConnected, error } = useTestStream(testId);
// progress: { completedPayloads, totalPayloads, successfulAttacks, status }
```

### `useApi` hooks
TanStack Query hooks for all API operations:
- `useProjects`, `useProject`, `useCreateProject`, etc.
- `useTests`, `useStartTest`, `useCancelTest`
- `useFindings`, `useCreateFinding`, `useUpdateFinding`
- `useUsers`, `useUpdateUser`, `useDeleteUser`, `useChangeUserRole`

## Testing

### Frontend (Vitest + RTL)
```bash
npm run test --workspace=@trilogyworks/web
```
- 67+ tests covering hooks, components, and utilities
- React Testing Library for component tests
- Mock service worker for API mocking

### Backend (Jest)
```bash
npm run test --workspace=@trilogyworks/api
```

## CI/CD (GitHub Actions)

The `.github/workflows/ci.yml` pipeline:
1. **Install**: npm ci with caching
2. **Type Check**: TypeScript compilation
3. **Lint**: ESLint
4. **Test**: Vitest and Jest
5. **Build**: Production builds
6. **Deploy**: Railway (on main branch)

Required secrets:
- `RAILWAY_TOKEN` - Railway deployment token

## Audit Logging

All mutating operations are logged to the `AuditLog` table:
- User ID and email
- Action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
- Entity type and ID
- IP address and user agent
- Timestamp

Access via admin UI or direct database query.

## Data Export

CSV export endpoints for compliance and reporting:
- `/api/export/findings` - All findings with severity, status, dates
- `/api/export/test-results/:testId` - Test results with payload info
- `/api/export/payloads` - Payload library export

## Development Guidelines

1. **Type Safety**: Use strict TypeScript types; no `any`
2. **API Responses**: Follow `ApiResponse<T>` and `PaginatedResponse<T>` patterns
3. **Error Handling**: Use centralized error handler; wrap async routes
4. **Styling**: Tailwind CSS utilities; support dark mode via `useTheme()`
5. **State**: TanStack Query for server state; React Context for client state
6. **Validation**: Zod schemas for both frontend and backend
7. **Logging**: Use Pino logger with request IDs for traceability
8. **Accessibility**: ARIA labels, keyboard navigation, focus management
9. **Security**: Never log sensitive data; use parameterized queries

## Types

TypeScript types are defined in each package:
- **Web**: `packages/web/src/types.ts` - Frontend types
- **SDK**: `packages/sdk/src/types.ts` - SDK/API types

Key interfaces:
- `User`, `UserRole`, `AuthResponse`
- `Payload`, `PayloadFilters`, `PayloadCategory`
- `Project`, `CreateProjectInput`, `UpdateProjectInput`
- `TestRun`, `TestResult`, `TestConfig`, `TestProgress`
- `Finding`, `CreateFindingInput`, `UpdateFindingInput`, `FindingStatus`
- `Report`, `ReportContent`, `GenerateReportInput`
- `DashboardStats`, `AnalyticsData`
