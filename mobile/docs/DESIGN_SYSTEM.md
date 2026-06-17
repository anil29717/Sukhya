# Lumina Health — Design System (2026)

Premium mobile design system for the Lumina healthcare platform. Visual and UX layer only — no API or route changes.

---

## 1. Design Audit (Before → After)

| Area | Issue | Fix |
|------|-------|-----|
| **Color** | Mixed legacy navy/teal, heavy borders | Semantic tokens: primary blue, soft teal, emerald accent |
| **Typography** | Flat hierarchy, cramped headers | Hero/display scale, overline labels, improved line-height |
| **Cards** | Border-heavy Material look | Elevated surfaces + subtle shadows |
| **Navigation** | Inconsistent tab bars | Unified BottomNav / DoctorBottomNav with haptics + spring |
| **Doctor profile** | 9 tabs — cognitive overload | 5 tabs: Overview · Clinical · Records · Timeline · More |
| **Records filter** | X-Ray/MRI/CT sent invalid API types | Client-side `recordCategories` mapping |
| **Notifications** | Emoji icons, flat list | `NotificationItem` with Ionicons, unread styling |
| **Search** | Instant API on every keystroke | `useDebouncedValue` + `SearchBar` |
| **Logout (doctor)** | Token clear only, broken nav | Shared `performLogout()` |
| **Empty/loading** | Spinners, plain text | Skeleton loaders + premium `EmptyState` |
| **Notes input** | Multiline clipped | Auto-growing `LuminaInput` |
| **Accessibility** | Small touch targets | 44px minimum via `LuminaTouch.minTarget` |

---

## 2. Color Palette

### Light mode

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2563EB` | CTAs, active nav, links |
| `primarySoft` | `#EFF6FF` | Unread notifications, avatars |
| `secondary` | `#0D9488` | Medical accents, specialty labels |
| `secondarySoft` | `#F0FDFA` | Icon backgrounds |
| `accent` | `#059669` | Success highlights, health score |
| `success` | `#22C55E` | Confirmations |
| `warning` | `#F59E0B` | Reminders |
| `error` | `#EF4444` | Destructive actions |
| `background` | `#FFFFFF` | Screen base |
| `surface` | `#F8FAFC` | Grouped content |
| `surfaceElevated` | `#FFFFFF` | Cards on white |
| `text` | `#0B1220` | Primary copy |
| `textSecondary` | `#475569` | Supporting copy |
| `textMuted` | `#94A3B8` | Timestamps, hints |

### Dark mode

Premium healthcare dark theme in `LuminaColorsDark` — deep slate backgrounds, softened primary, reduced shadow opacity.

Legacy aliases (`navy`, `accentTeal`, etc.) map to semantic tokens for backward compatibility.

---

## 3. Typography Scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `hero` | 34 | 700 | Marketing moments |
| `display` | 28 | 700 | Screen titles (Find care, Health Locker) |
| `h1` | 26 | 700 | Section heroes |
| `h2` | 20 | 600 | Card titles, headers |
| `h3` | 17 | 600 | List item titles |
| `body` | 16 | 400 | Primary reading |
| `bodySmall` | 14 | 400 | Secondary reading |
| `label` | 13 | 500 | Form labels, metadata |
| `overline` | 11 | 600 | Section labels (uppercase) |
| `caption` | 11 | 600 | Badges, chips |

---

## 4. Spacing & Radius

