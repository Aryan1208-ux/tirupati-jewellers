import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260923101503 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "billing_estimate" drop constraint if exists "billing_estimate_estimate_number_unique";`);
    this.addSql(`create table if not exists "billing_estimate" ("id" text not null, "estimate_number" text not null, "customer_type" text check ("customer_type" in ('b2c', 'b2b')) not null default 'b2c', "customer_name" text not null, "mobile_number" text null, "address" text null, "city" text null, "state" text null, "state_code" text null, "pin_code" text null, "gstin" text null, "subtotal" numeric not null, "discount" numeric not null default 0, "taxable_amount" numeric not null, "cgst" numeric not null default 0, "sgst" numeric not null default 0, "igst" numeric not null default 0, "round_off" numeric not null default 0, "grand_total" numeric not null, "valid_until" timestamptz null, "notes" text null, "status" text check ("status" in ('DRAFT', 'ISSUED', 'CONVERTED', 'EXPIRED', 'REJECTED')) not null default 'ISSUED', "created_by" text null, "converted_to_invoice_id" text null, "customer_id" text not null, "raw_subtotal" jsonb not null, "raw_discount" jsonb not null default '{"value":"0","precision":20}', "raw_taxable_amount" jsonb not null, "raw_cgst" jsonb not null default '{"value":"0","precision":20}', "raw_sgst" jsonb not null default '{"value":"0","precision":20}', "raw_igst" jsonb not null default '{"value":"0","precision":20}', "raw_round_off" jsonb not null default '{"value":"0","precision":20}', "raw_grand_total" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_estimate_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_billing_estimate_estimate_number_unique" ON "billing_estimate" ("estimate_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_estimate_customer_id" ON "billing_estimate" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_estimate_deleted_at" ON "billing_estimate" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_estimate_item" ("id" text not null, "product_id" text null, "product_name" text not null, "sku" text null, "hsn" text null, "quantity" integer not null, "gross_weight" text null, "net_weight" text null, "purity" text null, "rate" numeric not null, "discount" numeric not null default 0, "taxable_value" numeric not null, "gst_rate" integer not null, "gst_amount" numeric not null, "total" numeric not null, "estimate_id" text not null, "raw_rate" jsonb not null, "raw_discount" jsonb not null default '{"value":"0","precision":20}', "raw_taxable_value" jsonb not null, "raw_gst_amount" jsonb not null, "raw_total" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_estimate_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_estimate_item_estimate_id" ON "billing_estimate_item" ("estimate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_estimate_item_deleted_at" ON "billing_estimate_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_greeting_occasion" ("id" text not null, "name" text not null, "occasion_date" timestamptz not null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_greeting_occasion_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_greeting_occasion_deleted_at" ON "billing_greeting_occasion" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_greeting_settings" ("id" text not null, "automatic_birthdays" boolean not null default false, "automatic_anniversaries" boolean not null default false, "automatic_festivals" boolean not null default false, "test_mode" boolean not null default true, "default_channel" text check ("default_channel" in ('whatsapp', 'sms', 'email')) not null default 'whatsapp', "preferred_time" text not null default '09:00', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_greeting_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_greeting_settings_deleted_at" ON "billing_greeting_settings" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_greeting_template" ("id" text not null, "name" text not null, "occasion_type" text check ("occasion_type" in ('BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL', 'CUSTOM')) not null default 'FESTIVAL', "channel" text check ("channel" in ('whatsapp', 'sms', 'email')) not null default 'whatsapp', "language" text not null default 'en', "subject" text null, "message" text not null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_greeting_template_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_greeting_template_deleted_at" ON "billing_greeting_template" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "billing_greeting_history" ("id" text not null, "occasion_name" text not null, "channel" text not null, "rendered_message" text not null, "status" text check ("status" in ('PENDING', 'SENT', 'FAILED')) not null default 'SENT', "sent_at" timestamptz null, "error_message" text null, "customer_id" text not null, "template_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "billing_greeting_history_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_greeting_history_customer_id" ON "billing_greeting_history" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_greeting_history_template_id" ON "billing_greeting_history" ("template_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_billing_greeting_history_deleted_at" ON "billing_greeting_history" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "billing_estimate" add constraint "billing_estimate_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_estimate_item" add constraint "billing_estimate_item_estimate_id_foreign" foreign key ("estimate_id") references "billing_estimate" ("id") on update cascade;`);

    this.addSql(`alter table if exists "billing_greeting_history" add constraint "billing_greeting_history_customer_id_foreign" foreign key ("customer_id") references "billing_customer" ("id") on update cascade;`);
    this.addSql(`alter table if exists "billing_greeting_history" add constraint "billing_greeting_history_template_id_foreign" foreign key ("template_id") references "billing_greeting_template" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "billing_customer" add column if not exists "date_of_birth" timestamptz null, add column if not exists "anniversary_date" timestamptz null, add column if not exists "preferred_greeting_language" text not null default 'en', add column if not exists "greeting_opt_in" boolean not null default true, add column if not exists "whatsapp_opt_in" boolean not null default true, add column if not exists "sms_opt_in" boolean not null default true, add column if not exists "email_opt_in" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "billing_estimate_item" drop constraint if exists "billing_estimate_item_estimate_id_foreign";`);

    this.addSql(`alter table if exists "billing_greeting_history" drop constraint if exists "billing_greeting_history_template_id_foreign";`);

    this.addSql(`drop table if exists "billing_estimate" cascade;`);

    this.addSql(`drop table if exists "billing_estimate_item" cascade;`);

    this.addSql(`drop table if exists "billing_greeting_occasion" cascade;`);

    this.addSql(`drop table if exists "billing_greeting_settings" cascade;`);

    this.addSql(`drop table if exists "billing_greeting_template" cascade;`);

    this.addSql(`drop table if exists "billing_greeting_history" cascade;`);

    this.addSql(`alter table if exists "billing_customer" drop column if exists "date_of_birth", drop column if exists "anniversary_date", drop column if exists "preferred_greeting_language", drop column if exists "greeting_opt_in", drop column if exists "whatsapp_opt_in", drop column if exists "sms_opt_in", drop column if exists "email_opt_in";`);
  }

}
