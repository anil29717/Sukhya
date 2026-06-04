# Healthcare Platform — Features

Version: 1.1

## Overview

A mobile-first healthcare ecosystem connecting patients, doctors, and administrators through a secure, scalable digital platform.

| Track | Scope |
|-------|--------|
| **Phase 1A — Core** | Auth, patients, doctors, appointments, EHR, prescriptions, notifications, admin (**backend done**) |
| **Phase 1B — Advanced Premium** | Family health, timelines, medication, video, waitlist, multi-clinic, etc. (**planned**) |
| **Phase 1C — Ship** | Mobile apps, testing, deployment |
| **Phase 2 — AI Platform** | Full AI intelligence (post-production) |
| **Phase 1 Optional** | Small OpenAI helpers only (not full AI platform) |

See also: [project-overview.md](project-overview.md)

---

## Implementation Status (Core Backend)

| Module | Backend API | Mobile |
|--------|-------------|--------|
| Authentication & Users | Done | Pending |
| Patient Management | Done | Pending |
| Doctor Management | Done | Pending |
| Appointments | Done | Pending |
| EHR | Done | Pending |
| Prescriptions | Done | Pending |
| Notifications | Done | Pending |
| Admin Portal | Done | Pending |

---

## Technology Stack

| Layer | Technologies |
|-------|------------|
| Mobile | React Native, Expo, TypeScript, Redux Toolkit, React Query |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Storage | AWS S3 (private buckets, signed URLs) |
| Authentication | JWT, Refresh Tokens, Role-Based Access Control |
| Infrastructure | Docker, Nginx, Ubuntu Server |
| API Docs | Swagger UI, OpenAPI Specification |

---

## Module 1: Authentication & User Management

### User Registration

- Patient registration
- Doctor registration
- Admin user creation (admin-only)

### Authentication

- Login
- Logout
- Password reset
- Refresh token flow

### Profile Management

- Personal information
- Profile photo
- Language preference

### Roles

| Role | Description |
|------|-------------|
| Admin | System administration, approvals, monitoring |
| Doctor | Consultations, prescriptions, patient care |
| Patient | Appointments, records, prescriptions |

---

## Module 2: Patient Management

### Patient Profile

- Personal information
- Date of birth
- Gender
- Blood group
- Emergency contact

### Medical Information

- Allergies
- Medical history
- Existing conditions

### Patient Search (Doctor / Admin)

- Search patients
- Filter patients
- View patient details

---

## Module 3: Doctor Management

### Doctor Profile

- Name
- Qualification
- Specialization
- Experience
- Consultation fee

### Doctor Availability

- Working hours
- Weekly schedule
- Leave management

### Doctor Dashboard

- Today's appointments
- Upcoming consultations
- Patient list

---

## Module 4: Appointment Management

### Appointment Booking (Patient)

- Doctor discovery
- Slot selection
- Appointment creation

### Appointment Tracking

- Upcoming appointments
- Completed appointments
- Appointment history

### Appointment Actions

- Confirm
- Reschedule
- Cancel
- Complete

### Appointment Statuses

| Status | Description |
|--------|-------------|
| Pending | Awaiting confirmation |
| Confirmed | Scheduled and confirmed |
| Completed | Consultation finished |
| Cancelled | Appointment cancelled |

---

## Module 5: Electronic Health Records (EHR)

### Medical Record Storage

- Prescriptions
- Diagnostic reports
- Lab reports
- X-Ray reports
- MRI reports
- CT Scan reports

### Document Operations

- Upload
- Download
- View
- Delete

### Supported File Types

- PDF
- JPG
- PNG
- DOCX

### S3 Storage Architecture

Private bucket with folder structure:

```
patients/
reports/
prescriptions/
xray/
mri/
ctscan/
```

---

## Module 6: Prescription Management

### Doctor Capabilities

- Create prescription
- Edit prescription
- Upload prescription document
- Share prescription with patient

### Patient Capabilities

- View prescription
- Download prescription
- Prescription history

---