- **Spacing:** `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 20 · `xxl` 24 · `xxxl` 32
- **Radius:** `sm` 10 · `md` 14 · `lg` 18 · `xl` 24 · `xxl` 28 · `full` pill

---

## 5. Component Library

| Component | Path | Notes |
|-----------|------|-------|
| `LuminaButton` | `components/lumina/LuminaButton.tsx` | primary/secondary/outline/ghost/danger, haptics |
| `LuminaInput` | same | Auto-growing multiline for notes |
| `LuminaChip` | same | Filter pills |
| `StatusBadge` | same | Appointment/prescription status |
| `LuminaCard` | `LuminaCard.tsx` | `elevated` prop for shadow cards |
| `SearchBar` | `SearchBar.tsx` | Debounced search companion |
| `EmptyState` | `EmptyState.tsx` | Icon + title + message + optional CTA |
| `LoadingSkeleton` | `ErrorState.tsx` | Pulsing skeleton rows |
| `MetricCard` / `TabBar` | `MetricCard.tsx` | Dashboard metrics + pill tabs |
| `BottomNav` | `BottomNav.tsx` | Patient tab bar |
| `DoctorBottomNav` | `DoctorBottomNav.tsx` | Doctor tab bar |
| `ScreenHeader` | `ScreenHeader.tsx` | Back + title + action |
| `FamilySwitcher` | `FamilySwitcher.tsx` | Profile context switching |
| `HealthScoreCard` | `HealthScoreCard.tsx` | Client-side health score |
| `QuickInsights` | `QuickInsights.tsx` | Dashboard insight widgets |
| `NotificationItem` | `NotificationItem.tsx` | Healthcare icons, read/unread |
| `SectionLabel` | `SectionLabel.tsx` | Overline section headers |

---

## 6. Motion Guidelines

| Token | Value | Use |
|-------|-------|-----|
| `springSnappy` | damping 22, stiffness 320 | Tab press scale |
| `spring` | damping 18, stiffness 220 | Card reveal |
| `durationFast` | 150ms | Micro feedback |
| `durationNormal` | 250ms | Screen transitions |
| `durationSlow` | 400ms | Skeleton pulse |

**Principles:**
- Subtle only — no bounce-heavy animations
- Haptic `light` on primary taps (`utils/haptics.ts`)
- Pull-to-refresh on lists and dashboards
- Skeleton loaders instead of spinners where possible
- Avoid layout shift — reserve space for loading states

---

## 7. Patient Experience

### Home dashboard
- Time-based greeting via `getTimeGreeting()`
- `FamilySwitcher` for dependent context
- `HealthScoreCard` (profile + activity, client-side)
- `QuickInsights` widgets
- Elevated appointment card, medication reminders, timeline preview

### Doctor discovery
- Premium doctor cards with dual CTAs: **Book** + **Profile**
- `SearchBar` + specialty chips
- `flex: 1` list layout

### Health locker (Records)
- Category chips with correct API mapping (`utils/recordCategories.ts`)
- Bottom sheet upload with title, description, type, file picker
- Document-type icons per record

### Notifications
- Ionicons by event type
- Unread: primary soft background + dot
- Tap to dismiss (mark read)

---

## 8. Doctor Experience

### Dashboard
- Linear/Stripe-inspired metric grid
- Today's schedule timeline with time pills
- Quick actions grid + prescription CTA

### Patients
- Debounced search (300ms)
- Initials avatars, elevated cards

### Patient profile IA
| Tab | Content |
|-----|---------|
| Overview | Contact, emergency |
| Clinical | Conditions, meds, vitals, Rx |
| Records | Medical documents |
| Timeline | Health events |
| More | Appointments, clinical notes |

### Notes
- Multiline `LuminaInput` with auto-grow
- Improved readability (line-height 22)

---

## 9. Accessibility

- **Touch targets:** minimum 44×44 (`LuminaTouch.minTarget`)
- **Contrast:** WCAG AA on text/background pairs
- **Screen readers:** `accessibilityRole`, `accessibilityLabel`, `accessibilityState` on tabs and buttons
- **Font scaling:** Typography uses relative sizes; avoid fixed heights on text containers
- **Focus order:** Header → content → primary action

---

## 10. Premium UX (No Backend Changes)

| Feature | Implementation |
|---------|----------------|
| Health score | `computeHealthScore()` from profile, vitals, records, meds |
| Quick insights | Last visit, active meds, next appointment |
| Family switcher | `useActivePatient` + family API |
| Smart widgets | Conditional cards on home based on query data |
| Debounced search | `useDebouncedValue` hook |

---

## File Reference

```
mobile/theme/lumina.ts          — Design tokens
mobile/theme/useLuminaTheme.ts  — Light/dark hook
mobile/utils/haptics.ts         — Haptic feedback
mobile/utils/session.ts         — performLogout()
mobile/utils/recordCategories.ts — Record filter mapping
mobile/hooks/useDebouncedValue.ts
```

---

*Lumina Health · 2026 Premium Design System*
