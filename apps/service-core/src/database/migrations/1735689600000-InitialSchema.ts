import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for society_core (replaces DB_SYNC for non-dev).
 * Uses IF NOT EXISTS so existing sync-created databases can adopt migrations safely.
 */
export class InitialSchema1735689600000 implements MigrationInterface {
  name = 'InitialSchema1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        phone_number varchar(20) UNIQUE,
        password_hash varchar(255) NOT NULL,
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        last_login timestamp,
        phone_verified_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(50) NOT NULL UNIQUE,
        description text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        action varchar(100) NOT NULL UNIQUE,
        module varchar(50) NOT NULL,
        description text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        role_id uuid NOT NULL REFERENCES roles(uid) ON DELETE CASCADE,
        assigned_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id uuid NOT NULL REFERENCES roles(uid) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES permissions(uid) ON DELETE CASCADE,
        assigned_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_role_permissions_role_perm UNIQUE (role_id, permission_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        token_hash varchar(128) NOT NULL UNIQUE,
        expires_at timestamp NOT NULL,
        revoked_at timestamp,
        replaced_by uuid,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        token_hash varchar(128) NOT NULL UNIQUE,
        expires_at timestamp NOT NULL,
        used_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number varchar(20) NOT NULL,
        user_id uuid,
        purpose varchar(32) NOT NULL,
        code_hash varchar(128) NOT NULL,
        expires_at timestamp NOT NULL,
        attempts int NOT NULL DEFAULT 0,
        consumed_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_otp_codes_phone_purpose_created
        ON otp_codes (phone_number, purpose, created_at)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS societies (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL,
        code varchar(50) NOT NULL UNIQUE,
        address varchar(255),
        city varchar(100),
        state varchar(100),
        pincode varchar(20),
        description varchar(500),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS buildings (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        society_id uuid NOT NULL REFERENCES societies(uid) ON DELETE CASCADE,
        name varchar(100) NOT NULL,
        code varchar(50) NOT NULL,
        total_floors int,
        description varchar(255),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_building_society_code UNIQUE (society_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS flats (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        building_id uuid NOT NULL REFERENCES buildings(uid) ON DELETE CASCADE,
        number varchar(50) NOT NULL,
        floor int,
        unit_type varchar(50),
        area_sq_ft numeric(10,2),
        description varchar(255),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_flat_building_number UNIQUE (building_id, number)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        society_id uuid NOT NULL REFERENCES societies(uid) ON DELETE CASCADE,
        flat_id uuid REFERENCES flats(uid) ON DELETE SET NULL,
        type varchar(32) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'ACTIVE',
        is_primary boolean NOT NULL DEFAULT false,
        started_at timestamp,
        ended_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_membership_user_society
        ON memberships (user_id, society_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bills (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        society_id uuid NOT NULL,
        flat_id uuid,
        membership_id uuid,
        title varchar(200) NOT NULL,
        category varchar(32) NOT NULL DEFAULT 'OTHER',
        amount numeric(12,2) NOT NULL,
        currency varchar(8) NOT NULL DEFAULT 'INR',
        due_date date NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'DRAFT',
        issued_at timestamp,
        notes varchar(500),
        created_by_user_id uuid NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payments (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id uuid NOT NULL REFERENCES bills(uid) ON DELETE CASCADE,
        amount numeric(12,2) NOT NULL,
        method varchar(32) NOT NULL,
        reference varchar(100),
        paid_by_user_id uuid NOT NULL,
        paid_at timestamp NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'SUCCESS',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id uuid NOT NULL UNIQUE REFERENCES payments(uid) ON DELETE CASCADE,
        bill_id uuid NOT NULL,
        society_id uuid NOT NULL,
        receipt_number varchar(40) NOT NULL UNIQUE,
        issued_at timestamp NOT NULL,
        snapshot_json text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notices (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        society_id uuid NOT NULL,
        title varchar(200) NOT NULL,
        body text NOT NULL,
        priority varchar(16) NOT NULL DEFAULT 'NORMAL',
        published_at timestamp NOT NULL,
        expires_at timestamp,
        created_by_user_id uuid NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        society_id uuid NOT NULL,
        flat_id uuid,
        raised_by_user_id uuid NOT NULL,
        category varchar(80) NOT NULL,
        title varchar(200) NOT NULL,
        description text NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'OPEN',
        assigned_to_user_id uuid,
        resolution_notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        society_id uuid NOT NULL,
        flat_id uuid,
        host_user_id uuid NOT NULL,
        visitor_name varchar(150) NOT NULL,
        visitor_phone varchar(20),
        purpose varchar(255),
        expected_at timestamp NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'EXPECTED',
        checked_in_at timestamp,
        checked_out_at timestamp,
        gate_pass_id uuid,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        display_name varchar(160) NOT NULL,
        company_name varchar(200) NOT NULL,
        contact_phone varchar(40),
        contact_email varchar(160),
        categories varchar(400) NOT NULL DEFAULT 'GENERAL',
        status varchar(32) NOT NULL DEFAULT 'DRAFT',
        gst_number varchar(32),
        pan_number varchar(20),
        address text,
        city varchar(80),
        notes text,
        user_id uuid,
        created_by_user_id uuid NOT NULL,
        reviewed_by_user_id uuid,
        reviewed_at timestamp,
        rejection_reason text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vendor_documents (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id uuid NOT NULL REFERENCES vendors(uid) ON DELETE CASCADE,
        doc_type varchar(32) NOT NULL,
        label varchar(160) NOT NULL,
        reference_or_url varchar(500) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'SUBMITTED',
        notes text,
        verified_by_user_id uuid,
        verified_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vendor_societies (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id uuid NOT NULL REFERENCES vendors(uid) ON DELETE CASCADE,
        society_id uuid NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'ACTIVE',
        notes text,
        approved_by_user_id uuid,
        approved_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_vendor_societies_vendor_society UNIQUE (vendor_id, society_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        society_id uuid NOT NULL,
        flat_id uuid,
        building_id uuid,
        title varchar(200) NOT NULL,
        description text NOT NULL,
        category varchar(40) NOT NULL DEFAULT 'GENERAL',
        priority varchar(16) NOT NULL DEFAULT 'NORMAL',
        status varchar(32) NOT NULL DEFAULT 'OPEN',
        requested_by_user_id uuid NOT NULL,
        assigned_vendor_id uuid,
        complaint_id uuid,
        scheduled_start_at timestamp,
        scheduled_end_at timestamp,
        completed_at timestamp,
        verified_at timestamp,
        verified_by_user_id uuid,
        cost_estimate numeric(12,2),
        actual_cost numeric(12,2),
        currency varchar(8) NOT NULL DEFAULT 'INR',
        resolution_notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS work_order_quotes (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        work_order_id uuid NOT NULL REFERENCES work_orders(uid) ON DELETE CASCADE,
        vendor_id uuid NOT NULL,
        amount numeric(12,2) NOT NULL,
        currency varchar(8) NOT NULL DEFAULT 'INR',
        notes text,
        status varchar(32) NOT NULL DEFAULT 'PROPOSED',
        proposed_by_user_id uuid NOT NULL,
        decided_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS work_order_events (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        work_order_id uuid NOT NULL REFERENCES work_orders(uid) ON DELETE CASCADE,
        actor_user_id uuid NOT NULL,
        event_type varchar(64) NOT NULL,
        from_status varchar(32),
        to_status varchar(32),
        message text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        society_id uuid,
        channel varchar(16) NOT NULL,
        type varchar(64) NOT NULL,
        title varchar(200) NOT NULL,
        body text NOT NULL,
        payload_json text,
        status varchar(16) NOT NULL DEFAULT 'PENDING',
        source_service varchar(40) NOT NULL DEFAULT 'core',
        error_message text,
        read_at timestamp,
        sent_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_notifications_user_created
        ON notifications (user_id, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_notifications_user_status
        ON notifications (user_id, status)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE,
        email_enabled boolean NOT NULL DEFAULT true,
        sms_enabled boolean NOT NULL DEFAULT true,
        push_enabled boolean NOT NULL DEFAULT true,
        in_app_enabled boolean NOT NULL DEFAULT true,
        muted_types varchar(500) NOT NULL DEFAULT '',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'notification_preferences',
      'notifications',
      'work_order_events',
      'work_order_quotes',
      'work_orders',
      'vendor_societies',
      'vendor_documents',
      'vendors',
      'visitors',
      'complaints',
      'notices',
      'receipts',
      'payments',
      'bills',
      'memberships',
      'flats',
      'buildings',
      'societies',
      'otp_codes',
      'password_reset_tokens',
      'refresh_tokens',
      'role_permissions',
      'user_roles',
      'permissions',
      'roles',
      'users',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
  }
}
