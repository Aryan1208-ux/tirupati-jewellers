import { model } from "@medusajs/framework/utils";

export const MetalPurity = model.define("metal_purity", {
  id: model.id().primaryKey(),
  purity_code: model.text(), // e.g. '22K', '925'
  metal: model.enum(["GOLD", "SILVER", "PLATINUM", "OTHER"]),
  display_name: model.text(), // e.g. "22K Gold"
  factor: model.bigNumber(), // numeric decimal factor, e.g. 0.9167 for 22K
  is_active: model.boolean().default(true),
}).indexes([
  { on: ["metal", "purity_code"], unique: true }
]);
