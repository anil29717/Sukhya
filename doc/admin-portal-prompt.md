# Healthcare Platform Admin Portal - Master Prompt

You are a Senior Product Architect, Enterprise SaaS Designer, Healthcare Platform Expert, and Staff Software Engineer.

Analyze my existing Healthcare Platform and build a complete enterprise-grade Admin Portal that provides full visibility, monitoring, management, auditing, and operational control over the entire healthcare ecosystem.

This is NOT a simple CRUD admin panel.

The goal is to create a Healthcare Operations Control Center similar to:

* Stripe Dashboard
* Linear
* Notion Admin
* Salesforce
* Supabase Dashboard
* Enterprise Hospital Management Systems

The admin should be able to monitor, manage, search, filter, audit, and control every entity, workflow, uploaded file, and business process from a single web application.

---

# EXISTING SYSTEM

The platform already contains:

* Authentication & RBAC
* Patients
* Doctors
* Doctor Approvals
* Appointments
* Appointment Waitlists
* Medical Records (EHR)
* Prescriptions
* Medications
* Medication Logs
* Health Timeline
* Vital Signs
* Notifications
* Audit Logs
* Digital Health Locker
* Admin Authentication

Build the Admin Portal around the existing system.
Do not remove existing functionality.

---

# SIDEBAR STRUCTURE

## Dashboard

### Overview

Show:
* Total Users
* Total Patients
* Total Doctors
* Pending Doctor Approvals
* Active Appointments
* Completed Appointments
* Medical Records Count
* Storage Usage
* Recent Activities
* System Health

Charts:
* User Growth
* Doctor Growth
* Appointment Trends
* Record Upload Trends

---

# User Management

## Users

Features:
* View Users
* Search Users
* Filter Users
* User Details
* Activate User
* Deactivate User
* Delete User
* Reset Password

## Patients

Features:
* Patient Listing
* Search Patients
* View Patient Details
* Medical Information
* Health Timeline
* Appointments
* Prescriptions
* Medical Records
* Medication History
* Vital Signs

## Doctors

Features:
* Doctor Listing
* Search Doctors
* Doctor Details
* Availability
* Appointments
* Patients
* Activity Logs

---

# Doctor Approvals

## Pending Approvals

Actions:
* View Application
* View Documents
* Approve
* Reject

## Approval History

---

# Appointment Management

## All Appointments

Actions:
* View
* Confirm
* Reschedule
* Cancel
* Complete

Filters:
* Date
* Doctor
* Patient
* Status

## Upcoming
## Completed
## Cancelled
## Waitlist Management

Manage:
* Waitlist Queue
* Priority
* Auto Allocation

---

# Medical Records (EHR)

## All Records

Show:
* Patient
* Record Type
* Upload Date
* File Type
* Size

Actions:
* Preview
* Download
* Delete
* View Metadata

## Reports
## Prescriptions
## X-Ray Images
## MRI Reports
## CT Scan Reports
## Upload Activity

Track:
* Who Uploaded
* When Uploaded
* Download Count

---

# Prescription Management

## Prescription List

Actions:
* View
* Download
* Share
* Delete

## Prescription Analytics

---

# Medication Management

## Active Medications
## Medication Logs

Track:
* Taken
* Missed
* Adherence Percentage

---

# Health Timeline

View complete patient timeline.

Include:
* Appointments
* Records
* Prescriptions
* Medications
* Vitals

---

# Vital Signs

## Vital Records

Show:
* Blood Pressure
* Blood Sugar
* Weight
* Oxygen Level
* Heart Rate

## Trends

Display charts and historical trends.

---

# Notification Center

## Notifications

Types:
* Appointment Notifications
* Medication Reminders
* System Notifications

Actions:
* Send
* Schedule
* Retry Failed

## Notification History
## Templates

---

# Audit Logs

## Audit Center

Track:
* Login Events
* Record Views
* Record Downloads
* Profile Updates
* Admin Actions

Filters:
* User
* Date
* Action Type

## Security Logs

---

# File Manager

Create a complete file management system.

## Storage Explorer

Like Google Drive.

Show:
Patient
├── Reports
├── Prescriptions
├── X-Rays
├── MRI
├── CT Scan

Actions:
* Preview
* Download
* Delete

Support:
* PDF Preview
* Image Preview
* Document Preview

## Storage Analytics

Show:
* Total Files
* Storage Usage
* Downloads
* Most Accessed Files

---

# Analytics & Reports

## User Analytics
## Patient Analytics
## Doctor Analytics
## Appointment Analytics
## Medication Analytics
## Storage Analytics
## Platform Analytics

Provide charts, reports, KPIs, and trends.

---

# API Explorer

Create a page where admins can see all registered routes.

Show:
* Method
* Route
* Module
* Authentication Required
* Description

Example:
GET /patients
POST /appointments
GET /medical-records

## API Usage Analytics

Show:
* Most Used APIs
* Request Counts
* Error Rates

---

# Roles & Permissions

## Roles
* Admin
* Doctor
* Patient

## Permissions

Manage:
* View
* Create
* Edit
* Delete
* Approve

Display RBAC Matrix.

---

# System Settings

## General Settings
## Security Settings
## Notification Settings
## Storage Settings
## Platform Settings

---

# IMPORTANT DETAIL PAGES

Create dedicated detail pages.

## Patient Detail Page

Tabs:
* Overview
* Profile
* Appointments
* Medical Records
* Prescriptions
* Medications
* Vital Signs
* Timeline
* Audit Logs
* Downloads

Admin should see everything related to that patient on a single page.

---

## Doctor Detail Page

Tabs:
* Overview
* Profile
* Availability
* Appointments
* Patients
* Activity Logs
* Performance

Admin should see everything related to that doctor on a single page.

---

# TABLE REQUIREMENTS

Every table must support:
* Search
* Pagination
* Sorting
* Column Filters
* Export CSV
* Export Excel
* Bulk Actions
* Detail Drawer
* Edit Modal
* Delete Confirmation

---

# UI REQUIREMENTS

Design Style:
* Enterprise SaaS
* Premium Healthcare Platform
* Clean
* Minimal
* Professional
* Data Rich

References:
* Stripe Dashboard
* Linear
* Supabase
* Salesforce
* Modern Healthcare Platforms

---

# TECHNICAL REQUIREMENTS

Create a dedicated Admin module:

```text
src/
└── admin/
    ├── dashboard/
    ├── users/
    ├── patients/
    ├── doctors/
    ├── approvals/
    ├── appointments/
    ├── medical-records/
    ├── prescriptions/
    ├── medications/
    ├── timeline/
    ├── vitals/
    ├── notifications/
    ├── audit-logs/
    ├── file-manager/
    ├── analytics/
    ├── api-explorer/
    ├── roles/
    ├── settings/
    ├── components/
    ├── layouts/
    ├── services/
    └── routes/
```

---

# DELIVERABLES

Generate:
1. Complete Admin Portal Sitemap
2. Sidebar Structure
3. All Pages & Subpages
4. User Flows
5. Detail Page Designs
6. Table Structures
7. Filters & Search Logic
8. Admin Actions
9. RBAC Matrix
10. API Integration Mapping
11. Folder Structure
12. Component Architecture
13. Responsive Layout Design
14. Enterprise Dashboard Design
