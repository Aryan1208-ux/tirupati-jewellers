/**
 * Metal Rate Fetcher — Automatic Market Rate Scheduler
 * 
 * This job runs on a configurable schedule (default: every 15 minutes)
 * and fetches the latest gold and silver rates from the configured
 * external market data provider.
 * 
 * IMPORTANT RULES:
 * 1. Never overwrites future scheduled rates
 * 2. Never replaces rates with zero or random values
 * 3. On failure, keeps last valid persisted rate
 * 4. Deduplicates based on provider + source_timestamp + metal + purity
 * 5. All rates are persisted through the existing MetalRate model
 * 6. This DOES NOT affect Medusa product prices, cart, checkout, or invoices
 */

import { MedusaContainer } from "@medusajs/framework/types"
import { METAL_RATES_MODULE } from "../modules/metal-rates"
import { MetalRatesService } from "../modules/metal-rates/service"
import { getMetalRateProvider, getRefreshIntervalMinutes } from "../lib/metal-rate-providers"
import { MetalRateQuote } from "../lib/metal-rate-providers/types"

// In-memory provider status for the admin status API
let _providerStatus = {
  is_available: false,
  last_success_at: null as Date | null,
  last_failure_at: null as Date | null,
  last_error: null as string | null,
  provider_name: null as string | null,
  provider_display_name: null as string | null,
  source_type: null as string | null,
  quotes_persisted: 0,
}

export function getProviderStatus() {
  return { ..._providerStatus }
}

export default async function metalRateFetcherJob(
  container: MedusaContainer
) {
  const provider = getMetalRateProvider()

  if (!provider) {
    console.log("[MetalRateFetcher] No provider configured. Set METAL_RATE_PROVIDER and METAL_RATE_API_KEY.")
    _providerStatus.last_error = "PROVIDER_NOT_CONFIGURED"
    _providerStatus.is_available = false
    return
  }

  _providerStatus.provider_name = provider.name
  _providerStatus.provider_display_name = provider.displayName
  _providerStatus.source_type = provider.sourceType

  const metalRatesService = container.resolve<MetalRatesService>(METAL_RATES_MODULE)

  try {
    console.log(`[MetalRateFetcher] Fetching rates from ${provider.displayName}...`)

    // Fetch gold and silver in parallel
    const [goldQuotes, silverQuotes] = await Promise.allSettled([
      provider.getLatestGoldRates(),
      provider.getLatestSilverRates(),
    ])

    const allQuotes: MetalRateQuote[] = []

    if (goldQuotes.status === "fulfilled") {
      allQuotes.push(...goldQuotes.value)
    } else {
      console.error("[MetalRateFetcher] Gold fetch failed:", goldQuotes.reason?.message)
    }

    if (silverQuotes.status === "fulfilled") {
      allQuotes.push(...silverQuotes.value)
    } else {
      console.error("[MetalRateFetcher] Silver fetch failed:", silverQuotes.reason?.message)
    }

    if (allQuotes.length === 0) {
      const err = "No valid quotes received from provider"
      console.error(`[MetalRateFetcher] ${err}`)
      _providerStatus.is_available = false
      _providerStatus.last_failure_at = new Date()
      _providerStatus.last_error = err
      return
    }

    const now = new Date()
    let persisted = 0

    for (const quote of allQuotes) {
      try {
        // ── Duplicate Protection ──────────────────────────────────────
        // Check if we already have a rate with this exact provider+timestamp+metal+purity
        const existing = await metalRatesService.listMetalRates({
          metal: quote.metal,
          purity_code: quote.purity_code,
          provider: provider.name,
        })

        const isDuplicate = existing.some(r => {
          if (!r.source_timestamp) return false
          return new Date(r.source_timestamp).getTime() === quote.source_timestamp.getTime()
        })

        if (isDuplicate) {
          continue
        }

        // ── Future Rate Safety ────────────────────────────────────────
        // Ensure we do NOT set effective_from in the future.
        // The automatic rate effective_from is always NOW.
        const effectiveFrom = now

        // Persist rate snapshot
        await metalRatesService.createMetalRates({
          metal: quote.metal,
          purity_code: quote.purity_code,
          rate_per_gram: quote.rate_per_gram,
          effective_from: effectiveFrom,
          is_current: false,
          created_by: `auto:${provider.name}`,
          notes: `Automatic fetch from ${provider.displayName}`,
          source_type: "AUTOMATIC",
          provider: provider.name,
          source_symbol: quote.source_symbol,
          source_timestamp: quote.source_timestamp,
          fetched_at: now,
          source_currency: quote.source_currency,
          source_unit: quote.source_unit,
          source_rate: quote.source_rate,
          rate_derivation: quote.rate_derivation,
        } as any)

        persisted++
      } catch (err: any) {
        // If it's a unique constraint violation (duplicate), silently skip
        if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
          continue
        }
        console.error(`[MetalRateFetcher] Failed to persist ${quote.metal} ${quote.purity_code}:`, err.message)
      }
    }

    console.log(`[MetalRateFetcher] Successfully persisted ${persisted} rate snapshots.`)
    _providerStatus.is_available = true
    _providerStatus.last_success_at = now
    _providerStatus.last_error = null
    _providerStatus.quotes_persisted = persisted

  } catch (error: any) {
    console.error("[MetalRateFetcher] Fatal error:", error.message)
    _providerStatus.is_available = false
    _providerStatus.last_failure_at = new Date()
    _providerStatus.last_error = error.message
  }
}

// Medusa Job config
const refreshMinutes = getRefreshIntervalMinutes()
export const config = {
  name: "fetch-metal-rates",
  schedule: `*/${refreshMinutes} * * * *`,
}
