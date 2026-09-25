import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260918210813 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "billing_invoice" add column if not exists "document_type" text check ("document_type" in ('INV', 'CRN', 'DBN')) not null default 'INV', add column if not exists "supply_type" text check ("supply_type" in ('B2B', 'B2C', 'SEZWP', 'SEZWOP', 'EXPWP', 'EXPWOP', 'DEXP')) not null default 'B2C', add column if not exists "e_invoice_status" text check ("e_invoice_status" in ('NOT_APPLICABLE', 'PENDING', 'SUBMITTING', 'GENERATED', 'FAILED', 'CANCELLED')) not null default 'NOT_APPLICABLE', add column if not exists "irn" text null, add column if not exists "ack_number" text null, add column if not exists "ack_date" timestamptz null, add column if not exists "signed_qr_code" text null, add column if not exists "signed_invoice" text null, add column if not exists "e_invoice_error" text null, add column if not exists "e_invoice_created_at" timestamptz null, add column if not exists "e_invoice_cancelled_at" timestamptz null, add column if not exists "e_invoice_cancel_reason" text null, add column if not exists "provider" text null, add column if not exists "environment" text null, add column if not exists "request_reference" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "billing_invoice" drop column if exists "document_type", drop column if exists "supply_type", drop column if exists "e_invoice_status", drop column if exists "irn", drop column if exists "ack_number", drop column if exists "ack_date", drop column if exists "signed_qr_code", drop column if exists "signed_invoice", drop column if exists "e_invoice_error", drop column if exists "e_invoice_created_at", drop column if exists "e_invoice_cancelled_at", drop column if exists "e_invoice_cancel_reason", drop column if exists "provider", drop column if exists "environment", drop column if exists "request_reference";`);
  }

}
