# Sobaike Janao (সবাইকে জানাও)

**Sobaike Janao (সবাইকে জানাও)** is a civic reporting and public awareness platform for Bangladesh covering harassment, extortion, and transportation irregularities. The platform enables citizens to securely submit incident complaints with supporting evidence, view published and moderated public reports, and explore incident data across districts and interactive maps.

---

## 🏛️ Architecture Overview

The public application is built as a high-performance modern web application utilizing **React, TypeScript, Vite, and Supabase**:

* **Frontend**: React 18 with TypeScript, Tailwind CSS, Lucide Icons, and responsive design for mobile, tablet, and desktop.
* **Backend & Database**: Supabase PostgreSQL database with Row-Level Security (RLS) and stored PostgreSQL functions (RPCs).
* **Complaint Submission Pipeline**:
  - Secure intake via `submit_public_complaint` RPC.
  - Client-side idempotency keys ensuring duplicate-safe submissions.
  - Client-side WebP image compression before upload.
  - Private evidence storage in Supabase Storage (`complaint-evidence` bucket) registered via `register_public_complaint_evidence` RPC.
* **Public Incident Feeds & Exploration**:
  - `PublicReportService` loads published and editorial-reviewed incident reports directly from Supabase with fallback capability.
  - Interactive Leaflet-powered incident map with district clustering and geolocation filtering.
  - Search by incident details, division, district, and subject.
* **Bilingual Support**: Comprehensive Bengali (বাংলা) and English interface switching.
* **Theming**: System, light, and dark theme support.
* **Visitor Location Consent**: Optional privacy-preserving browser geolocation to surface relevant local area reports.
* **Deployment**: Optimized for static hosting and GitHub Pages with subpath-aware asset routing.

---

## 📋 Reporting Segments

1. **Harassment (হয়রানি)**: Public transport, street, workplace, institutional, and digital harassment.
2. **Rickshaw Fare & Battery Safety (অটো-রিকশা ও রিকশা)**: Arbitrary overcharging, meter refusal, battery-charging fire hazards, and reckless driving.
3. **Extortion (চাঁদাবাজি)**: Street-level extortion, merchant extortion, transport syndicate collections, and neighborhood intimidation.

---

## 🚀 Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# Optional Google Maps API Key for location picker
VITE_GOOGLE_MAPS_API_KEY=
```

---

## 🛠️ Development & Build

### Development
```bash
npm run dev
```
Starts the Vite local development server.

### Code Validation & Linting
```bash
npm run lint
```
Runs TypeScript validation and checks for errors.

### Production Build
```bash
npm run build
```
Generates production static assets in the `dist/` directory ready for deployment.