## Module 7: Notification System

### Email Notifications

- Appointment confirmation
- Appointment reminder
- Prescription shared
- Report uploaded

### WhatsApp Notifications

- Appointment reminder
- Appointment status updates
- Follow-up reminders

---

## Module 8: Admin Management Portal

### Dashboard Analytics

- Total patients
- Total doctors
- Total appointments
- Total reports

### Management

- User management
- Doctor approval workflow
- Appointment monitoring
- Record monitoring

### System Administration

- Audit logs
- Activity tracking
- Usage reports

---

## Mobile Applications

### Patient App Screens

| Screen | Purpose |
|--------|---------|
| Login | Authentication |
| Registration | Patient signup |
| Dashboard | Overview and quick actions |
| Doctor Listing | Browse doctors |
| Doctor Details | View doctor profile and availability |
| Appointment Booking | Select slot and book |
| Appointments | Track upcoming and past appointments |
| Medical Records | View and manage EHR documents |
| Prescriptions | View prescription history |
| Profile | Personal settings and preferences |

### Doctor App Screens

| Screen | Purpose |
|--------|---------|
| Login | Authentication |
| Dashboard | Today's schedule and overview |
| Patient List | Access assigned / consulted patients |
| Appointment List | Manage appointments |
| Prescription Management | Create and manage prescriptions |
| Profile | Professional profile and settings |

---

## Security Features

### Authentication & Encryption

- JWT authentication with refresh tokens
- bcrypt password hashing
- HTTPS / SSL in production

### Storage Security

- Private S3 buckets
- Signed URLs for document access

### Audit Logging

- Login activity
- Record access activity
- Data modification tracking

---

# Phase 1B — Advanced Premium Features

> High-impact features to make the platform feel like Practo Premium, Apollo 24/7, or One Medical. **Not** a full AI platform — optional small OpenAI helpers listed below.

## Top 10 Premium Features (Build Priority)

| Priority | Feature | Category |
|----------|---------|----------|
| 1 | Family Health Management | Patient |
| 2 | Video Consultation | Appointment |
| 3 | Health Timeline | Patient + Doctor |
| 4 | Medication Reminders | Patient |
| 5 | Doctor Notes | Doctor |
| 6 | Follow-Up Management | Doctor |
| 7 | Digital Health Locker | Patient / EHR |
| 8 | Appointment Waitlist | Appointment |
| 9 | Personal Health Tracking | Patient |
| 10 | Multi-Clinic Support | Admin |

---

## Patient Features (Advanced)

### Family Health Management

- Add family members
- Manage parents/children profiles
- Book appointments for family members
- Shared family health records
- Family health dashboard

### Emergency Medical Profile

- Blood group (extends core profile)
- Allergies
- Chronic diseases
- Emergency contacts
- Medical ID card
- One-tap emergency access

### Health Timeline

- Medical history timeline
- Appointment timeline
- Prescription timeline
- Report timeline
- Doctor visit history

### Medication Management

- Medicine tracking
- Dosage tracking
- Medication reminders
- Missed dose tracking
- Medication history

### Digital Health Locker

- Secure medical record storage (extends EHR)
- Categorized reports
- Download history
- Record sharing
- Access logs

### Personal Health Tracking

- Blood pressure logs
- Blood sugar logs
- Weight tracking
- Heart rate tracking
- Oxygen level tracking

---

## Doctor Features (Advanced)

### Doctor Notes

- Consultation notes
- Diagnosis notes
- Follow-up notes
- Private notes
- Clinical observations

### Follow-Up Management

- Schedule follow-ups
- Follow-up reminders
- Follow-up tracking
- Follow-up history

### Doctor Analytics

- Daily appointments
- Monthly appointments
- Patient growth
- Consultation statistics
- Performance dashboard

### Patient History View

- Complete medical history
- Previous consultations
- Reports and prescriptions
- Timeline view

---

## Appointment Features (Advanced)

### Advanced Appointment Booking

- Smart slot management
- Recurring appointments
- Appointment waitlist
- Auto slot reallocation
- Quick rebooking

