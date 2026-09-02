# Sobaike Janao (সবাইকে জানাও)

**Sobaike Janao (সবাইকে জানাও)** is a civic reporting and public awareness platform for Bangladesh. The platform enables citizens to securely submit incident complaints with supporting evidence, view published and moderated public reports, and explore incident data across districts and interactive maps.

---

## 🏛️ Architecture Overview

The public application is built as a high-performance modern web application utilizing **React, TypeScript, Vite, and Supabase**:

* **Frontend**: React 19 with TypeScript, Tailwind CSS, Lucide Icons, and responsive design for mobile, tablet, and desktop.
* **Backend & Database**: Supabase PostgreSQL database with Row-Level Security (RLS) and stored PostgreSQL functions (RPCs).
* **Complaint Submission Pipeline**:
  - Secure intake via `submit_public_complaint` RPC.
  - Client-side idempotency keys ensuring duplicate-safe submissions.
  - Client-side WebP image compression before upload.
  - Private evidence storage in Supabase Storage (`complaint-evidence` bucket) registered via `register_public_complaint_evidence` RPC.
* **Public Incident Feeds & Exploration**:
  - `PublicReportService` loads published reports from Supabase.
  - Interactive Leaflet-powered incident map with district clustering and geolocation filtering.
  - Search by incident details, division, district, and subject.
* **Bilingual Support**: Comprehensive Bengali (বাংলা) and English interface switching.
* **Theming**: System, light, and dark theme support.
* **Visitor Location Consent**: Optional consented visitor location/session collection through Supabase for operational Location Activity.
* **Deployment**: Optimized for static hosting and GitHub Pages with subpath-aware asset routing.

---

## 📋 Reporting Segments

The public platform supports three incident reporting segments:

### 1. Harassment & Violence (হয়রানি ও সহিংসতা)
* Rape / Sexual Violence (ধর্ষণ)
* Sexual Harassment (যৌন হয়রানি)
* Domestic Violence (পারিবারিক সহিংসতা)
* Blackmailing (ব্ল্যাকমেইলিং)
* Honeytrap (হানিট্র্যাপ)

### 2. Battery Rickshaw & Charging Hazards (ব্যাটারি রিকশা ও চার্জিং ঝুঁকি)
* Illegal / Hazardous Charging Station (অবৈধ বা অনিরাপদ চার্জিং স্টেশন)

### 3. Extortion & Coercion (চাঁদাবাজি ও জবরদস্তি)
* Extortion from Shops & Businesses (দোকান ও ব্যবসা প্রতিষ্ঠানে চাঁদা দাবি)
* Extortion in Transport & Transit (পরিবহন বা চলাচলে চাঁদা দাবি)
* Construction & Property Extortion (নির্মাণ/সম্পত্তি সংক্রান্ত চাঁদা দাবি)
* Threats & Coercive Demands (হুমকি দিয়ে টাকা দাবি)
* Other Extortion (অন্যান্য চাঁদাবাজি)

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
