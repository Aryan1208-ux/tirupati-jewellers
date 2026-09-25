import { model } from "@medusajs/framework/utils";
import { MetalPurity } from "./purity";

export const MetalRate = model.define("metal_rate", {
  id: model.id().primaryKey(),
  metal: model.enum(["GOLD", "SILVER", "PLATINUM", "OTHER"]),
  purity_code: model.text(),
  rate_per_gram: model.bigNumber(), // Canonical internal unit INR/gram
  effective_from: model.dateTime(), // For scheduled rate changes
  effective_until: model.dateTime().nullable(), // Null if it's the current active rate
  is_current: model.boolean().default(true), // Fast lookup flag for active rates
  created_by: model.text().nullable(), // Admin ID or email
  notes: model.text().nullable(),

  // ── Phase 4C: Source Metadata ──────────────────────────────────────────
  source_type: model.enum(["AUTOMATIC", "MANUAL", "MANUAL_OVERRIDE"]).default("MANUAL"),
  provider: model.text().nullable(),               // e.g. "goldapi"
  source_symbol: model.text().nullable(),           // e.g. "XAU", "XAG"
  source_timestamp: model.dateTime().nullable(),    // Provider's data timestamp
  fetched_at: model.dateTime().nullable(),          // When we fetched from provider
  source_currency: model.text().nullable(),         // e.g. "INR"
  source_unit: model.text().nullable(),             // e.g. "troy_oz", "gram", "kg"
  source_rate: model.bigNumber().nullable(),        // Raw rate from provider before normalization
  rate_derivation: model.enum(["DIRECT_PROVIDER_RATE", "DERIVED_RATE", "MANUAL"]).default("MANUAL"),
  override_reason: model.text().nullable(),         // Reason for manual override
}).indexes([
  { on: ["metal", "purity_code", "is_current"] },
  { on: ["effective_from"] },
  { on: ["source_type"] },
  { on: ["provider", "source_timestamp", "metal", "purity_code"], unique: true },
]);
