import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260921150721 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "customer_activity" ("id" text not null, "customer_id" text null, "anonymous_id" text null, "session_id" text null, "event_type" text not null, "product_id" text null, "variant_id" text null, "category_id" text null, "search_query" text null, "page_path" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_activity_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_activity_deleted_at" ON "customer_activity" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "customer_activity" cascade;`);
  }

}
