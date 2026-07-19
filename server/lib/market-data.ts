/**
 * Optional market-data enrichment layer.
 * v1 uses Gemini as the primary source; this hook can be wired to public APIs
 * (e.g. vehicle listings, watch indexes) when a confident match exists.
 */
export async function getMarketContextForQuery(query: string): Promise<string | undefined> {
  if (process.env.MARKET_DATA_ENABLED !== 'true') {
    return undefined;
  }

  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return undefined;
  }

  // Placeholder for category-specific providers. Keeping async boundary now
  // so handlers stay stable when real integrations land.
  return undefined;
}

export async function getMarketContextForImageLabel(
  _labelHint?: string,
): Promise<string | undefined> {
  if (process.env.MARKET_DATA_ENABLED !== 'true') {
    return undefined;
  }

  return undefined;
}
