/**
 * Metal Rate Provider Abstraction
 * 
 * This interface defines the contract for any external market data provider.
 * Implementations must return normalized data that the rate fetcher can
 * persist into the existing MetalRate module.
 * 
 * IMPORTANT DISTINCTIONS:
 * 
 * 1. MARKET_SPOT_RATE — Real-time or near-real-time spot price from
 *    international commodities markets (e.g. LBMA, COMEX).
 *    Example: GoldAPI.io XAU/INR live spot.
 * 
 * 2. IBJA_BENCHMARK — India Bullion and Jewellers Association publishes
 *    daily opening/closing benchmark rates for specific purities.
 *    This is NOT continuous live data.
 * 
 * 3. JEWELLERY_SELLING_RATE — The final customer-facing price set by
 *    a jeweller (includes making charges, margin, GST, etc.).
 *    This system does NOT set this automatically.
 * 
 * The provider returns RAW MARKET DATA. Any business adjustment
 * (markup, margin) is a separate configurable layer NOT implemented
 * in this provider.
 */

export interface MetalRateQuote {
  metal: "GOLD" | "SILVER"
  purity_code: string             // e.g. "24K", "22K", "999"
  rate_per_gram: number           // Normalized to INR per gram
  source_symbol: string           // e.g. "XAU", "XAG"
  source_timestamp: Date          // Provider's data timestamp
  source_currency: string         // e.g. "INR"
  source_unit: string             // Original unit from provider (e.g. "troy_oz", "gram", "kg")
  source_rate: number             // Raw rate in source_unit before normalization
  rate_derivation: "DIRECT_PROVIDER_RATE" | "DERIVED_RATE"
}

export interface ProviderStatus {
  provider: string
  is_available: boolean
  last_success_at: Date | null
  last_failure_at: Date | null
  last_error: string | null
  source_type: string             // "MARKET_SPOT_RATE" | "IBJA_BENCHMARK" etc.
}

export interface MetalRateProvider {
  /** Unique identifier for this provider (e.g. "goldapi") */
  readonly name: string

  /** Human-readable label (e.g. "GoldAPI.io — Live Spot Market") */
  readonly displayName: string

  /** What kind of data this provider returns */
  readonly sourceType: string

  /**
   * Fetch the latest gold rates for all supported purities.
   * Returns an array of quotes, one per purity the provider supports.
   * Throws on network/auth/validation failure.
   */
  getLatestGoldRates(): Promise<MetalRateQuote[]>

  /**
   * Fetch the latest silver rate.
   * Returns an array (typically one element for 999 silver).
   * Throws on network/auth/validation failure.
   */
  getLatestSilverRates(): Promise<MetalRateQuote[]>

  /**
   * Validate that the provider is configured and reachable.
   * Returns a status object.
   */
  checkStatus(): Promise<ProviderStatus>
}
