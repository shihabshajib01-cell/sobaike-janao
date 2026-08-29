# Sobaike Janao (সবাইকে জানাও)

**Sobaike Janao (সবাইকে জানাও)** is a civic reporting and public awareness platform for Bangladesh covering harassment, extortion, and transportation irregularities. The platform enables citizens to securely submit incident reports, track editorial progress via Report ID and 6-digit PIN, and review verified public incident feeds, district registries, and interactive maps.

---

## 🏛️ Architecture Overview (Phase 8 Backend Integration)

The application operates as a **full-stack Express + React application** where the backend SQLite database is the **sole source of truth** for all submitted, moderated, published, and response records.

* **Backend**: Node.js + Express with TypeScript, Cookie-Only JWT authentication, bcrypt PIN & password hashing, and rate limiting.
* **Database**: Persistent relational JSON storage in `./.data/sobaike_store.json` (pure TypeScript storage engine).
* **Frontend**: React 18 with Vite, Tailwind CSS, Lucide Icons, and React Router.
* **Privacy & Isolation**: Strict server-side separation between private citizen submissions (`report_submissions`) and sanitized public versions (`public_versions`).
* **Zero Client-Side Mock Runtime**: All public feeds, segment pages, exploration maps, search queries, location views, subject entity profiles, and report details are served directly by `GET /api/public/*` backend endpoints.

---

## 🔒 Security & Privacy Guarantees

1. **Zero Dual-Data System**:
   * All reports, statuses, moderation events, clarifications, public versions, and responses are persisted directly in SQLite.
   * `localStorage` is strictly restricted to unsaved report drafts and user UI preferences (language/theme).
   * Frontend public screens use `PublicReportService` to asynchronously consume backend SQLite data with bilingual loading, error-recovery, and empty states.

2. **Server-Enforced Public / Private Separation**:
   * Private fields (reporter contact info, private coordinates, raw private incident details, admin-only identifiers) are strictly filtered out by backend controllers.
   * Public endpoints query `public_versions` joined with safe submission attributes only when `status = 'published'`.
   * If a reporter selected `anonymous` or `admin_only`, the server rejects any attempt to expose reporter identity publicly.

3. **Report Tracking Security**:
   * Report IDs (`SJ-YYYY-XXXXXX`) are paired with random 6-digit PINs.
   * PINs are hashed using bcrypt with salt rounds before database persistence. Plaintext PINs are never stored in the database or returned in tracking endpoints.
   * Track Report endpoints and Admin Login endpoints are protected by memory-backed rate limiters.

4. **Cookie-Only Admin Authentication**:
   * Admin routes require valid HTTP-Only cookies (`admin_token`).
   * No JWT tokens are returned in login response bodies or persisted in frontend `localStorage`.
   * Passwords use salted bcrypt verification.

---

## 🗄️ Database Schema & Relational Tables

The SQLite database defines the following relational tables with foreign key constraints enabled:

* `admin_users`: Credentials and role-based access for editorial administrators.
* `report_submissions`: Complete intake record of submitted reports with bcrypt-hashed PIN.
* `public_versions`: Sanitized editorial version for public search, feed, and mapping.
* `clarification_requests`: Thread of info requests from admins to reporters and reporter responses.
* `moderation_events`: Immutable audit trail of every moderation lifecycle transition and editorial action.
* `subject_responses`: Official institutional statements from named subjects or organizations.
* `related_reports`: Bi-directional links between connected incident reports.
* `schema_migrations`: Version tracking table for schema migrations.

---

## 🚀 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
ALLOWED_ORIGIN=

# Authentication & Security Secrets
JWT_SECRET=your_secure_jwt_secret_key_here
ADMIN_EMAIL=admin@sobaikejanao.org
ADMIN_INITIAL_PASSWORD=your_initial_admin_password_here

# Database & Storage
SQLITE_DB_PATH=./data/sobaike_janao.db
PRIVATE_UPLOAD_DIR=./data/private-uploads

# Optional Client Environment Variables
VITE_GOOGLE_MAPS_API_KEY=
```

---

## 🛠️ Running the Application

### Development
```bash
npm run dev
```
Starts the Express server on port `3000` with integrated Vite middleware and SQLite database auto-initialization.

### Production Build
```bash
npm run build
npm start
```
Compiles client assets via Vite and bundles `server.ts` into a CommonJS server in `dist/server.cjs`.
