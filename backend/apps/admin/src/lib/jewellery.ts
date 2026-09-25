export type JewelleryType = 
  | "RING" 
  | "NECKLACE" 
  | "EARRINGS" 
  | "BRACELET" 
  | "BANGLE" 
  | "PENDANT" 
  | "CHAIN" 
  | "NOSE_PIN" 
  | "ANKLET" 
  | "OTHER";

export type MetalType = "GOLD" | "SILVER" | "PLATINUM" | "OTHER";

export type ChargeType = "FIXED" | "PER_GRAM" | "PERCENTAGE";

export interface Charge {
  type: ChargeType;
  value: number;
}

export interface DiamondData {
  carat?: number;
  shape?: string;
  color?: string;
  clarity?: string;
  cut?: string;
}

export interface CertificateData {
  type?: string;
  provider?: string;
  number?: string;
  url?: string;
  issued_at?: string;
}

export type Gender = "MEN" | "WOMEN" | "UNISEX" | "OTHER";

export interface JewelleryMetadata {
  schema_version: 1;
  jewellery_type?: JewelleryType;
  metal_type?: MetalType;
  purity?: string; // e.g., "22K"
  
  gross_weight_g?: number;
  net_weight_g?: number;
  
  hsn_sac?: string;
  
  making_charge?: Charge;
  stone_charge?: Charge;
  diamond_charge?: Charge;
  
  diamond?: DiamondData;
  certificate?: CertificateData;
  gender?: Gender;
  pricing_mode?: "FIXED" | "DYNAMIC";
}

export function validateJewelleryMetadata(data: any): JewelleryMetadata {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid metadata format");
  }

  const result: JewelleryMetadata = { schema_version: 1, pricing_mode: data.pricing_mode === "DYNAMIC" ? "DYNAMIC" : "FIXED" };

  if (data.jewellery_type) result.jewellery_type = data.jewellery_type;
  if (data.metal_type) result.metal_type = data.metal_type;
  if (data.purity) result.purity = String(data.purity);

  
  if (data.gross_weight_g !== undefined && data.gross_weight_g !== null && data.gross_weight_g !== "") {
    const gw = Number(data.gross_weight_g);
    if (isNaN(gw) || gw < 0) throw new Error("Gross weight must be a positive number.");
    result.gross_weight_g = gw;
  }

  if (data.net_weight_g !== undefined && data.net_weight_g !== null && data.net_weight_g !== "") {
    const nw = Number(data.net_weight_g);
    if (isNaN(nw) || nw < 0) throw new Error("Net weight must be a positive number.");
    if (result.gross_weight_g !== undefined && nw > result.gross_weight_g) {
      throw new Error("Net weight cannot exceed gross weight.");
    }
    result.net_weight_g = nw;
  }

  if (data.hsn_sac) {
    result.hsn_sac = String(data.hsn_sac).trim();
  }

  const parseCharge = (charge: any): Charge | undefined => {
    if (!charge || !charge.type || charge.value === undefined) return undefined;
    const val = Number(charge.value);
    if (isNaN(val) || val < 0) throw new Error("Charge value must be a positive number.");
    return { type: charge.type, value: val };
  };

  result.making_charge = parseCharge(data.making_charge);
  result.stone_charge = parseCharge(data.stone_charge);
  result.diamond_charge = parseCharge(data.diamond_charge);

  if (data.diamond) {
    result.diamond = {};
    if (data.diamond.carat !== undefined && data.diamond.carat !== "") {
      const carat = Number(data.diamond.carat);
      if (isNaN(carat) || carat < 0) throw new Error("Diamond carat must be a positive number.");
      result.diamond.carat = carat;
    }
    if (data.diamond.shape) result.diamond.shape = data.diamond.shape;
    if (data.diamond.color) result.diamond.color = data.diamond.color;
    if (data.diamond.clarity) result.diamond.clarity = data.diamond.clarity;
    if (data.diamond.cut) result.diamond.cut = data.diamond.cut;
  }

  if (data.certificate) {
    result.certificate = {};
    if (data.certificate.type) result.certificate.type = data.certificate.type;
    if (data.certificate.provider) result.certificate.provider = data.certificate.provider;
    if (data.certificate.number) result.certificate.number = data.certificate.number;
    if (data.certificate.url) {
      try {
        new URL(data.certificate.url);
        result.certificate.url = data.certificate.url;
      } catch (e) {
        throw new Error("Certificate URL must be a valid URL.");
      }
    }
    if (data.certificate.issued_at) result.certificate.issued_at = data.certificate.issued_at;
  }

  if (data.gender) result.gender = data.gender;

  if (result.pricing_mode === "DYNAMIC") {
    if (!result.metal_type) throw new Error("Metal type is required for DYNAMIC pricing.");
    if (!result.purity) throw new Error("Purity is required for DYNAMIC pricing.");
    if (!result.net_weight_g) throw new Error("Net weight is required for DYNAMIC pricing.");
  }

  return result;
}
