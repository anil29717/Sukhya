# Healthcare Platform — Todo List

Version: 1.1  
Last updated: June 2026

Track progress by checking items off. See [project-overview.md](project-overview.md) and [phases.md](phases.md).

**Phase 1A backend (Sprints 1–7):** Complete  
**Phase 1B advanced (Sprints 11–18):** Next  
**Phase 1C ship (Sprints 8–10):** Planned  
**Phase 2 AI (Sprints 19–24):** Post-production

---

## Phase 1A — Core Platform (Sprints 1–7)

### Sprint 1: Project Setup & Authentication

#### Backend

- [x] Initialize FastAPI project structure
- [x] Configure PostgreSQL connection (SQLAlchemy)
- [x] Set up Alembic for migrations
- [x] Create Docker and docker-compose for local dev
- [x] Define `users` and `roles` models
- [x] Implement bcrypt password hashing
- [x] Implement JWT access + refresh token flow
- [x] Patient registration endpoint
- [x] Doctor registration endpoint
- [x] Admin user creation endpoint
- [x] Login endpoint
- [x] Logout endpoint (token invalidation)
- [x] Password reset flow
- [x] Refresh token endpoint
- [x] Profile CRUD (personal info, photo, language preference)
- [x] RBAC middleware / dependencies
- [x] Swagger / OpenAPI baseline documentation

#### Mobile

- [ ] Initialize Expo + React Native + TypeScript project
- [ ] Set up navigation (React Navigation)
- [ ] Configure Redux Toolkit store
- [ ] Configure React Query client
- [ ] Login screen
- [ ] Registration screen (patient)
- [ ] Auth token storage and refresh interceptor
- [ ] Profile screen (basic)

#### Infrastructure

- [x] Environment variable template (`.env.example`)
- [ ] Nginx config draft for reverse proxy
- [x] README with local setup instructions

---

### Sprint 2: Patients & Doctors Modules

#### Backend

- [x] Create `patients` model and migrations
- [x] Create `doctors` model and migrations
- [x] Patient profile endpoints (DOB, gender, blood group, emergency contact)
- [x] Patient medical info endpoints (allergies, history, conditions)
- [x] Doctor profile endpoints (qualification, specialization, experience, fee)
- [x] Doctor availability model (working hours, weekly schedule)
- [x] Leave management endpoints
- [x] Patient search and filter API
- [x] Doctor listing and detail API
- [x] Doctor approval workflow (admin)

#### Mobile

- [ ] Patient profile edit screens
- [ ] Doctor listing screen
- [ ] Doctor details screen
- [ ] Medical information form screens

---

### Sprint 3: Appointment Management

#### Backend

- [x] Create `appointments` model and migrations
- [x] Slot generation from doctor availability
- [x] Appointment booking endpoint
- [x] Confirm appointment endpoint
- [x] Reschedule appointment endpoint
- [x] Cancel appointment endpoint
- [x] Complete appointment endpoint
- [x] Upcoming appointments list
- [x] Completed appointments list
- [x] Appointment history with filters
- [x] Status enum: pending, confirmed, completed, cancelled

#### Mobile

- [ ] Doctor discovery from listing
- [ ] Slot selection UI
- [ ] Appointment booking flow
- [ ] Appointments list (upcoming / completed / history)
- [ ] Appointment detail and actions (cancel, reschedule)

#### Doctor App

- [ ] Dashboard: today's appointments
- [ ] Dashboard: upcoming consultations
- [ ] Appointment list with status actions

---

### Sprint 4: EHR Management

#### Backend

- [x] Create `medical_records` model and migrations
- [x] AWS S3 integration (boto3) + local storage fallback
- [x] Private bucket / folder structure
- [x] Upload endpoint (PDF, JPG, PNG, DOCX)
- [x] Download endpoint (signed URLs / local)
- [x] View / metadata endpoint
- [x] Delete endpoint with authorization
- [x] Record type categorization
- [x] Audit log on record access

#### Mobile

- [ ] Medical records list screen
- [ ] Document upload flow
- [ ] Document viewer (PDF / image)
- [ ] Download to device

---

### Sprint 5: Prescription Management

#### Backend

- [x] Create `prescriptions` model and migrations
- [x] Create prescription (structured fields)
- [x] Edit prescription
- [x] Upload prescription document
- [x] Share prescription with patient
- [x] List prescriptions (doctor / patient views)
- [x] Download prescription endpoint

#### Mobile

- [ ] Doctor: create / edit prescription screen
- [ ] Doctor: upload prescription document
- [ ] Patient: prescription list and detail
- [ ] Patient: download prescription

---

### Sprint 6: Notifications

#### Backend

