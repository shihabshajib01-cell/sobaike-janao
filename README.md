# Sobaike Janao (সবাইকে জানাও)

**Sobaike Janao (সবাইকে জানাও)** is a civic reporting and public awareness platform for Bangladesh. The platform enables citizens to securely submit incident complaints with supporting evidence, view published and moderated public reports, and explore incident data across districts and interactive maps.

---

## 🏛️ Architecture Overview

The public application is built as a high-performance modern web application utilizing **React, TypeScript, Vite, and Supabase**:

* **Frontend**: React 19 with TypeScript, Tailwind CSS, Lucide Icons, and responsive design for mobile, tablet, and desktop.
* **Backend & Database**: Supabase PostgreSQL database with Row-Level Security (RLS) and stored PostgreSQL functions (RPCs).
* **Complaint Submission Pipeline**:
  - Anonymous public writes are routed through the `public-write-gateway` Edge Function; direct public mutation RPC execution is revoked.
  - Client submission IDs and database guards keep public intake duplicate-safe.
  - Evidence is accepted through the dedicated `public-evidence-upload` Edge Function, decoded/validated as WebP, stripped of EXIF/GPS/XMP/ICC/unknown metadata, and stored in the private `complaint-evidence` bucket.
  - Public evidence registration helpers are not exposed as direct browser RPCs.
* **Public Incident Feeds & Exploration**:
  - `PublicReportService` loads sanitized published reports from controlled public RPCs.
  - Bangladesh-only Leaflet map with 8 divisions, 64 districts, and all 601 canonical upazila/thana choices. Verified local polygon assets are loaded lazily; missing polygons are disclosed rather than fabricated.
  - Search and filters support incident details, division, district, upazila/thana where available, and subject.
* **Bilingual Support**: Comprehensive Bengali (বাংলা) and English interface switching.
* **Theming**: System, light, and dark theme support.
* **Location Privacy**: Browse sessions do not persist precise device coordinates. Approximate IP-derived location is used only through the first-party server boundary for nearby-content behavior. Precise device GPS used for report submission is private and is automatically scrubbed after moderation or after the configured maximum retention window.
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


---

## 🔐 Security & Operations

Security-sensitive changes must preserve the existing public write gateway, RLS, private evidence storage, server-side evidence sanitization, live Admin session validation, AAL2 gates, and Public → SQL → Admin sync contract.

Automated release checks include dependency validation, full Git-history secret scanning, evidence metadata sanitization, security-hardening invariants, accessibility audits, Public functional/browser regression, and live production smoke tests.

Operational procedures and external-infrastructure responsibilities are documented in [docs/security-operations-runbook.md](docs/security-operations-runbook.md). The public vulnerability-reporting entry point is `/.well-known/security.txt`.

Do not commit service-role credentials, database passwords, private backup files, reporter evidence, or other production secrets/data to this repository.
