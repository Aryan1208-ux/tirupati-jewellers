/**
 * Metal Rate Provider Factory
 * 
 * Reads METAL_RATE_PROVIDER and METAL_RATE_API_KEY from environment
 * and returns the appropriate provider implementation.
 * 
 * Supported providers:
 *   - "goldapi" → GoldAPI.io (Live Spot Market)
 * 
 * Returns null if no provider is configured.
 * Never exposes API keys to the client.
 */

import { MetalRateProvider } from "./types"
import { GoldApiProvider } from "./goldapi"

export function getMetalRateProvider(): MetalRateProvider | null {
  const providerName = process.env.METAL_RATE_PROVIDER?.toLowerCase()?.trim()
  const apiKey = process.env.METAL_RATE_API_KEY?.trim()

  if (!providerName) {
    return null
  }

  if (!apiKey) {
    console.warn(`[MetalRateProvider] METAL_RATE_PROVIDER="${providerName}" is set but METAL_RATE_API_KEY is missing.`)
    return null
  }

  switch (providerName) {
    case "goldapi":
      return new GoldApiProvider(apiKey)
    default:
      console.warn(`[MetalRateProvider] Unknown provider: "${providerName}". Supported: goldapi`)
      return null
  }
}

export function getRefreshIntervalMinutes(): number {
  const val = parseInt(process.env.METAL_RATE_REFRESH_MINUTES || "15", 10)
  return isNaN(val) || val < 1 ? 15 : val
}

export function getMaxStalenessMinutes(): number {
  const val = parseInt(process.env.METAL_RATE_MAX_STALENESS_MINUTES || "60", 10)
  return isNaN(val) || val < 1 ? 60 : val
}

export { MetalRateProvider, MetalRateQuote, ProviderStatus } from "./types"
