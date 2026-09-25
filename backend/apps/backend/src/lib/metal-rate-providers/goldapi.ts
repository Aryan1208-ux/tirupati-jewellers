/**
 * GoldAPI.io Provider Implementation
 * 
 * Source Type: LIVE SPOT MARKET DATA
 * 
 * GoldAPI.io provides real-time precious metal spot prices derived from
 * international commodities markets. This is NOT IBJA benchmark data.
 * 
 * The rates returned are RAW MARKET SPOT RATES.
 * They are NOT Tirupati Jewellers' selling prices.
 * 
 * API Docs: https://www.goldapi.io/dashboard
 * Endpoint: https://www.goldapi.io/api/price/{symbol}/{currency}
 * Auth: x-access-token header
 * 
 * Gold response includes melt_price_per_gram with 24k, 22k, 18k breakdowns.
 * Silver response gives price per troy oz — must normalize to per gram.
 * 
 * 1 troy oz = 31.1035 grams
 */

import { MetalRateProvider, MetalRateQuote, ProviderStatus } from "./types"

const GOLDAPI_BASE_URL = "https://www.goldapi.io/api"
const TROY_OZ_TO_GRAMS = 31.1035

// Reasonable bounds for validation (INR per gram)
const GOLD_MIN_PER_GRAM = 3000   // ~$35/g absolute floor
const GOLD_MAX_PER_GRAM = 30000  // ~$350/g absolute ceiling
const SILVER_MIN_PER_GRAM = 30   // ~$0.35/g floor
const SILVER_MAX_PER_GRAM = 500  // ~$6/g ceiling

interface GoldApiResponse {
  timestamp: number
  metal: string
  currency: string
  exchange: string
  symbol: string
  prev_close_price: number
  open_price: number
  low_price: number
  high_price: number
  open_time: number
  price: number
  ch: number
  chp: number
  ask: number
  bid: number
  price_gram_24k?: number
  price_gram_22k?: number
  price_gram_18k?: number
  price_gram_14k?: number
  melt_price_per_gram?: {
    "24k"?: number
    "22k"?: number
    "18k"?: number
    "14k"?: number
  }
}

export class GoldApiProvider implements MetalRateProvider {
  readonly name = "goldapi"
  readonly displayName = "GoldAPI.io — Live Spot Market"
  readonly sourceType = "MARKET_SPOT_RATE"

  private apiKey: string
  private lastSuccessAt: Date | null = null
  private lastFailureAt: Date | null = null
  private lastError: string | null = null

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async fetchPrice(symbol: string, currency: string = "INR"): Promise<GoldApiResponse> {
    const url = `${GOLDAPI_BASE_URL}/price/${symbol}/${currency}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-access-token": this.apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      if (response.status === 401 || response.status === 403) {
        throw new Error(`GoldAPI authentication failed (${response.status}): Check METAL_RATE_API_KEY`)
      }
      if (response.status === 429) {
        throw new Error(`GoldAPI rate limit exceeded (429): Reduce fetch frequency`)
      }
      throw new Error(`GoldAPI HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // Validate response structure
    if (!data || typeof data.price !== "number") {
      throw new Error("GoldAPI returned malformed response: missing 'price' field")
    }
    if (!data.timestamp || typeof data.timestamp !== "number") {
      throw new Error("GoldAPI returned malformed response: missing 'timestamp' field")
    }
    if (data.currency !== currency) {
      throw new Error(`GoldAPI currency mismatch: expected ${currency}, got ${data.currency}`)
    }

    return data
  }

