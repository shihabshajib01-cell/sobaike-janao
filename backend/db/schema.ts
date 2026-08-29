import type { IDatabase } from './database';
import bcrypt from 'bcryptjs';
import { SEED_SUBMITTED_REPORTS, SEED_SUBJECT_RESPONSES } from '../../src/data/seedSubmissions';
import { MOCK_REPORTS } from '../../src/data/mockReports';

export const CURRENT_DB_VERSION = 5;

const DEFAULT_PIN_HASH = bcrypt.hashSync('123456', 4);

const MOCK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'rep-harass-01': { lat: 23.8069, lng: 90.3687 },
  'rep-rickshaw-01': { lat: 23.7550, lng: 90.3600 },
  'rep-extortion-01': { lat: 22.3580, lng: 91.8390 },
  'rep-harass-02': { lat: 23.7461, lng: 90.3742 },
  'rep-rickshaw-02': { lat: 23.8720, lng: 90.3980 },
  'rep-extortion-02': { lat: 23.7510, lng: 90.3640 },
  'rep-harass-03': { lat: 24.8949, lng: 91.8687 },
  'rep-rickshaw-03': { lat: 23.7110, lng: 90.4350 },
  'rep-extortion-03': { lat: 24.3636, lng: 88.6000 },
  'rep-harass-04': { lat: 22.3590, lng: 91.8210 },
  'rep-rickshaw-04': { lat: 22.8120, lng: 89.5600 },
  'rep-extortion-04': { lat: 23.7570, lng: 90.3890 },
  'rep-harass-05': { lat: 23.8690, lng: 90.3980 },
  'rep-rickshaw-05': { lat: 24.8990, lng: 91.8710 },
  'rep-extortion-05': { lat: 22.6850, lng: 90.3540 },
};

