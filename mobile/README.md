# Lumina Health — Mobile App (Patient + Doctor)

Expo SDK 55 application wired to the FastAPI backend.

## Quick Start

```powershell
cd mobile
npm install --legacy-peer-deps
npm start
```

Set your API URL in `.env` or `app.json`:

```
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api/v1
```

Default fallback: `localhost:8000` (web) or Expo dev host IP (device).

## Test Credentials

- Patient: `patient@example.com` / `Password123`
- Doctor: `doctor@example.com` / `Password123`

## Navigation (Doctor)

| Tab | Screen |
|-----|--------|
| Dashboard | Stats, today's schedule, quick actions, notifications |
| Appointments | Today / Upcoming / Completed / Cancelled |
| Patients | Search directory → full clinical profile |
| Schedule | Availability hours, leave management, calendar |
| Profile | Professional info, analytics, settings, logout |

## Doctor Stack Screens

- Appointment detail (confirm, complete, cancel, reschedule)
- Patient profile (overview, medical, records, Rx, meds, vitals, timeline, notes)
- Create prescription / clinical note
- Follow-up management
- Performance analytics
- Record preview (PDF/image)

Login as `doctor@example.com` / `Password123` after seeding demo data.

## Navigation (Patient)

| Tab | Screen |
|-----|--------|
| Home | Dashboard — appointments, meds, vitals, timeline preview |
| Doctors | Search, filter, profile, book |
| Records | Digital locker — upload, categories, preview |
| Timeline | Unified health timeline |
| Profile | Account hub → settings, family, medical info |

## Stack Screens

- Appointments (upcoming / completed / cancelled / waitlist)
- Booking wizard + success
- Prescriptions, medications, vitals
- Notifications, family management
- File preview (PDF/image with auth download)

## Backend

Start the API from `backend/`:

```powershell
cd backend
venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger: http://localhost:8000/docs

## Design System

- Theme: `theme/lumina.ts` (light + dark via `useLuminaTheme`)
- Components: `components/lumina/` — buttons, empty states, skeletons, success screens
- Animations: `react-native-reanimated` on tabs and pressables