  async getLatestGoldRates(): Promise<MetalRateQuote[]> {
    try {
      const data = await this.fetchPrice("XAU", "INR")
      const sourceTimestamp = new Date(data.timestamp * 1000)
      const quotes: MetalRateQuote[] = []

      // GoldAPI returns price_gram_24k/22k/18k/14k OR melt_price_per_gram
      const gram24k = data.price_gram_24k || data.melt_price_per_gram?.["24k"]
      const gram22k = data.price_gram_22k || data.melt_price_per_gram?.["22k"]
      const gram18k = data.price_gram_18k || data.melt_price_per_gram?.["18k"]
      const gram14k = data.price_gram_14k || data.melt_price_per_gram?.["14k"]

      // If provider gives per-gram rates directly, use them as DIRECT
      // If we only have the troy oz price, derive per-gram ourselves
      const hasDirectGramRates = !!(gram24k && gram24k > 0)

      if (hasDirectGramRates) {
        // Provider supplies karat-specific gram rates directly
        if (gram24k && this.validateGoldRate(gram24k)) {
          quotes.push({
            metal: "GOLD",
            purity_code: "24K",
            rate_per_gram: Math.round(gram24k * 100) / 100,
            source_symbol: "XAU",
            source_timestamp: sourceTimestamp,
            source_currency: "INR",
            source_unit: "gram",
            source_rate: gram24k,
            rate_derivation: "DIRECT_PROVIDER_RATE",
          })
        }

        if (gram22k && this.validateGoldRate(gram22k)) {
          quotes.push({
            metal: "GOLD",
            purity_code: "22K",
            rate_per_gram: Math.round(gram22k * 100) / 100,
            source_symbol: "XAU",
            source_timestamp: sourceTimestamp,
            source_currency: "INR",
            source_unit: "gram",
            source_rate: gram22k,
            rate_derivation: "DIRECT_PROVIDER_RATE",
          })
        }

        if (gram18k && this.validateGoldRate(gram18k)) {
          quotes.push({
            metal: "GOLD",
            purity_code: "18K",
            rate_per_gram: Math.round(gram18k * 100) / 100,
            source_symbol: "XAU",
            source_timestamp: sourceTimestamp,
            source_currency: "INR",
            source_unit: "gram",
            source_rate: gram18k,
            rate_derivation: "DIRECT_PROVIDER_RATE",
          })
        }

        if (gram14k && this.validateGoldRate(gram14k)) {
          quotes.push({
            metal: "GOLD",
            purity_code: "14K",
            rate_per_gram: Math.round(gram14k * 100) / 100,
            source_symbol: "XAU",
            source_timestamp: sourceTimestamp,
            source_currency: "INR",
            source_unit: "gram",
            source_rate: gram14k,
            rate_derivation: "DIRECT_PROVIDER_RATE",
          })
        }
      } else {
        // Derive from troy oz price
        const pricePerGram24k = data.price / TROY_OZ_TO_GRAMS
        if (this.validateGoldRate(pricePerGram24k)) {
          quotes.push({
            metal: "GOLD",
            purity_code: "24K",
            rate_per_gram: Math.round(pricePerGram24k * 100) / 100,
            source_symbol: "XAU",
            source_timestamp: sourceTimestamp,
            source_currency: "INR",
            source_unit: "troy_oz",
            source_rate: data.price,
            rate_derivation: "DERIVED_RATE",
          })

          // Derive lower purities from 24K
          const purities = [
            { code: "22K", factor: 0.9167 },
            { code: "18K", factor: 0.7500 },
            { code: "14K", factor: 0.5833 },
          ]
          for (const p of purities) {
            const derived = pricePerGram24k * p.factor
            quotes.push({
              metal: "GOLD",
              purity_code: p.code,
              rate_per_gram: Math.round(derived * 100) / 100,
              source_symbol: "XAU",
              source_timestamp: sourceTimestamp,
              source_currency: "INR",
              source_unit: "troy_oz",
              source_rate: data.price,
              rate_derivation: "DERIVED_RATE",
            })
          }
        }
      }

      this.lastSuccessAt = new Date()
      this.lastError = null
      return quotes
    } catch (error: any) {
      this.lastFailureAt = new Date()
      this.lastError = error.message
      throw error
    }
  }

  async getLatestSilverRates(): Promise<MetalRateQuote[]> {
    try {
      const data = await this.fetchPrice("XAG", "INR")
      const sourceTimestamp = new Date(data.timestamp * 1000)

      // Silver price from GoldAPI is per troy oz
      const pricePerGram = data.price / TROY_OZ_TO_GRAMS

      if (!this.validateSilverRate(pricePerGram)) {
        throw new Error(`Silver rate ${pricePerGram} INR/g outside reasonable bounds [${SILVER_MIN_PER_GRAM}-${SILVER_MAX_PER_GRAM}]`)
      }

      this.lastSuccessAt = new Date()
      this.lastError = null

      return [{
        metal: "SILVER",
        purity_code: "999",
        rate_per_gram: Math.round(pricePerGram * 100) / 100,
        source_symbol: "XAG",
        source_timestamp: sourceTimestamp,
        source_currency: "INR",
        source_unit: "troy_oz",
        source_rate: data.price,
        rate_derivation: "DERIVED_RATE",
      }]
    } catch (error: any) {
      this.lastFailureAt = new Date()
      this.lastError = error.message
      throw error
    }
  }

  async checkStatus(): Promise<ProviderStatus> {
    try {
      // Make a lightweight call to verify connectivity
      await this.fetchPrice("XAU", "INR")
      this.lastSuccessAt = new Date()
      this.lastError = null
      return {
        provider: this.name,
        is_available: true,
        last_success_at: this.lastSuccessAt,
        last_failure_at: this.lastFailureAt,
        last_error: null,
        source_type: this.sourceType,
      }
    } catch (error: any) {
      this.lastFailureAt = new Date()
      this.lastError = error.message
      return {
        provider: this.name,
        is_available: false,
        last_success_at: this.lastSuccessAt,
        last_failure_at: this.lastFailureAt,
        last_error: error.message,
        source_type: this.sourceType,
      }
    }
  }

  private validateGoldRate(ratePerGram: number): boolean {
    return ratePerGram > GOLD_MIN_PER_GRAM && ratePerGram < GOLD_MAX_PER_GRAM
  }

  private validateSilverRate(ratePerGram: number): boolean {
    return ratePerGram > SILVER_MIN_PER_GRAM && ratePerGram < SILVER_MAX_PER_GRAM
  }
}
