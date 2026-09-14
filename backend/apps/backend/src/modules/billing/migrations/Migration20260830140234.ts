import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260830140234 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "billing_payment_link" drop constraint if exists "billing_payment_link_token_unique";`);
    this.addSql(`alter table if exists "billing_invoice" drop constraint if exists "billing_invoice_invoice_number_unique";`);
    this.addSql(`create table if not exists "billing_customer" ("id" text not null, "name" text not null, "mobile" text null, "email" text null, "address" text null, "city" text null, "state" text null, "state_code" text null, "pin_code" text null, "gstin" text null, "customer_type" text check ("customer_type" in ('b2c', 'b2b')) not null default 'b2c', "status" text check ("status" in ('ACTIVE', 'PAYMENT_PENDING', 'PAID', 'INACTIVE')) not null default 'ACTIVE', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_customer_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_customer_deleted_at" ON "billing_customer" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_customer_note" ("id" text not null, "note" text not null, "created_by" text null, "customer_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_customer_note_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_customer_note_customer_id" ON "billing_customer_note" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_customer_note_deleted_at" ON "billing_customer_note" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_follow_up" ("id" text not null, "follow_up_date" timestamptz not null, "reason" text not null, "assigned_to" text null, "notes" text null, "status" text check ("status" in ('PENDING', 'COMPLETED', 'CANCELLED')) not null default 'PENDING', "customer_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_follow_up_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_follow_up_customer_id" ON "billing_follow_up" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_follow_up_deleted_at" ON "billing_follow_up" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_invoice" ("id" text not null, "invoice_number" text not null, "customer_type" text check ("customer_type" in ('b2c', 'b2b')) not null default 'b2c', "customer_name" text not null, "mobile_number" text null, "address" text null, "city" text null, "state" text null, "state_code" text null, "pin_code" text null, "gstin" text null, "subtotal" numeric not null, "discount" numeric not null default 0, "taxable_amount" numeric not null, "cgst" numeric not null default 0, "sgst" numeric not null default 0, "igst" numeric not null default 0, "round_off" numeric not null default 0, "grand_total" numeric not null, "amount_paid" numeric not null default 0, "due_date" timestamptz null, "reminder_enabled" boolean not null default false, "payment_method" text null, "payment_status" text check ("payment_status" in ('PAID', 'PARTIALLY_PAID', 'PENDING', 'CANCELLED')) not null default 'PENDING', "created_by" text null, "cancelled_by" text null, "cancellation_reason" text null, "customer_id" text not null, "raw_subtotal" jsonb not null, "raw_discount" jsonb not null default '{"value":"0","precision":20}', "raw_taxable_amount" jsonb not null, "raw_cgst" jsonb not null default '{"value":"0","precision":20}', "raw_sgst" jsonb not null default '{"value":"0","precision":20}', "raw_igst" jsonb not null default '{"value":"0","precision":20}', "raw_round_off" jsonb not null default '{"value":"0","precision":20}', "raw_grand_total" jsonb not null, "raw_amount_paid" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_invoice_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_billing_invoice_invoice_number_unique" ON "billing_invoice" ("invoice_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_invoice_customer_id" ON "billing_invoice" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_invoice_deleted_at" ON "billing_invoice" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_invoice_item" ("id" text not null, "product_id" text null, "product_name" text not null, "sku" text null, "hsn" text null, "quantity" integer not null, "gross_weight" text null, "net_weight" text null, "purity" text null, "rate" numeric not null, "discount" numeric not null default 0, "taxable_value" numeric not null, "gst_rate" integer not null, "gst_amount" numeric not null, "total" numeric not null, "invoice_id" text not null, "raw_rate" jsonb not null, "raw_discount" jsonb not null default '{"value":"0","precision":20}', "raw_taxable_value" jsonb not null, "raw_gst_amount" jsonb not null, "raw_total" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_invoice_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_invoice_item_invoice_id" ON "billing_invoice_item" ("invoice_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_invoice_item_deleted_at" ON "billing_invoice_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_message_log" ("id" text not null, "invoice_id" text null, "channel" text not null default 'whatsapp', "message_type" text not null default 'payment_reminder', "message_content" text not null, "sent_by" text null, "delivery_status" text not null default 'sent', "provider_message_id" text null, "customer_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_message_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_message_log_customer_id" ON "billing_message_log" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_message_log_deleted_at" ON "billing_message_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_message_template" ("id" text not null, "template_type" text not null, "channel" text not null default 'whatsapp', "subject" text null, "body_template" text not null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_message_template_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_message_template_deleted_at" ON "billing_message_template" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_payment" ("id" text not null, "amount" numeric not null, "payment_method" text not null default 'Cash', "reference_number" text null, "payment_date" timestamptz not null, "recorded_by" text null, "notes" text null, "invoice_id" text not null, "customer_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_payment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_payment_invoice_id" ON "billing_payment" ("invoice_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_payment_customer_id" ON "billing_payment" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_payment_deleted_at" ON "billing_payment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_payment_link" ("id" text not null, "token" text not null, "invoice_id" text not null, "customer_id" text null, "amount" numeric not null, "status" text check ("status" in ('ACTIVE', 'USED', 'EXPIRED')) not null default 'ACTIVE', "expires_at" timestamptz not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_payment_link_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_billing_payment_link_token_unique" ON "billing_payment_link" ("token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_payment_link_deleted_at" ON "billing_payment_link" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_reminder_settings" ("id" text not null, "enabled" boolean not null default false, "preferred_channel" text not null default 'whatsapp', "schedule_json" text not null default '[{"days_before_due":1},{"days_after_due":0},{"days_after_due":1},{"days_after_due":3},{"days_after_due":7}]', "max_reminders" integer not null default 5, "min_interval_hours" integer not null default 24, "communication_hours_start" integer not null default 9, "communication_hours_end" integer not null default 20, "payment_link_expiry_hours" integer not null default 72, "receipt_message_enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_reminder_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_reminder_settings_deleted_at" ON "billing_reminder_settings" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_settings" ("id" text not null, "business_name" text not null default 'Tirupati Jewellers', "legal_name" text not null default 'Tirupati Jewellers', "business_address" text null, "city" text null, "state" text null, "pin_code" text null, "state_code" text not null default '07', "gstin" text null, "pan" text null, "phone" text null, "email" text null, "website" text null, "invoice_prefix" text not null default 'TJ/', "financial_year" text not null default '2026-27', "terms_conditions" text null, "authorized_signatory" text null, "next_invoice_sequence" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_settings_deleted_at" ON "billing_settings" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "billing_customer_note" add constraint "billing_customer_note_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_follow_up" add constraint "billing_follow_up_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_invoice" add constraint "billing_invoice_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_invoice_item" add constraint "billing_invoice_item_invoice_id_foreign" foreign key ("invoice_id") references "billing_invoice" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_message_log" add constraint "billing_message_log_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_payment" add constraint "billing_payment_invoice_id_foreign" foreign key ("invoice_id") references "billing_invoice" ("id") on update cascade;`);
    this.addSql(`alter table if exists "billing_payment" add constraint "billing_payment_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "billing_customer_note" drop constraint if exists "billing_customer_note_customer_id_foreign";`);

    this.addSql(`alter table if exists "billing_follow_up" drop constraint if exists "billing_follow_up_customer_id_foreign";`);

    this.addSql(`alter table if exists "billing_invoice" drop constraint if exists "billing_invoice_customer_id_foreign";`);

    this.addSql(`alter table if exists "billing_message_log" drop constraint if exists "billing_message_log_customer_id_foreign";`);

    this.addSql(`alter table if exists "billing_payment" drop constraint if exists "billing_payment_customer_id_foreign";`);

    this.addSql(`alter table if exists "billing_invoice_item" drop constraint if exists "billing_invoice_item_invoice_id_foreign";`);

    this.addSql(`alter table if exists "billing_payment" drop constraint if exists "billing_payment_invoice_id_foreign";`);

    this.addSql(`drop table if exists "billing_customer" cascade;`);

    this.addSql(`drop table if exists "billing_customer_note" cascade;`);

    this.addSql(`drop table if exists "billing_follow_up" cascade;`);

    this.addSql(`drop table if exists "billing_invoice" cascade;`);

    this.addSql(`drop table if exists "billing_invoice_item" cascade;`);

    this.addSql(`drop table if exists "billing_message_log" cascade;`);

    this.addSql(`drop table if exists "billing_message_template" cascade;`);

    this.addSql(`drop table if exists "billing_payment" cascade;`);

    this.addSql(`drop table if exists "billing_payment_link" cascade;`);

    this.addSql(`drop table if exists "billing_reminder_settings" cascade;`);

    this.addSql(`drop table if exists "billing_settings" cascade;`);
  }

}
