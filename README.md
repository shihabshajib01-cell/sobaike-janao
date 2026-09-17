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

## 📋 Reporting Categories

The public platform currently supports seven top-level reporting categories. The live taxonomy and subcategory definitions in the application remain the source of truth for the detailed reporting options shown to users.

1. **Harassment & Abuse (হয়রানি ও নির্যাতন)** — harassment, abuse, exploitation, deception, and related digital or interpersonal incidents.
2. **Extortion & Bribery (চাঁদাবাজি ও ঘুষ)** — extortion, coercive demands, bribery, and related incidents.
3. **Public Safety (জননিরাপত্তা)** — public-safety incidents such as theft, robbery, snatching, mob violence, and other supported safety reports.
4. **Road & Transport Issues (সড়ক ও যাতায়াত সমস্যা)** — road, traffic, transport, accident, obstruction, and supported mobility issues.
5. **Utility Issues (ইউটিলিটি সমস্যা)** — load shedding, gas shortages, electricity-billing issues, and other supported utility reports.
6. **Illegal Occupation (অবৈধ দখল)** — illegal occupation of roads, footpaths, public spaces, private property, or government property where supported by the reporting taxonomy.
7. **Illegal Auto-Rickshaw Charging (অবৈধ অটো চার্জিং)** — illegal or unsafe auto-rickshaw charging locations and related supported incidents.

`SECTIONS`, the taxonomy service, and the reporting option data in `src/` should be consulted before changing category names, IDs, routes, or subcategory behavior.

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