- [x] Create `notifications` model and migrations
- [x] Email service integration (SMTP + dev logging)
- [x] WhatsApp integration (API + dev logging)
- [x] Template: appointment confirmation (email)
- [x] Template: prescription shared (email)
- [x] Template: report uploaded (email)
- [x] Template: appointment status update (WhatsApp)
- [x] Event triggers on appointment / prescription / EHR actions
- [x] Notification delivery status logging
- [ ] Template: appointment reminder (scheduled job)
- [ ] Template: follow-up reminder (WhatsApp)

#### Testing

- [ ] Verify email delivery in staging
- [ ] Verify WhatsApp delivery in staging

---

### Sprint 7: Admin Portal

#### Backend

- [x] Admin analytics endpoints
- [x] User management (list + update)
- [x] Doctor approval management
- [x] Appointment monitoring endpoints
- [x] Record monitoring endpoints
- [x] Audit logs model and ingestion
- [x] Usage reports endpoint

#### Admin UI

- [ ] Dashboard with analytics widgets
- [ ] User management interface
- [ ] Doctor approval interface
- [ ] Audit log viewer
- [ ] Appointment and record monitoring views

---

## Phase 1C — Ship It (Sprints 8–10)

### Sprint 8: Mobile Applications

#### Setup

- [x] Initialize Expo + React Native + TypeScript project
- [x] Lumina theme, navigation shell, custom bottom nav

#### Patient App

- [x] Dashboard screen (UI — mock data)
- [ ] Wire all core API screens
- [ ] Global error and loading states
- [ ] Pull-to-refresh on lists
- [ ] Profile photo upload

#### Doctor App

- [ ] Login screen
- [x] Dashboard screen (UI — mock data)
- [ ] Patient list screen
- [ ] Prescription management screens
- [ ] Profile screen

#### Build

- [ ] App icons and splash screens
- [ ] iOS and Android build configuration
- [ ] Environment configs (dev / staging / prod)

---

### Sprint 9: Testing

- [ ] Auth unit tests
- [ ] RBAC integration tests
- [ ] Patient / doctor / appointment API tests
- [ ] EHR upload/download tests
- [ ] Prescription flow tests
- [ ] Notification trigger tests
- [ ] Mobile E2E: login → book → confirm
- [ ] Load test appointment booking
- [ ] Security: unauthorized access, token expiry

---

### Sprint 10: Deployment

- [ ] Ubuntu server + Docker + Nginx SSL
- [ ] Production PostgreSQL and S3
- [ ] CI/CD pipeline
- [ ] Production runbook
- [ ] App store submission (or internal tracks)
- [ ] Smoke test production

---

## Phase 1B — Advanced Premium (Sprints 11–18)

