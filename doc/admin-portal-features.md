# Enterprise Admin Portal - Feature Specification

This document outlines all required features for the Enterprise Healthcare Operations Control Center based on the Master Prompt.

## 1. Dashboard Module
*   **KPI Overview**: Total Users, Total Patients, Total Doctors, Pending Doctor Approvals, Active Appointments, Completed Appointments, Medical Records Count, Storage Usage.
*   **Recent Activities & System Health**: Live feeds and connectivity status.
*   **Analytics Charts**: User Growth, Doctor Growth, Appointment Trends, Record Upload Trends.

## 2. User Management
*   **Users Directory**: Search, filter, view details, activate/deactivate, delete, and trigger password resets.
*   **Patient Profiles**: List view, detailed view (Medical Info, Timeline, Appointments, Prescriptions, Records, Vitals, Medications).
*   **Doctor Profiles**: List view, detailed view (Availability, Appointments, Patients, Activity Logs).

## 3. Doctor Approvals
*   **Pending Queue**: Review applications, view credentials/documents, approve, or reject.
*   **Approval History**: Log of past application decisions.

## 4. Appointment Management
*   **Master Booking List**: Filters by Date, Doctor, Patient, Status.
*   **Categorized Views**: Upcoming, Completed, Cancelled.
*   **Actions**: Confirm, Reschedule, Cancel, Complete.
*   **Waitlist Control**: Queue management, priority adjustment, auto-allocation.

## 5. Medical Records (EHR) & File Manager
*   **Records List**: Patient, Record Type, Upload Date, File Type, Size.
*   **Actions**: Preview (PDF/Image/Document), Download, Delete, View Metadata.
*   **Categorization**: Reports, Prescriptions, X-Ray Images, MRI Reports, CT Scan Reports.
*   **Storage Explorer (Google Drive Style)**: Hierarchical folder view per patient.
*   **Upload & Storage Analytics**: Track uploaders, timestamp, total files, storage usage, download counts, and most accessed files.

## 6. Prescription & Medication Management
*   **Prescription List**: View, download, share, delete, and analytics.
*   **Active Medications**: Directory of ongoing patient prescriptions.
*   **Medication Logs**: Adherence tracking (Taken, Missed, Adherence Percentage).

## 7. Clinical Data (Timeline & Vitals)
*   **Health Timeline**: Unified patient view (Appointments + Records + Prescriptions + Medications + Vitals).
*   **Vital Signs**: Blood Pressure, Blood Sugar, Weight, Oxygen, Heart Rate tracking with historical trend charts.

## 8. Notifications & Auditing
*   **Notification Center**: Track appointment notifications, medication reminders, system alerts. Send, schedule, and retry logic. Template management.
*   **Audit Center**: Track login events, record views/downloads, profile updates, and admin actions.
*   **Security Logs**: Track system-level security events.

## 9. Analytics, Reports & API Explorer
*   **Analytics Dashboard**: User, Patient, Doctor, Appointment, Medication, Storage, and Platform analytics.
*   **API Explorer**: Dynamic list of all registered backend routes (Method, Route, Module, Auth Required, Description).
*   **API Usage Analytics**: Most used APIs, request counts, error rates.

## 10. Roles & System Settings
*   **RBAC Matrix**: Manage roles (Admin, Doctor, Patient) and granular permissions (View, Create, Edit, Delete, Approve).
*   **System Settings**: General, Security, Notification, Storage, Platform.

## 11. Core UI/UX Requirements
*   **Table Features**: Global Search, Pagination, Sorting, Column Filters, Export (CSV/Excel), Bulk Actions, Detail Drawers, Edit Modals, Delete Confirmations.
*   **Detail Pages**: Comprehensive multi-tab single page overviews for Patients and Doctors.
*   **Design Language**: Stripe/Linear/Supabase aesthetic. Clean, minimal, professional, data-rich.
