import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260923214103 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "billing_greeting_history" drop constraint if exists "billing_greeting_history_status_check";`);

    this.addSql(`alter table if exists "billing_greeting_occasion" add column if not exists "end_date" timestamptz not null, add column if not exists "greeting_text" text null, add column if not exists "bill_greeting_text" text null, add column if not exists "enable_on_bill" boolean not null default false;`);
    this.addSql(`alter table if exists "billing_greeting_occasion" rename column "occasion_date" to "start_date";`);

    this.addSql(`alter table if exists "billing_greeting_settings" add column if not exists "automation_enabled" boolean not null default false, add column if not exists "automatic_post_purchase" boolean not null default false, add column if not exists "post_purchase_delay_days" integer not null default 2;`);

    this.addSql(`alter table if exists "billing_greeting_history" add column if not exists "occasion_id" text null, add column if not exists "occasion_type" text check ("occasion_type" in ('BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL', 'CUSTOM', 'POST_PURCHASE')) not null default 'FESTIVAL', add column if not exists "scheduled_at" timestamptz null, add column if not exists "provider_message_id" text null;`);
    this.addSql(`alter table if exists "billing_greeting_history" add constraint "billing_greeting_history_status_check" check("status" in ('PENDING', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'));`);

    this.addSql(`alter table if exists "billing_invoice" add column if not exists "festival_id" text null, add column if not exists "festival_name" text null, add column if not exists "festival_greeting_text" text null, add column if not exists "festival_template_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "billing_greeting_history" drop constraint if exists "billing_greeting_history_status_check";`);

    this.addSql(`alter table if exists "billing_greeting_occasion" drop column if exists "end_date", drop column if exists "greeting_text", drop column if exists "bill_greeting_text", drop column if exists "enable_on_bill";`);

    this.addSql(`alter table if exists "billing_greeting_occasion" rename column "start_date" to "occasion_date";`);

    this.addSql(`alter table if exists "billing_greeting_settings" drop column if exists "automation_enabled", drop column if exists "automatic_post_purchase", drop column if exists "post_purchase_delay_days";`);

    this.addSql(`alter table if exists "billing_greeting_history" drop column if exists "occasion_id", drop column if exists "occasion_type", drop column if exists "scheduled_at", drop column if exists "provider_message_id";`);

    this.addSql(`alter table if exists "billing_greeting_history" add constraint "billing_greeting_history_status_check" check("status" in ('PENDING', 'SENT', 'FAILED'));`);

    this.addSql(`alter table if exists "billing_invoice" drop column if exists "festival_id", drop column if exists "festival_name", drop column if exists "festival_greeting_text", drop column if exists "festival_template_id";`);
  }

}
