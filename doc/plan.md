# Healthcare Platform — Development Plan

Version: 1.1  
Last updated: June 2026

## Vision

Build a **premium** mobile-first healthcare platform — connecting patients, doctors, and administrators with family health, digital lockers, video consults, and multi-clinic operations. Phase 1A core is **backend-complete**; Phase 1B adds differentiation; Phase 2 adds full AI.

**Related docs:** [project-overview.md](project-overview.md) | [features.md](features.md) | [phases.md](phases.md) | [todo list.md](todo%20list.md)

### Current Status

| Track | Status |
|-------|--------|
| Phase 1A core backend (Sprints 1–7) | **Done** |
| Phase 1B advanced premium (Sprints 11–18) | **Next** |
| Phase 1C mobile + deploy (Sprints 8–10) | Planned |
| Phase 2 full AI (Sprints 19–24) | Post-production |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Applications                      │
│              React Native + Expo (iOS / Android)             │
│         Patient App  │  Doctor App  │  (Admin Web/API)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────────┐
│                      Nginx (Reverse Proxy)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend (Python)                    │
│  Auth │ Patients │ Doctors │ Appointments │ EHR │ Rx │ Admin  │
└───────┬──────────────────────────────┬────────────────────────┘
        │                              │
┌───────▼────────┐            ┌────────▼────────┐
│   PostgreSQL   │            │    AWS S3       │
│   (Primary DB) │            │  (Documents)    │
└────────────────┘            └─────────────────┘
```

---

## Repository Structure (Proposed)

```
healthcare-platform/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/             # Route handlers
│   │   ├── core/            # Config, security, dependencies
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers (S3, email, etc.)
│   ├── alembic/             # Database migrations
│   ├── tests/
│   └── Dockerfile
├── mobile/                  # React Native + Expo
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── store/           # Redux Toolkit
│   │   ├── api/             # React Query hooks
│   │   └── navigation/
│   └── app.json
├── admin/                   # Admin portal (optional web UI)
├── docker-compose.yml
├── nginx/
└── doc/                     # Project documentation
```

---

## Phase 1: Core Platform Plan

### Sprint 1 — Project Setup & Authentication

**Goals:** Runnable backend and mobile skeleton with auth end-to-end.

| Area | Tasks |
|------|-------|
| Backend | FastAPI project scaffold, PostgreSQL + SQLAlchemy, Alembic, Docker setup |
| Auth | User model, roles (admin/doctor/patient), JWT + refresh tokens, bcrypt |
| API | Register (patient/doctor), login, logout, password reset, profile CRUD |
| Mobile | Expo init, navigation, Redux + React Query setup, login/register screens |
| DevOps | docker-compose (API + DB), env configuration, Swagger docs baseline |

**Exit criteria:** Users can register, log in, and manage profiles; API documented in Swagger.

---

### Sprint 2 — Patients & Doctors Modules

**Goals:** Complete profile and search capabilities for both user types.

| Area | Tasks |
|------|-------|
| Patients | Profile fields (DOB, gender, blood group, emergency contact), medical info |
| Doctors | Profile (qualification, specialization, experience, fee), availability model |
| API | CRUD endpoints, search/filter for patients, doctor listing |
| Mobile | Patient profile screens; doctor listing and detail screens |
| Admin | Doctor registration approval workflow (backend) |

**Exit criteria:** Doctors discoverable; patient medical profiles complete; admin can approve doctors.

---

### Sprint 3 — Appointment Management

**Goals:** Full appointment lifecycle from booking to completion.

| Area | Tasks |
|------|-------|
| Backend | Slot generation from availability, booking, status transitions |
| API | Book, confirm, reschedule, cancel, complete; history endpoints |
| Mobile | Booking flow, appointment list (upcoming/completed/history) |
| Doctor | Dashboard with today's and upcoming appointments |

**Exit criteria:** Patient can book; doctor can confirm/complete; statuses tracked correctly.

---

### Sprint 4 — EHR Management

**Goals:** Secure document storage and retrieval via S3.

| Area | Tasks |
|------|-------|
| Backend | medical_records model, S3 upload/download with signed URLs |
| API | Upload, view, download, delete; categorize by report type |
| Security | Private bucket, folder structure, access control by role |
| Mobile | Medical records screen with upload and view |
| Audit | Log record access events |

**Exit criteria:** PDF/images upload to S3; authorized users can view/download; audit trail exists.

---

### Sprint 5 — Prescription Management

**Goals:** Doctors create and share prescriptions; patients access history.

| Area | Tasks |
|------|-------|
| Backend | Prescription model (structured + document attachment) |
| API | Create, edit, upload, share, list, download |
| Mobile | Doctor prescription management; patient prescription history |
| Integration | Link prescriptions to appointments and patients |

**Exit criteria:** End-to-end prescription create → share → patient view/download.

---

### Sprint 6 — Notifications

**Goals:** Email and WhatsApp alerts for key events.

| Area | Tasks |
|------|-------|
| Email | Appointment confirmation/reminder, prescription shared, report uploaded |
| WhatsApp | Appointment reminder, status updates, follow-up reminders |
| Backend | Notification queue/model, templates, delivery status |
| Triggers | Hook into appointment, prescription, and EHR events |

**Exit criteria:** Notifications fire on defined events; delivery logged in `notifications` table.

---

### Sprint 7 — Admin Portal

**Goals:** Operational dashboard and system administration.

| Area | Tasks |
|------|-------|
| Dashboard | Analytics (patients, doctors, appointments, reports) |
| Management | User CRUD, doctor approval UI, appointment/record monitoring |
| Audit | Audit log viewer, activity tracking, usage reports |
| API | Admin-only endpoints with RBAC enforcement |

**Exit criteria:** Admin can manage users, approve doctors, and view system analytics and audit logs.

---

### Sprint 8 — Mobile Applications

**Goals:** Polish and complete all patient and doctor app screens.

| Area | Tasks |
|------|-------|
| Patient | All screens wired to API, error handling, loading states |
| Doctor | Dashboard, patient list, appointments, prescriptions, profile |
| UX | Consistent theming, offline-friendly patterns where applicable |
| Build | iOS and Android build configuration via Expo |

**Exit criteria:** Feature-complete mobile apps for patient and doctor roles.

---

### Sprint 9 — Testing

**Goals:** Quality assurance across backend and mobile.

| Area | Tasks |
|------|-------|
| Backend | Unit tests (services), integration tests (API), auth/RBAC tests |
| Mobile | Component tests, critical flow E2E (Detox or Maestro) |
| Security | Penetration basics, token expiry, S3 access validation |
| Performance | Load test critical endpoints (appointments, search) |

**Exit criteria:** Test coverage targets met; no critical/high bugs open.

---

### Sprint 10 — Deployment

**Goals:** Production deployment on Ubuntu with Docker and Nginx.

| Area | Tasks |
|------|-------|
| Infrastructure | Ubuntu server, Docker, Nginx SSL termination |
| CI/CD | Build and deploy pipeline (backend + mobile store submission prep) |
| Monitoring | Health checks, logging, backup strategy for PostgreSQL |
| Documentation | Runbooks, environment setup guide, API changelog |

**Exit criteria:** Platform live in production; HTTPS enabled; backups configured.

---

## Phase 1B: Advanced Premium Plan (Sprints 11–18)

> Makes the product feel like Practo Premium / Apollo 24/7 — **without** building the full Phase 2 AI platform.

### Top 10 Premium Features (Implementation Order)

| # | Feature | Sprint |
|---|---------|--------|
| 1 | Family Health Management | 11 |
| 2 | Video Consultation | 16 |
| 3 | Health Timeline | 12 |
| 4 | Medication Reminders | 13 |
| 5 | Doctor Notes | 14 |
| 6 | Follow-Up Management | 14 |
| 7 | Digital Health Locker | 12 |
| 8 | Appointment Waitlist | 15 |
| 9 | Personal Health Tracking | 13 |
| 10 | Multi-Clinic Support | 18 |

### Sprint 11 — Family Health + Emergency Profile

Family members model, book for family, shared records, emergency profile, medical ID, one-tap emergency API.

### Sprint 12 — Health Timeline + Digital Locker

Unified timeline events, download history, access logs, enhanced sharing.

### Sprint 13 — Medication + Vitals

Medication schedules, reminders, missed doses, BP/sugar/weight/heart rate/SpO2 logging.

### Sprint 14 — Doctor Notes + Follow-Ups + Analytics

Consultation notes, follow-up scheduling, doctor performance dashboard, full patient history view.

### Sprint 15 — Advanced Appointments

Smart slots, recurring bookings, waitlist, auto-reallocation, quick rebook.

### Sprint 16 — Video + Queue

Video SDK integration, in-call chat/files, call history, live queue with ETA.

### Sprint 17 — Notification Center + Preferences

Push/SMS, preferences per channel, scheduled reminders, in-app notification center.

### Sprint 18 — EHR + Multi-Clinic + Admin Advanced

Record tags, search, versions, expiring share links, clinics/branches/departments, revenue/growth analytics.

### Optional — Small OpenAI Helpers

Report summary, Rx explanation, doctor bio generator, NL search (OpenAI API, not Ollama/RAG platform).

---

## Phase 2: Full AI Platform Plan (Sprints 19–24)

> Execute only after Phase 1 is deployed and stable. **Distinct from** optional OpenAI helpers in 1B.

| Sprint | Focus |
|--------|-------|
| 19 | AI infrastructure (Ollama, Qdrant, RAG) |
| 20 | Symptom analysis engine |
| 21 | Generative medical assistant |
| 22 | Medical report analyzer |
| 23 | Voice AI assistant |
| 24 | AI testing and optimization |

**AI data inputs:** Patient history, medical records, prescriptions, appointments, doctor notes.

---

## Cross-Cutting Concerns

### Security

- JWT access tokens (short-lived) + refresh tokens (rotating)
- bcrypt for password storage
- HTTPS everywhere in production
- RBAC on every protected endpoint
- Signed S3 URLs with expiration
- Comprehensive audit logging

### API Design

- RESTful conventions
- Consistent error response format
- Pagination for list endpoints
- OpenAPI schemas for all request/response bodies
- Version prefix: `/api/v1/`

### Mobile State Management

- **Redux Toolkit:** Auth state, user profile, app settings
- **React Query:** Server state, caching, optimistic updates for appointments

### Database Migrations

- Alembic for all schema changes
- No manual SQL in production
- Seed scripts for roles and default admin

---

## Success Metrics (Phase 1)

| Metric | Target |
|--------|--------|
| API uptime | ≥ 99.5% |
| Auth flow | Register → login → refresh < 2s (p95) |
| Document upload | ≤ 10 MB files, upload success rate ≥ 99% |
| Mobile | Patient and doctor apps pass store review |
| Security | Zero critical vulnerabilities at launch |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| S3 misconfiguration exposing documents | Private bucket, IAM least privilege, signed URLs only |
| Appointment double-booking | DB-level constraints + transactional slot reservation |
| WhatsApp API integration complexity | Start with email; WhatsApp as parallel track in Sprint 6 |
| Scope creep into full AI during Phase 1B | Optional OpenAI helpers only; Phase 2 gated post-production |
| Video SDK complexity | Evaluate Twilio/Daily/WebRTC early in Sprint 16 spike |
| HIPAA / data compliance (if applicable) | Encrypt at rest, audit logs, access controls from Sprint 1 |

---

## Next Steps

1. **Start Sprint 11** — Family health + emergency medical profile (backend)
2. Parallel track: **Sprint 8** — Initialize Expo mobile app against existing APIs
3. Keep Swagger docs updated per new endpoints
4. Spike video SDK options before Sprint 16