### Video Consultation

- Video calling
- In-call chat
- File sharing
- Consultation notes
- Call history

### Appointment Queue

- Live queue status
- Estimated waiting time
- Queue notifications

---

## Notification Features (Advanced)

### Notification Center

- Appointment reminders
- Medicine reminders
- Follow-up reminders
- Prescription notifications
- Medical report notifications

### Notification Preferences

- Push notifications
- Email notifications
- WhatsApp notifications
- SMS notifications

---

## EHR Enhancements

### Smart Medical Records

- Record categorization (extends core)
- Record tags
- Search records
- Filter records
- Version history

### Medical Document Sharing

- Secure share links
- Expiring links
- Doctor-to-doctor sharing
- Download tracking

---

## Admin Features (Advanced)

### Advanced Analytics

- Patient growth
- Doctor growth
- Appointment statistics
- Revenue insights
- Platform usage metrics

### Audit & Compliance

- User activity logs (extends audit_logs)
- Medical record access logs
- Doctor activity logs
- Security monitoring

### Multi-Clinic Support

- Multiple clinics
- Multiple branches
- Department management
- Staff management

---

## Phase 1 Optional — Small OpenAI Helpers

> Lightweight OpenAI integrations only. **Not** Phase 2 full AI platform.

| Helper | Description |
|--------|-------------|
| Medical Report Summary | Simplify uploaded reports for patients |
| Prescription Explanation | Explain medicines in simple language |
| Doctor Bio Generator | Generate professional doctor profiles |
| Search Assistant | Natural language search for records |

**Requirements:** OpenAI API key, rate limits, PHI handling policy, human review for clinical content.

---

## Phase 2: AI Features (Full Platform — Future)

> Built after successful Phase 1 deployment. Consumes patient history, medical records, prescriptions, appointment history, and doctor notes.

### AI Module 1: Symptom Analysis

- Text-based and voice-based symptom input
- Hindi and English support
- Symptom extraction, disease pattern matching, risk assessment
- Specialist recommendation with confidence scores

### AI Module 2: Generative Medical Assistant

- Medical Q&A, healthcare guidance, appointment assistance
- Prescription explanation
- Context-aware, history-aware, multi-language conversations

### AI Module 3: Medical Report Analyzer

- Lab report, prescription, and diagnostic report summarization
- Key findings extraction and risk identification
- Easy-to-understand summaries

### AI Module 4: Voice AI Assistant

- Speech-to-text and text-to-speech
- Voice appointment booking, symptom reporting, medical assistance

### AI Technology Stack

| Component | Technologies |
|-----------|--------------|
| Backend | Python, FastAPI |
| LLM | Ollama, Llama 3, Mistral |
| ML | Scikit-Learn, Transformers |
| Vector DB | Qdrant |
| Embeddings | BGE Large, Nomic Embed |
| RAG | LangChain, LlamaIndex |

---

## Database Entities

### Core Tables (Implemented)

- `users`, `roles`
- `patients`, `doctors`
- `appointments`
- `medical_records`, `prescriptions`
- `notifications`
- `audit_logs`
- `doctor_availability`, `doctor_leaves`
- `refresh_tokens`, `password_reset_tokens`

### Planned Tables (Phase 1B)

- `family_members`, `family_links`
- `emergency_profiles`, `medical_id_cards`
- `health_timeline_events`
- `medications`, `medication_schedules`, `medication_logs`
- `vital_signs` (BP, sugar, weight, heart rate, SpO2)
- `doctor_notes`
- `follow_ups`
- `appointment_waitlist`, `recurring_appointments`
- `video_sessions`, `video_session_messages`
- `appointment_queue`
- `notification_preferences`
- `record_tags`, `record_versions`, `record_share_links`
- `clinics`, `branches`, `departments`, `staff`

---

## API Documentation Requirements

All backend APIs documented via Swagger UI and OpenAPI, including:

- Request and response models
- Authentication requirements
- Error responses
- API examples
