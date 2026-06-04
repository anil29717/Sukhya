# Healthcare Platform — Backend API

FastAPI backend for Phase 1 (Sprints 1–7 complete).

## Quick Start

```powershell
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
copy .env.example .env
venv\Scripts\alembic upgrade head
venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Swagger UI:** http://localhost:8000/docs
- **Default admin:** `admin@example.com` / `Admin@123456`

## Phase 1 Modules

| Sprint | Module | Status |
|--------|--------|--------|
| 1 | Authentication & Users | Done |
| 2 | Patients & Doctors | Done |
| 3 | Appointments | Done |
| 4 | EHR (Medical Records) | Done |
| 5 | Prescriptions | Done |
| 6 | Notifications | Done |
| 7 | Admin Portal | Done |
| 11 | Family Health + Emergency (Premium) | Done |
| 12 | Health Timeline + Digital Locker (Premium) | Done |
| 13 | Medications + Vitals (Premium) | Done |
| 14 | Doctor Notes + Follow-Ups + Analytics (Premium) | Done |
| 15 | Advanced Appointments (Premium) | Done |

## Premium — Family Health (Sprint 11)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/family/members` | List / add family members |
| GET/PUT/DELETE | `/api/v1/family/members/{id}` | Manage member |
| GET | `/api/v1/family/dashboard` | Family health dashboard |
| GET/PUT | `/api/v1/family/emergency/me` | Your emergency profile |
| GET | `/api/v1/family/emergency/card` | One-tap emergency card (`?family_member_id=`) |
| PUT | `/api/v1/family/emergency/members/{id}` | Family member emergency profile |
| POST | `/api/v1/appointments` | Pass `family_member_id` to book for family |

## Premium — Health Timeline & Digital Locker (Sprint 12)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health-timeline` | Unified timeline (filters: `patient_id`, `event_type`, dates) |
| POST | `/api/v1/health-timeline/sync` | Rebuild cached timeline (doctor/admin) |
| GET | `/api/v1/digital-locker` | Locker overview + recent activity |
| GET | `/api/v1/digital-locker/summary` | Record counts by type, downloads, access |
| GET | `/api/v1/digital-locker/downloads` | Download history |
| GET | `/api/v1/digital-locker/access-logs` | Record view audit trail |
| GET | `/api/v1/digital-locker/family-shared` | Family-shared records |

Medical record downloads are logged automatically via `GET /medical-records/{id}/download`.

## Premium — Medications & Vitals (Sprint 13)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/medications` | List / add medications with schedules |
| PUT | `/api/v1/medications/{id}` | Update medication |
| POST | `/api/v1/medications/{id}/log` | Log dose: `taken`, `missed`, `skipped` |
| GET | `/api/v1/medications/logs` | Medication history |
| GET | `/api/v1/medications/reminders/due` | Due doses today |
| POST | `/api/v1/medications/reminders/send` | Send reminder notifications |
| POST/GET | `/api/v1/vitals` | Log / list vital signs |
| GET | `/api/v1/vitals/trends` | Trends (`vital_type`, `days`) |

Vital types: `blood_pressure`, `blood_sugar`, `weight`, `heart_rate`, `oxygen`

## Premium — Doctor Notes & Follow-Ups (Sprint 14)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/doctor-notes` | List / create notes (doctor) |
| GET/PUT/DELETE | `/api/v1/doctor-notes/{id}` | Manage note |
| GET/POST | `/api/v1/follow-ups` | List / schedule follow-ups |
| PUT | `/api/v1/follow-ups/{id}` | Update status or schedule |
| POST | `/api/v1/follow-ups/reminders/send` | Send due reminders (admin/cron) |
| GET | `/api/v1/doctors/me/analytics` | Performance dashboard |
| GET | `/api/v1/doctors/me/patients/{id}/history` | Full patient history |

Note types: `consultation`, `diagnosis`, `follow_up`, `private`, `observation`. Private notes are hidden from patients.

## Premium — Advanced Appointments (Sprint 15)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/v1/doctors/me/scheduling` | Slot buffer (minutes) and max appointments per day |
| POST | `/api/v1/appointments/waitlist` | Join waitlist when slots are full |
| GET/DELETE | `/api/v1/appointments/waitlist` | List / leave waitlist |
| POST | `/api/v1/appointments/recurring` | Book recurring series (weekly/biweekly/monthly) |
| GET/DELETE | `/api/v1/appointments/recurring/{id}` | List / deactivate series |
| POST | `/api/v1/appointments/recurring/{id}/generate` | Generate more occurrences |
| POST | `/api/v1/appointments/{id}/quick-rebook` | Same doctor, next available slot |

Cancellations auto-offer freed slots to the waitlist (FIFO). Buffer time applies between consecutive bookings.

## Storage

- **Development:** `STORAGE_BACKEND=local` (files in `./storage/`)
- **Production:** `STORAGE_BACKEND=s3` with AWS credentials and `S3_BUCKET_NAME`

Folder structure: `patients/{id}/reports|prescriptions|xray|mri|ctscan/`

## Notifications

- Email via SMTP (logs to console in dev when `SMTP_HOST` is empty)
- WhatsApp via API (logs to console in dev when `WHATSAPP_API_URL` is empty)
- Auto-triggered on: appointment book/confirm/cancel, prescription share, report upload

## API Summary

### Auth & Users
`POST /auth/register/patient`, `/register/doctor`, `/login`, `/refresh`, `/logout`  
`GET/PUT /users/me`

### Patients
`GET/PUT /patients/me`, `PUT /patients/me/medical`, `GET /patients`, `GET /patients/{id}`

### Doctors
`GET /doctors`, `GET /doctors/{id}`, `GET/PUT /doctors/me`, availability & leave endpoints  
`GET /admin/doctors/pending`, `POST /admin/doctors/{id}/approve|reject`

### Appointments
`GET /appointments/doctors/{id}/slots`, `POST /appointments`, upcoming/completed/history  
`POST /appointments/{id}/confirm|reschedule|cancel|complete`

### EHR
`POST /medical-records` (multipart upload), `GET /medical-records`, `GET /{id}`, `GET /{id}/download`, `DELETE /{id}`

Record types: `lab_report`, `diagnostic_report`, `prescription`, `xray`, `mri`, `ctscan`

### Prescriptions
`POST /prescriptions`, `GET /prescriptions`, `GET /{id}`, `PUT /{id}`, `POST /{id}/share`  
`POST /{id}/upload`, `GET /{id}/download`

### Notifications
`GET /notifications/me`

### Admin Portal
`GET /admin/analytics` — dashboard totals  
`GET /admin/users`, `PUT /admin/users/{id}`  
`GET /admin/appointments`, `GET /admin/medical-records`  
`GET /admin/audit-logs`, `GET /admin/usage-reports`

## Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/
│   ├── core/          # config, database, security, storage, audit
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── alembic/
├── storage/           # local file storage (dev)
└── requirements.txt
```

## Docker

```bash
docker compose up --build
```

Set `DATABASE_URL=postgresql://healthcare:healthcare_secret@db:5432/healthcare_db` for the API container.