export function initSchemaAndSeed(db: IDatabase): void {
  // 1. Migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Helper to check applied migrations
  const isMigrationApplied = (v: number): boolean => {
    const row = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(v);
    return Boolean(row);
  };

  const recordMigration = (v: number, name: string) => {
    db.prepare(`
      INSERT OR REPLACE INTO schema_migrations (version, name, applied_at)
      VALUES (?, ?, ?)
    `).run(v, name, new Date().toISOString());
  };

  // 2. Migration 1: Base Application Schema
  if (!isMigrationApplied(1)) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL,
        last_login_at TEXT
      );

      CREATE TABLE IF NOT EXISTS report_submissions (
        id TEXT PRIMARY KEY,
        internal_id TEXT,
        pin_hash TEXT NOT NULL,
        segment TEXT NOT NULL,
        subcategory_id TEXT NOT NULL,
        subcategory_bn TEXT NOT NULL,
        subcategory_en TEXT NOT NULL,
        title TEXT NOT NULL,
        reported_subject TEXT,
        subject_type TEXT NOT NULL DEFAULT 'individual',
        role_or_designation TEXT,
        organization TEXT,
        public_profile_handle TEXT,
        identifying_description TEXT,
        incident_date TEXT NOT NULL,
        incident_time TEXT,
        frequency TEXT NOT NULL DEFAULT 'one-time',
        relationship_context TEXT,
        intimate_what_happened TEXT,
        intimate_platform TEXT,
        description TEXT NOT NULL,
        location_json TEXT NOT NULL,
        has_supporting_info INTEGER NOT NULL DEFAULT 0,
        evidence_types_json TEXT,
        evidence_description TEXT,
        privacy_choice TEXT NOT NULL DEFAULT 'anonymous',
        admin_contact_json TEXT,
        publication_preferences_json TEXT,
        status TEXT NOT NULL DEFAULT 'submitted',
        status_bn TEXT NOT NULL,
        status_en TEXT NOT NULL,
        unpublish_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_submissions_status ON report_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_submissions_segment ON report_submissions(segment);
      CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON report_submissions(created_at);

      CREATE TABLE IF NOT EXISTS public_versions (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL,
        title_bn TEXT NOT NULL,
        title_en TEXT NOT NULL,
        short_description_bn TEXT NOT NULL,
        short_description_en TEXT NOT NULL,
        full_description_bn TEXT NOT NULL,
        full_description_en TEXT NOT NULL,
        subject_visibility TEXT NOT NULL DEFAULT 'hidden',
        reported_subject_bn TEXT,
        reported_subject_en TEXT,
        subject_type TEXT DEFAULT 'individual',
        organization_visibility TEXT NOT NULL DEFAULT 'hidden',
        organization TEXT,
        location_visibility TEXT NOT NULL DEFAULT 'hidden',
        location_bn TEXT NOT NULL,
        location_en TEXT NOT NULL,
        district_bn TEXT,
        district_en TEXT,
        area_bn TEXT,
        area_en TEXT,
        approved_coordinates_json TEXT,
        evidence_visibility TEXT NOT NULL DEFAULT 'hidden',
        evidence_summary_bn_json TEXT,
        evidence_summary_en_json TEXT,
        reporter_identity_visibility TEXT NOT NULL DEFAULT 'hidden',
        public_reporter_name TEXT,
        incident_date_bn TEXT NOT NULL,
        incident_date_en TEXT NOT NULL,
        is_high_urgency INTEGER NOT NULL DEFAULT 0,
        public_attachment_ids_json TEXT DEFAULT '[]',
        prepared_at TEXT NOT NULL,
        approved_at TEXT,
        published_at TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES report_submissions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_public_versions_report_id ON public_versions(report_id);

      CREATE TABLE IF NOT EXISTS clarification_requests (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        message TEXT NOT NULL,
        requested_fields_json TEXT,
        reporter_response TEXT,
        created_at TEXT NOT NULL,
        responded_at TEXT,
        resolved_at TEXT,
        FOREIGN KEY (report_id) REFERENCES report_submissions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_clarifications_report_id ON clarification_requests(report_id);

      CREATE TABLE IF NOT EXISTS subject_responses (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        report_title TEXT,
        responder_type TEXT NOT NULL,
        responder_name TEXT NOT NULL,
        contact_email_or_phone TEXT NOT NULL,
        contact_info TEXT,
        organization_name TEXT,
        designation TEXT,
        official_statement TEXT NOT NULL,
        supporting_documents_note TEXT,
        supporting_documents_summary_json TEXT,
        request_correction_or_removal INTEGER DEFAULT 0,
        correction_details TEXT,
        status TEXT NOT NULL DEFAULT 'pending_editorial_review',
        rejection_reason TEXT,
        created_at TEXT NOT NULL,
        published_at TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES report_submissions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_responses_report_id ON subject_responses(report_id);
      CREATE INDEX IF NOT EXISTS idx_responses_status ON subject_responses(status);

      CREATE TABLE IF NOT EXISTS moderation_events (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        action TEXT NOT NULL,
        action_bn TEXT NOT NULL,
        action_en TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT,
        note TEXT,
        actor TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES report_submissions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_moderation_report_id ON moderation_events(report_id);

      CREATE TABLE IF NOT EXISTS related_reports (
        id TEXT PRIMARY KEY,
        report_a_id TEXT NOT NULL,
        report_b_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_related_a ON related_reports(report_a_id);
      CREATE INDEX IF NOT EXISTS idx_related_b ON related_reports(report_b_id);
    `);
    recordMigration(1, 'base_schema');
  }

  // 3. Migration 2: Media Attachments & DB Idempotency
  if (!isMigrationApplied(2)) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS report_attachments (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        storage_key TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        size_bytes INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES report_submissions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_attachments_report_order ON report_attachments(report_id, sort_order);

      CREATE TABLE IF NOT EXISTS submission_idempotency (
        key_hash TEXT PRIMARY KEY,
        report_id TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (report_id) REFERENCES report_submissions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_idempotency_report ON submission_idempotency(report_id);
    `);

    try {
      const pvColumns = db.prepare(`PRAGMA table_info(public_versions)`).all() as { name: string }[];
      if (!pvColumns.some((col) => col.name === 'public_attachment_ids_json')) {
        db.exec(`ALTER TABLE public_versions ADD COLUMN public_attachment_ids_json TEXT DEFAULT '[]'`);
      }
    } catch (_e) {
      // Column already exists or created freshly
    }

    recordMigration(2, 'attachments_and_idempotency');
  }

  // 4. Migration 3: Mentioned Parties in Submissions
  if (!isMigrationApplied(3)) {
    try {
      const subColumns = db.prepare(`PRAGMA table_info(report_submissions)`).all() as { name: string }[];
      if (!subColumns.some((col) => col.name === 'mentioned_parties_json')) {
        db.exec(`ALTER TABLE report_submissions ADD COLUMN mentioned_parties_json TEXT`);
      }
    } catch (_e) {
      // Column already exists or created freshly
    }

    recordMigration(3, 'mentioned_parties_support');
  }

  // Migration 4: Seed/Update all 15 public mock reports across Harassment, Rickshaw Fare, and Extortion
  if (!isMigrationApplied(4)) {
    console.log('[Database] Applying migration 4: sync_all_15_mock_reports...');
    const upsertSub = db.prepare(`
      INSERT OR REPLACE INTO report_submissions (
        id, internal_id, pin_hash, segment, subcategory_id, subcategory_bn, subcategory_en,
        title, reported_subject, subject_type, role_or_designation, organization,
        public_profile_handle, identifying_description, incident_date, incident_time,
        frequency, relationship_context, intimate_what_happened, intimate_platform,
        description, location_json, has_supporting_info, evidence_types_json,
        evidence_description, privacy_choice, admin_contact_json, publication_preferences_json,
        status, status_bn, status_en, unpublish_reason, created_at, updated_at, published_at
      ) VALUES (
        @id, @internal_id, @pin_hash, @segment, @subcategory_id, @subcategory_bn, @subcategory_en,
        @title, @reported_subject, @subject_type, @role_or_designation, @organization,
        @public_profile_handle, @identifying_description, @incident_date, @incident_time,
        @frequency, @relationship_context, @intimate_what_happened, @intimate_platform,
        @description, @location_json, @has_supporting_info, @evidence_types_json,
        @evidence_description, @privacy_choice, @admin_contact_json, @publication_preferences_json,
        @status, @status_bn, @status_en, @unpublish_reason, @created_at, @updated_at, @published_at
      )
    `);

    const upsertPv = db.prepare(`
      INSERT OR REPLACE INTO public_versions (
        id, report_id, title_bn, title_en, short_description_bn, short_description_en,
        full_description_bn, full_description_en, subject_visibility, reported_subject_bn,
        reported_subject_en, subject_type, organization_visibility, organization,
        location_visibility, location_bn, location_en, district_bn, district_en,
        area_bn, area_en, approved_coordinates_json, evidence_visibility,
        evidence_summary_bn_json, evidence_summary_en_json, reporter_identity_visibility,
        public_reporter_name, incident_date_bn, incident_date_en, is_high_urgency,
        prepared_at, approved_at, published_at, updated_at
      ) VALUES (
        @id, @report_id, @title_bn, @title_en, @short_description_bn, @short_description_en,
        @full_description_bn, @full_description_en, @subject_visibility, @reported_subject_bn,
        @reported_subject_en, @subject_type, @organization_visibility, @organization,
        @location_visibility, @location_bn, @location_en, @district_bn, @district_en,
        @area_bn, @area_en, @approved_coordinates_json, @evidence_visibility,
        @evidence_summary_bn_json, @evidence_summary_en_json, @reporter_identity_visibility,
        @public_reporter_name, @incident_date_bn, @incident_date_en, @is_high_urgency,
        @prepared_at, @approved_at, @published_at, @updated_at
      )
    `);

    db.transaction(() => {
      MOCK_REPORTS.forEach((mock) => {
        const pinHash = DEFAULT_PIN_HASH;
        const coords = MOCK_COORDINATES[mock.id] || { lat: 23.8103, lng: 90.4125 };
        const createdAt = mock.publishedDateEn
          ? new Date(mock.publishedDateEn).toISOString()
          : '2026-02-14T10:00:00.000Z';
        const publishedAt = createdAt;

        upsertSub.run({
          id: mock.id,
          internal_id: `sub-int-${mock.id}`,
          pin_hash: pinHash,
          segment: mock.segment,
          subcategory_id: mock.subcategoryId,
          subcategory_bn: mock.subcategoryBn,
          subcategory_en: mock.subcategoryEn,
          title: mock.titleBn,
          reported_subject: mock.reportedSubject || null,
          subject_type: mock.subjectType || 'individual',
          role_or_designation: null,
          organization: mock.organization || null,
          public_profile_handle: null,
          identifying_description: null,
          incident_date: mock.incidentDateEn || '2026-02-10',
          incident_time: null,
          frequency: 'repeated',
          relationship_context: null,
          intimate_what_happened: null,
          intimate_platform: null,
          description: mock.fullDescriptionBn || mock.shortDescriptionBn,
          location_json: JSON.stringify({
            division: mock.districtEn === 'Chattogram' || mock.districtEn === 'Chittagong' ? 'Chittagong' : mock.districtEn === 'Sylhet' ? 'Sylhet' : mock.districtEn === 'Rajshahi' ? 'Rajshahi' : mock.districtEn === 'Khulna' ? 'Khulna' : mock.districtEn === 'Barishal' ? 'Barishal' : 'Dhaka',
            district: mock.districtEn || 'Dhaka',
            upazilaOrThana: mock.areaEn || '',
            area: mock.areaBn || '',
            formattedAddress: mock.locationBn || '',
            lat: coords.lat,
            lng: coords.lng,
          }),
          has_supporting_info: 1,
          evidence_types_json: JSON.stringify(mock.evidenceSummaryBn || []),
          evidence_description: mock.evidenceSummaryBn ? mock.evidenceSummaryBn.join(', ') : '',
          privacy_choice: 'anonymous',
          admin_contact_json: null,
          publication_preferences_json: JSON.stringify({
            showSubjectName: true,
            showOrganization: true,
            showGeneralLocation: true,
            showDescription: true,
          }),
          status: 'published',
          status_bn: mock.statusBn || 'প্রকাশিত প্রতিবেদন',
          status_en: mock.statusEn || 'Published Report',
          unpublish_reason: null,
          created_at: createdAt,
          updated_at: publishedAt,
          published_at: publishedAt,
        });

        upsertPv.run({
          id: `pv-${mock.id}`,
          report_id: mock.id,
          title_bn: mock.titleBn,
          title_en: mock.titleEn,
          short_description_bn: mock.shortDescriptionBn,
          short_description_en: mock.shortDescriptionEn,
          full_description_bn: mock.fullDescriptionBn,
          full_description_en: mock.fullDescriptionEn,
          subject_visibility: mock.reportedSubject ? 'public' : 'hidden',
          reported_subject_bn: mock.reportedSubject || null,
          reported_subject_en: mock.reportedSubject || null,
          subject_type: mock.subjectType || 'individual',
          organization_visibility: mock.organization ? 'public' : 'hidden',
          organization: mock.organization || null,
          location_visibility: 'public',
          location_bn: mock.locationBn,
          location_en: mock.locationEn,
          district_bn: mock.districtBn || null,
          district_en: mock.districtEn || null,
          area_bn: mock.areaBn || null,
          area_en: mock.areaEn || null,
          approved_coordinates_json: JSON.stringify(coords),
          evidence_visibility: mock.evidenceSummaryBn && mock.evidenceSummaryBn.length > 0 ? 'public' : 'hidden',
          evidence_summary_bn_json: JSON.stringify(mock.evidenceSummaryBn || []),
          evidence_summary_en_json: JSON.stringify(mock.evidenceSummaryEn || []),
          reporter_identity_visibility: 'hidden',
          public_reporter_name: null,
          incident_date_bn: mock.incidentDateBn,
          incident_date_en: mock.incidentDateEn,
          is_high_urgency: mock.isHighUrgency ? 1 : 0,
          prepared_at: createdAt,
          approved_at: createdAt,
          published_at: publishedAt,
          updated_at: publishedAt,
        });
      });
    })();

    recordMigration(4, 'sync_all_15_mock_reports');
  }

  // Migration 5: Seed/Update full 35-item balanced civic feed covering all subcategories
  if (!isMigrationApplied(5)) {
    console.log('[Database] Applying migration 5: sync_all_35_mock_reports...');
    const upsertSub = db.prepare(`
      INSERT OR REPLACE INTO report_submissions (
        id, internal_id, pin_hash, segment, subcategory_id, subcategory_bn, subcategory_en,
        title, reported_subject, subject_type, role_or_designation, organization,
        public_profile_handle, identifying_description, incident_date, incident_time,
        frequency, relationship_context, intimate_what_happened, intimate_platform,
        description, location_json, has_supporting_info, evidence_types_json,
        evidence_description, privacy_choice, admin_contact_json, publication_preferences_json,
        status, status_bn, status_en, unpublish_reason, created_at, updated_at, published_at
      ) VALUES (
        @id, @internal_id, @pin_hash, @segment, @subcategory_id, @subcategory_bn, @subcategory_en,
        @title, @reported_subject, @subject_type, @role_or_designation, @organization,
        @public_profile_handle, @identifying_description, @incident_date, @incident_time,
        @frequency, @relationship_context, @intimate_what_happened, @intimate_platform,
        @description, @location_json, @has_supporting_info, @evidence_types_json,
        @evidence_description, @privacy_choice, @admin_contact_json, @publication_preferences_json,
        @status, @status_bn, @status_en, @unpublish_reason, @created_at, @updated_at, @published_at
      )
    `);

    const upsertPv = db.prepare(`
      INSERT OR REPLACE INTO public_versions (
        id, report_id, title_bn, title_en, short_description_bn, short_description_en,
        full_description_bn, full_description_en, subject_visibility, reported_subject_bn,
        reported_subject_en, subject_type, organization_visibility, organization,
        location_visibility, location_bn, location_en, district_bn, district_en,
        area_bn, area_en, approved_coordinates_json, evidence_visibility,
        evidence_summary_bn_json, evidence_summary_en_json, reporter_identity_visibility,
        public_reporter_name, incident_date_bn, incident_date_en, is_high_urgency,
        prepared_at, approved_at, published_at, updated_at
      ) VALUES (
        @id, @report_id, @title_bn, @title_en, @short_description_bn, @short_description_en,
        @full_description_bn, @full_description_en, @subject_visibility, @reported_subject_bn,
        @reported_subject_en, @subject_type, @organization_visibility, @organization,
        @location_visibility, @location_bn, @location_en, @district_bn, @district_en,
        @area_bn, @area_en, @approved_coordinates_json, @evidence_visibility,
        @evidence_summary_bn_json, @evidence_summary_en_json, @reporter_identity_visibility,
        @public_reporter_name, @incident_date_bn, @incident_date_en, @is_high_urgency,
        @prepared_at, @approved_at, @published_at, @updated_at
      )
    `);

    db.transaction(() => {
      MOCK_REPORTS.forEach((mock) => {
        const pinHash = DEFAULT_PIN_HASH;
        const coords = mock.coordinates || MOCK_COORDINATES[mock.id] || { lat: 23.8103, lng: 90.4125 };
        const createdAt = mock.publishedDateEn
          ? new Date(mock.publishedDateEn).toISOString()
          : '2026-02-14T10:00:00.000Z';
        const publishedAt = createdAt;

        upsertSub.run({
          id: mock.id,
          internal_id: `sub-int-${mock.id}`,
          pin_hash: pinHash,
          segment: mock.segment,
          subcategory_id: mock.subcategoryId,
          subcategory_bn: mock.subcategoryBn,
          subcategory_en: mock.subcategoryEn,
          title: mock.titleBn,
          reported_subject: mock.reportedSubject || null,
          subject_type: mock.subjectType || 'individual',
          role_or_designation: null,
          organization: mock.organization || null,
          public_profile_handle: null,
          identifying_description: null,
          incident_date: mock.incidentDateEn || '2026-02-10',
          incident_time: null,
          frequency: 'repeated',
          relationship_context: null,
          intimate_what_happened: null,
          intimate_platform: null,
          description: mock.fullDescriptionBn || mock.shortDescriptionBn,
          location_json: JSON.stringify({
            division: mock.districtEn === 'Chattogram' || mock.districtEn === 'Chittagong' ? 'Chittagong' : mock.districtEn === 'Sylhet' ? 'Sylhet' : mock.districtEn === 'Rajshahi' ? 'Rajshahi' : mock.districtEn === 'Khulna' ? 'Khulna' : mock.districtEn === 'Barishal' ? 'Barishal' : mock.districtEn === 'Mymensingh' ? 'Mymensingh' : 'Dhaka',
            district: mock.districtEn || 'Dhaka',
            upazilaOrThana: mock.areaEn || '',
            area: mock.areaBn || '',
            formattedAddress: mock.locationBn || '',
            lat: coords.lat,
            lng: coords.lng,
          }),
          has_supporting_info: mock.evidenceSummaryBn && mock.evidenceSummaryBn.length > 0 ? 1 : 0,
          evidence_types_json: JSON.stringify(mock.evidenceSummaryBn || []),
          evidence_description: mock.evidenceSummaryBn ? mock.evidenceSummaryBn.join(', ') : '',
          privacy_choice: 'anonymous',
          admin_contact_json: null,
          publication_preferences_json: JSON.stringify({
            showSubjectName: true,
            showOrganization: true,
            showGeneralLocation: true,
            showDescription: true,
          }),
          status: 'published',
          status_bn: mock.statusBn || 'প্রকাশিত অভিযোগ',
          status_en: mock.statusEn || 'Published Report',
          unpublish_reason: null,
          created_at: createdAt,
          updated_at: publishedAt,
          published_at: publishedAt,
        });

        upsertPv.run({
          id: `pv-${mock.id}`,
          report_id: mock.id,
          title_bn: mock.titleBn,
          title_en: mock.titleEn,
          short_description_bn: mock.shortDescriptionBn,
          short_description_en: mock.shortDescriptionEn,
          full_description_bn: mock.fullDescriptionBn,
          full_description_en: mock.fullDescriptionEn,
          subject_visibility: mock.reportedSubject ? 'public' : 'hidden',
          reported_subject_bn: mock.reportedSubject || null,
          reported_subject_en: mock.reportedSubject || null,
          subject_type: mock.subjectType || 'individual',
          organization_visibility: mock.organization ? 'public' : 'hidden',
          organization: mock.organization || null,
          location_visibility: 'public',
          location_bn: mock.locationBn,
          location_en: mock.locationEn,
          district_bn: mock.districtBn || null,
          district_en: mock.districtEn || null,
          area_bn: mock.areaBn || null,
          area_en: mock.areaEn || null,
          approved_coordinates_json: JSON.stringify(coords),
          evidence_visibility: mock.evidenceSummaryBn && mock.evidenceSummaryBn.length > 0 ? 'public' : 'hidden',
          evidence_summary_bn_json: JSON.stringify(mock.evidenceSummaryBn || []),
          evidence_summary_en_json: JSON.stringify(mock.evidenceSummaryEn || []),
          reporter_identity_visibility: 'hidden',
          public_reporter_name: null,
          incident_date_bn: mock.incidentDateBn,
          incident_date_en: mock.incidentDateEn,
          is_high_urgency: mock.isHighUrgency ? 1 : 0,
          prepared_at: createdAt,
          approved_at: createdAt,
          published_at: publishedAt,
          updated_at: publishedAt,
        });
      });
    })();

    recordMigration(5, 'sync_all_35_mock_reports');
  }

  // 4. Seed Initial Admin Account (Strictly environment-driven; no hardcoded passwords in code)
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL || '').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD || '';
  
  if (adminEmail && adminPassword) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const now = new Date().toISOString();

    const existingAdmin = db.prepare('SELECT id, email FROM admin_users WHERE email = ?').get(adminEmail) as { id: string; email: string } | undefined;
    if (!existingAdmin) {
      const insertAdmin = db.prepare(`
        INSERT INTO admin_users (id, email, password_hash, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertAdmin.run('admin-001', adminEmail, passwordHash, 'Sobaike Janao Moderator', 'admin', now);
      console.log(`[Database] Seeded initial admin account (${adminEmail}) from environment configuration.`);
    } else {
      db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(passwordHash, existingAdmin.id);
    }
  } else {
    console.info('[Database] No ADMIN_INITIAL_PASSWORD configured; skipping initial admin account seeding.');
  }

  // 4. Seed Initial Reports if database is empty
  const subCount = db.prepare('SELECT COUNT(*) as cnt FROM report_submissions').get() as { cnt: number };
  if (subCount.cnt === 0) {
    console.log('[Database] Empty submissions table detected. Seeding initial records...');

    const insertSub = db.prepare(`
      INSERT INTO report_submissions (
        id, internal_id, pin_hash, segment, subcategory_id, subcategory_bn, subcategory_en,
        title, reported_subject, subject_type, role_or_designation, organization,
        public_profile_handle, identifying_description, incident_date, incident_time,
        frequency, relationship_context, intimate_what_happened, intimate_platform,
        description, location_json, has_supporting_info, evidence_types_json,
        evidence_description, privacy_choice, admin_contact_json, publication_preferences_json,
        status, status_bn, status_en, unpublish_reason, created_at, updated_at, published_at
      ) VALUES (
        @id, @internal_id, @pin_hash, @segment, @subcategory_id, @subcategory_bn, @subcategory_en,
        @title, @reported_subject, @subject_type, @role_or_designation, @organization,
        @public_profile_handle, @identifying_description, @incident_date, @incident_time,
        @frequency, @relationship_context, @intimate_what_happened, @intimate_platform,
        @description, @location_json, @has_supporting_info, @evidence_types_json,
        @evidence_description, @privacy_choice, @admin_contact_json, @publication_preferences_json,
        @status, @status_bn, @status_en, @unpublish_reason, @created_at, @updated_at, @published_at
      )
    `);

    const insertPv = db.prepare(`
      INSERT INTO public_versions (
        id, report_id, title_bn, title_en, short_description_bn, short_description_en,
        full_description_bn, full_description_en, subject_visibility, reported_subject_bn,
        reported_subject_en, subject_type, organization_visibility, organization,
        location_visibility, location_bn, location_en, district_bn, district_en,
        area_bn, area_en, approved_coordinates_json, evidence_visibility,
        evidence_summary_bn_json, evidence_summary_en_json, reporter_identity_visibility,
        public_reporter_name, incident_date_bn, incident_date_en, is_high_urgency,
        prepared_at, approved_at, published_at, updated_at
      ) VALUES (
        @id, @report_id, @title_bn, @title_en, @short_description_bn, @short_description_en,
        @full_description_bn, @full_description_en, @subject_visibility, @reported_subject_bn,
        @reported_subject_en, @subject_type, @organization_visibility, @organization,
        @location_visibility, @location_bn, @location_en, @district_bn, @district_en,
        @area_bn, @area_en, @approved_coordinates_json, @evidence_visibility,
        @evidence_summary_bn_json, @evidence_summary_en_json, @reporter_identity_visibility,
        @public_reporter_name, @incident_date_bn, @incident_date_en, @is_high_urgency,
        @prepared_at, @approved_at, @published_at, @updated_at
      )
    `);

    const insertClar = db.prepare(`
      INSERT INTO clarification_requests (
        id, report_id, message, requested_fields_json, reporter_response, created_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMod = db.prepare(`
      INSERT INTO moderation_events (
        id, report_id, action, action_bn, action_en, previous_status, new_status, note, actor, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertRel = db.prepare(`
      INSERT INTO related_reports (
        id, report_a_id, report_b_id, relationship_type, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insertResp = db.prepare(`
      INSERT INTO subject_responses (
        id, report_id, report_title, responder_type, responder_name, contact_email_or_phone,
        contact_info, organization_name, designation, official_statement,
        supporting_documents_note, supporting_documents_summary_json, request_correction_or_removal,
        correction_details, status, created_at, published_at, updated_at
      ) VALUES (
        @id, @report_id, @report_title, @responder_type, @responder_name, @contact_email_or_phone,
        @contact_info, @organization_name, @designation, @official_statement,
        @supporting_documents_note, @supporting_documents_summary_json, @request_correction_or_removal,
        @correction_details, @status, @created_at, @published_at, @updated_at
      )
    `);

    const seedTx = db.transaction(() => {
      // 1. Seed Published Mock Reports
      MOCK_REPORTS.forEach((mock) => {
        const pinHash = DEFAULT_PIN_HASH;
        const coords = MOCK_COORDINATES[mock.id] || { lat: 23.8103, lng: 90.4125 };
        const createdAt = mock.publishedDateEn
          ? new Date(mock.publishedDateEn).toISOString()
          : '2026-02-14T10:00:00.000Z';
        const publishedAt = createdAt;

        insertSub.run({
          id: mock.id,
          internal_id: `sub-int-${mock.id}`,
          pin_hash: pinHash,
          segment: mock.segment,
          subcategory_id: mock.subcategoryId,
          subcategory_bn: mock.subcategoryBn,
          subcategory_en: mock.subcategoryEn,
          title: mock.titleBn,
          reported_subject: mock.reportedSubject || null,
          subject_type: mock.subjectType || 'individual',
          role_or_designation: null,
          organization: mock.organization || null,
          public_profile_handle: null,
          identifying_description: null,
          incident_date: mock.incidentDateEn || '2026-02-10',
          incident_time: null,
          frequency: 'repeated',
          relationship_context: null,
          intimate_what_happened: null,
          intimate_platform: null,
          description: mock.fullDescriptionBn || mock.shortDescriptionBn,
          location_json: JSON.stringify({
            division: mock.districtEn === 'Chattogram' || mock.districtEn === 'Chittagong' ? 'Chittagong' : mock.districtEn === 'Sylhet' ? 'Sylhet' : mock.districtEn === 'Rajshahi' ? 'Rajshahi' : mock.districtEn === 'Khulna' ? 'Khulna' : 'Dhaka',
            district: mock.districtEn || 'Dhaka',
            upazilaOrThana: mock.areaEn || '',
            area: mock.areaBn || '',
            formattedAddress: mock.locationBn || '',
            lat: coords.lat,
            lng: coords.lng,
          }),
          has_supporting_info: 1,
          evidence_types_json: JSON.stringify(mock.evidenceSummaryBn || []),
          evidence_description: mock.evidenceSummaryBn ? mock.evidenceSummaryBn.join(', ') : '',
          privacy_choice: 'anonymous',
          admin_contact_json: null,
          publication_preferences_json: JSON.stringify({
            showSubjectName: true,
            showOrganization: true,
            showGeneralLocation: true,
            showDescription: true,
          }),
          status: 'published',
          status_bn: mock.statusBn || 'প্রকাশিত প্রতিবেদন',
          status_en: mock.statusEn || 'Published Report',
          unpublish_reason: null,
          created_at: createdAt,
          updated_at: publishedAt,
          published_at: publishedAt,
        });

        insertPv.run({
          id: `pv-${mock.id}`,
          report_id: mock.id,
          title_bn: mock.titleBn,
          title_en: mock.titleEn,
          short_description_bn: mock.shortDescriptionBn,
          short_description_en: mock.shortDescriptionEn,
          full_description_bn: mock.fullDescriptionBn,
          full_description_en: mock.fullDescriptionEn,
          subject_visibility: mock.reportedSubject ? 'public' : 'hidden',
          reported_subject_bn: mock.reportedSubject || null,
          reported_subject_en: mock.reportedSubject || null,
          subject_type: mock.subjectType || 'individual',
          organization_visibility: mock.organization ? 'public' : 'hidden',
          organization: mock.organization || null,
          location_visibility: 'public',
          location_bn: mock.locationBn,
          location_en: mock.locationEn,
          district_bn: mock.districtBn || null,
          district_en: mock.districtEn || null,
          area_bn: mock.areaBn || null,
          area_en: mock.areaEn || null,
          approved_coordinates_json: JSON.stringify(coords),
          evidence_visibility: mock.evidenceSummaryBn && mock.evidenceSummaryBn.length > 0 ? 'public' : 'hidden',
          evidence_summary_bn_json: JSON.stringify(mock.evidenceSummaryBn || []),
          evidence_summary_en_json: JSON.stringify(mock.evidenceSummaryEn || []),
          reporter_identity_visibility: 'hidden',
          public_reporter_name: null,
          incident_date_bn: mock.incidentDateBn,
          incident_date_en: mock.incidentDateEn,
          is_high_urgency: mock.isHighUrgency ? 1 : 0,
          prepared_at: createdAt,
          approved_at: createdAt,
          published_at: publishedAt,
          updated_at: publishedAt,
        });

        if (mock.response) {
          insertResp.run({
            id: `resp-${mock.id}`,
            report_id: mock.id,
            report_title: mock.titleBn,
            responder_type: 'organization_rep',
            responder_name: mock.response.respondentBn || 'কর্তৃপক্ষ প্রতিনিধি',
            contact_email_or_phone: 'verified@organization.org',
            contact_info: null,
            organization_name: mock.organization || null,
            designation: mock.response.respondentBn || 'তত্ত্বাবধায়ক',
            official_statement: mock.response.statementBn,
            supporting_documents_note: null,
            supporting_documents_summary_json: JSON.stringify([]),
            request_correction_or_removal: 0,
            correction_details: null,
            status: 'published',
            created_at: createdAt,
            published_at: publishedAt,
            updated_at: publishedAt,
          });
        }

        if (mock.relatedReportIds) {
          mock.relatedReportIds.forEach((targetId, rIdx) => {
            insertRel.run(
              `rel-${mock.id}-${targetId}-${rIdx}`,
              mock.id,
              targetId,
              'same_entity',
              createdAt
            );
          });
        }
      });

      // 2. Seed Queue Submissions
      SEED_SUBMITTED_REPORTS.forEach((sub, idx) => {
        const pinHash = sub.pin ? bcrypt.hashSync(sub.pin, 4) : DEFAULT_PIN_HASH;
        insertSub.run({
          id: sub.id,
          internal_id: `sub-int-${idx + 1}-${sub.id}`,
          pin_hash: pinHash,
          segment: sub.segment,
          subcategory_id: sub.subcategoryId,
          subcategory_bn: sub.subcategoryBn,
          subcategory_en: sub.subcategoryEn,
          title: sub.title,
          reported_subject: sub.reportedSubject || null,
          subject_type: sub.subjectType || 'individual',
          role_or_designation: sub.roleOrDesignation || null,
          organization: sub.organization || null,
          public_profile_handle: sub.publicProfileHandle || null,
          identifying_description: sub.identifyingDescription || null,
          incident_date: sub.incidentDate,
          incident_time: sub.incidentTime || null,
          frequency: sub.frequency || 'one-time',
          relationship_context: sub.relationshipContext || null,
          intimate_what_happened: sub.intimateWhatHappened || null,
          intimate_platform: sub.intimatePlatform || null,
          description: sub.description,
          location_json: JSON.stringify(sub.location),
          has_supporting_info: sub.hasSupportingInfo ? 1 : 0,
          evidence_types_json: JSON.stringify(sub.evidenceTypes || []),
          evidence_description: sub.evidenceDescription || '',
          privacy_choice: sub.privacyChoice,
          admin_contact_json: sub.adminContact ? JSON.stringify(sub.adminContact) : null,
          publication_preferences_json: JSON.stringify(sub.publicationPreferences || {}),
          status: sub.status,
          status_bn: sub.statusBn,
          status_en: sub.statusEn,
          unpublish_reason: sub.unpublishReason || null,
          created_at: sub.createdAt,
          updated_at: sub.createdAt,
          published_at: sub.publishedAt || null,
        });

        if (sub.publicVersion) {
          const pv = sub.publicVersion;
          insertPv.run({
            id: `pv-${sub.id}`,
            report_id: sub.id,
            title_bn: pv.titleBn,
            title_en: pv.titleEn,
            short_description_bn: pv.shortDescriptionBn,
            short_description_en: pv.shortDescriptionEn,
            full_description_bn: pv.fullDescriptionBn,
            full_description_en: pv.fullDescriptionEn,
            subject_visibility: pv.sensitiveSettings?.subjectNamePrivacy || 'hidden',
            reported_subject_bn: pv.reportedSubjectBn || null,
            reported_subject_en: pv.reportedSubjectEn || null,
            subject_type: pv.subjectType || 'individual',
            organization_visibility: pv.sensitiveSettings?.organizationPrivacy || 'hidden',
            organization: pv.organization || null,
            location_visibility: pv.sensitiveSettings?.locationPrivacy || 'hidden',
            location_bn: pv.locationBn,
            location_en: pv.locationEn,
            district_bn: pv.districtBn || null,
            district_en: pv.districtEn || null,
            area_bn: pv.areaBn || null,
            area_en: pv.areaEn || null,
            approved_coordinates_json: pv.coordinates ? JSON.stringify(pv.coordinates) : null,
            evidence_visibility: pv.sensitiveSettings?.evidencePrivacy || 'hidden',
            evidence_summary_bn_json: JSON.stringify(pv.evidenceSummaryBn || []),
            evidence_summary_en_json: JSON.stringify(pv.evidenceSummaryEn || []),
            reporter_identity_visibility: pv.sensitiveSettings?.reporterIdentity || 'hidden',
            public_reporter_name: null,
            incident_date_bn: pv.incidentDateBn,
            incident_date_en: pv.incidentDateEn,
            is_high_urgency: pv.isHighUrgency ? 1 : 0,
            prepared_at: sub.createdAt,
            approved_at: sub.status === 'approved' || sub.status === 'published' ? sub.createdAt : null,
            published_at: sub.status === 'published' ? sub.publishedAt || sub.createdAt : null,
            updated_at: sub.createdAt,
          });
        }

        if (sub.activeClarification) {
          insertClar.run(
            sub.activeClarification.id,
            sub.id,
            sub.activeClarification.message,
            JSON.stringify(sub.activeClarification.requestedFields || []),
            sub.activeClarification.reporterResponse || null,
            sub.activeClarification.createdAt,
            sub.activeClarification.resolvedAt || null
          );
        }

        if (sub.history) {
          sub.history.forEach((h, hIdx) => {
            insertMod.run(
              `mod-${sub.id}-${hIdx + 1}`,
              sub.id,
              h.status === 'submitted' ? 'REPORT_SUBMITTED' : `STATUS_CHANGE_TO_${h.status.toUpperCase()}`,
              h.statusBn,
              h.statusEn,
              null,
              h.status,
              h.noteEn || h.noteBn,
              'System / Moderator',
              sub.createdAt
            );
          });
        }

        if (sub.relatedRelationships) {
          sub.relatedRelationships.forEach((rel, rIdx) => {
            insertRel.run(
              `rel-${sub.id}-${rel.targetReportId}-${rIdx}`,
              sub.id,
              rel.targetReportId,
              rel.relationshipType,
              sub.createdAt
            );
          });
        }
      });

      SEED_SUBJECT_RESPONSES.forEach((resp) => {
        insertResp.run({
          id: resp.id,
          report_id: resp.reportId,
          report_title: resp.reportTitle || null,
          responder_type: resp.responderType,
          responder_name: resp.responderName,
          contact_email_or_phone: resp.contactEmailOrPhone,
          contact_info: resp.contactInfo || null,
          organization_name: resp.organizationName || null,
          designation: null,
          official_statement: resp.officialStatement,
          supporting_documents_note: null,
          supporting_documents_summary_json: JSON.stringify(resp.supportingDocumentsSummary || []),
          request_correction_or_removal: 0,
          correction_details: null,
          status: resp.status,
          created_at: resp.createdAt,
          published_at: null,
          updated_at: resp.createdAt,
        });
      });
    });

    seedTx();
    console.log(`[Database] Successfully seeded ${SEED_SUBMITTED_REPORTS.length} reports and initial responses.`);
  }
}
