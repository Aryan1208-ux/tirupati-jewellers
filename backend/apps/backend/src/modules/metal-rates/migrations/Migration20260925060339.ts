import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260925060339 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "metal_rate" drop constraint if exists "metal_rate_provider_source_timestamp_metal_purity_code_unique";`);
    this.addSql(`alter table if exists "metal_rate" add column if not exists "source_type" text check ("source_type" in ('AUTOMATIC', 'MANUAL', 'MANUAL_OVERRIDE')) not null default 'MANUAL', add column if not exists "provider" text null, add column if not exists "source_symbol" text null, add column if not exists "source_timestamp" timestamptz null, add column if not exists "fetched_at" timestamptz null, add column if not exists "source_currency" text null, add column if not exists "source_unit" text null, add column if not exists "source_rate" numeric null, add column if not exists "rate_derivation" text check ("rate_derivation" in ('DIRECT_PROVIDER_RATE', 'DERIVED_RATE', 'MANUAL')) not null default 'MANUAL', add column if not exists "override_reason" text null, add column if not exists "raw_source_rate" jsonb null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_metal_rate_source_type" ON "metal_rate" ("source_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_metal_rate_provider_source_timestamp_metal_purity_code_unique" ON "metal_rate" ("provider", "source_timestamp", "metal", "purity_code") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_metal_rate_source_type";`);
    this.addSql(`drop index if exists "IDX_metal_rate_provider_source_timestamp_metal_purity_code_unique";`);
    this.addSql(`alter table if exists "metal_rate" drop column if exists "source_type", drop column if exists "provider", drop column if exists "source_symbol", drop column if exists "source_timestamp", drop column if exists "fetched_at", drop column if exists "source_currency", drop column if exists "source_unit", drop column if exists "source_rate", drop column if exists "rate_derivation", drop column if exists "override_reason", drop column if exists "raw_source_rate";`);
  }

}
