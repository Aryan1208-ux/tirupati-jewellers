/**
 * Admin Provider Status API
 * 
 * Returns the current state of the metal rate provider.
 * Does NOT expose API keys.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getProviderStatus } from "../../../../jobs/metal-rate-fetcher";
import { getRefreshIntervalMinutes, getMaxStalenessMinutes } from "../../../../lib/metal-rate-providers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const status = getProviderStatus();

  res.json({
    provider: status.provider_name || null,
    display_name: status.provider_display_name || null,
    source_type: status.source_type || null,
    is_available: status.is_available,
    is_configured: !!status.provider_name,
    last_success_at: status.last_success_at?.toISOString() || null,
    last_failure_at: status.last_failure_at?.toISOString() || null,
    last_error: status.last_error,
    quotes_persisted: status.quotes_persisted,
    config: {
      refresh_interval_minutes: getRefreshIntervalMinutes(),
      max_staleness_minutes: getMaxStalenessMinutes(),
    },
  });
};
