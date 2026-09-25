import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260920094033 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "metal_purity" drop constraint if exists "metal_purity_metal_purity_code_unique";`);
    this.addSql(`create table if not exists "metal_purity" ("id" text not null, "purity_code" text not null, "metal" text check ("metal" in ('GOLD', 'SILVER', 'PLATINUM', 'OTHER')) not null, "display_name" text not null, "factor" numeric not null, "is_active" boolean not null default true, "raw_factor" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "metal_purity_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_metal_purity_deleted_at" ON "metal_purity" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_metal_purity_metal_purity_code_unique" ON "metal_purity" ("metal", "purity_code") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "metal_rate" ("id" text not null, "metal" text check ("metal" in ('GOLD', 'SILVER', 'PLATINUM', 'OTHER')) not null, "purity_code" text not null, "rate_per_gram" numeric not null, "effective_from" timestamptz not null, "effective_until" timestamptz null, "is_current" boolean not null default true, "created_by" text null, "notes" text null, "raw_rate_per_gram" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "metal_rate_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_metal_rate_deleted_at" ON "metal_rate" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_metal_rate_metal_purity_code_is_current" ON "metal_rate" ("metal", "purity_code", "is_current") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_metal_rate_effective_from" ON "metal_rate" ("effective_from") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "metal_purity" cascade;`);

    this.addSql(`drop table if exists "metal_rate" cascade;`);
  }

}