> Top 10 premium features — see [features.md](features.md#phase-1b--advanced-premium-features)

### Sprint 11: Family Health + Emergency Profile ⭐ #1 foundation

#### Backend

- [x] `family_members` model and migration (`005`)
- [x] `emergency_profiles` model and medical ID generation
- [x] Add / list / update / remove family members
- [x] Dependent patient profiles (managed by guardian)
- [x] Book appointment on behalf of family member (`family_member_id`)
- [x] Shared family health records access rules (`can_share_records`)
- [x] Family health dashboard API
- [x] Emergency medical profile (get/update)
- [x] One-tap emergency card API (`/family/emergency/card`)
- [x] Patient `user_id` nullable for dependents
- [ ] Medical ID card PDF/QR export (mobile)

#### Mobile

- [ ] Family members management screens
- [ ] Book for family member flow
- [ ] Emergency profile + Medical ID card screen
- [ ] One-tap emergency access UI

---

### Sprint 12: Health Timeline + Digital Health Locker ⭐ #3 #7

#### Backend

- [x] Unified `health_timeline_events` model (appointments, Rx, reports, visits)
- [x] Timeline API with filters (date range, type)
- [x] Appointment / prescription / report timeline endpoints
- [x] Doctor visit history aggregation
- [x] Digital locker: download history tracking
- [x] Record access logs per patient
- [x] Enhanced record sharing within family

#### Mobile

- [ ] Health timeline screen (chronological)
- [ ] Digital health locker UI with categories
- [ ] Access log viewer for patient

---

### Sprint 13: Medication + Personal Health Tracking ⭐ #4 #9

#### Backend

- [x] `medications`, `medication_schedules`, `medication_logs` models
- [x] Medicine and dosage tracking CRUD
- [x] Medication reminders (scheduler + notifications)
- [x] Missed dose tracking
- [x] Medication history API
- [x] `vital_signs` model (BP, blood sugar, weight, heart rate, SpO2)
- [x] Vital signs log CRUD and trends endpoint

#### Mobile

- [ ] Medication list + reminder setup
- [ ] Missed dose alerts
- [ ] Personal health tracking dashboards (charts)

---

### Sprint 14: Doctor Notes + Follow-Ups + Analytics ⭐ #5 #6

#### Backend

- [x] `doctor_notes` model (consultation, diagnosis, follow-up, private)
- [x] Notes CRUD linked to appointments / patients
- [x] `follow_ups` model and scheduling API
- [x] Follow-up reminders (notification triggers)
- [x] Follow-up history and tracking
- [x] Doctor analytics: daily/monthly appointments, patient growth
- [x] Consultation statistics and performance dashboard API
- [x] Patient history view: full timeline + records + Rx for doctor

#### Mobile

- [ ] Doctor notes editor (per consultation)
- [ ] Follow-up scheduling UI
- [ ] Doctor performance dashboard

---

### Sprint 15: Advanced Appointments ⭐ #8

#### Backend

- [x] Smart slot management (buffer times, max per day)
- [x] Recurring appointments model and API
- [x] Appointment waitlist model and join/leave API
- [x] Auto slot reallocation when cancellation occurs
- [x] Quick rebooking endpoint (same doctor, next slot)

#### Mobile

- [ ] Recurring booking UI
- [ ] Waitlist join and status UI
- [ ] Quick rebook action

---

### Sprint 16: Video Consultation + Queue ⭐ #2

#### Backend

- [ ] Video session model (room ID, status, participants)
- [ ] Integrate video SDK (WebRTC / Twilio / Daily — TBD)
- [ ] In-call chat messages model and API
- [ ] In-call file sharing
- [ ] Consultation notes linked to video session
- [ ] Call history API
- [ ] Appointment queue: live status, estimated wait time
- [ ] Queue notification triggers

#### Mobile

- [ ] Video call screen (patient + doctor)
- [ ] In-call chat and file share
- [ ] Live queue status UI

---

### Sprint 17: Notification Center + Preferences

#### Backend

- [ ] `notification_preferences` model (push, email, WhatsApp, SMS per event)
- [ ] Notification center: unified list with read/unread
- [ ] Medicine reminder notifications
- [ ] Follow-up reminder notifications
- [ ] Push notification integration (FCM / APNs)
- [ ] SMS provider integration
- [ ] Scheduled appointment reminder job

#### Mobile

- [ ] Notification center screen
- [ ] Notification preferences settings
- [ ] Push notification registration

---

### Sprint 18: EHR Enhancements + Multi-Clinic + Admin Advanced ⭐ #10

#### Backend

- [ ] Record tags model and API
- [ ] Full-text / advanced search and filter for records
- [ ] Record version history
- [ ] Secure share links with expiration
- [ ] Doctor-to-doctor record sharing
- [ ] Download tracking per record
- [ ] `clinics`, `branches`, `departments`, `staff` models
- [ ] Multi-clinic doctor and appointment scoping
- [ ] Advanced admin analytics (growth, revenue insights, usage metrics)
- [ ] Enhanced audit: doctor activity logs, security monitoring endpoints

#### Mobile / Admin

- [ ] Record search and tags UI
- [ ] Admin multi-clinic management UI
- [ ] Advanced analytics dashboard

---

### Optional: Small OpenAI Helpers (Parallel)

- [ ] OpenAI service module + API key config
- [ ] Medical report summary endpoint
- [ ] Prescription explanation endpoint
- [ ] Doctor bio generator endpoint
- [ ] Natural language record search endpoint
- [ ] Rate limiting and PHI safety review

---

## Phase 2 — Full AI Platform (Sprints 19–24)

> Post-production only. Not the same as optional OpenAI helpers above.

### Sprint 19: AI Infrastructure

- [ ] Ollama + Llama 3 / Mistral setup
- [ ] Qdrant vector database
- [ ] Embedding pipeline (BGE, Nomic)
- [ ] RAG pipeline (LangChain / LlamaIndex)

### Sprint 20: Symptom Analysis

- [ ] Text and voice symptom input
- [ ] Hindi / English support
- [ ] Pattern matching and risk assessment
- [ ] Specialist recommendation + confidence scores

### Sprint 21: Medical Assistant

- [ ] Context-aware chat with patient history
- [ ] Medical Q&A and appointment assistance

### Sprint 22: Report Analyzer

- [ ] Lab / prescription / diagnostic summarization
- [ ] Key findings and risk identification

### Sprint 23: Voice AI

- [ ] STT / TTS integration
- [ ] Voice booking and symptom reporting

### Sprint 24: AI Testing & Optimization

- [ ] Safety evaluation, latency, production deploy

---

## Legend

- [ ] Not started
- [x] Completed

**Priority markers:** ⭐ = Top 10 premium feature sprint
