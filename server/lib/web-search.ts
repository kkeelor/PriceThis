import type Anthropic from '@anthropic-ai/sdk';

export function isWebSearchEnabled(): boolean {
  const value = process.env.CLAUDE_WEB_SEARCH?.trim().toLowerCase();
  return value !== 'false' && value !== '0';
}

export function getWebSearchMaxUses(): number {
  const raw = process.env.WEB_SEARCH_MAX_USES?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, 10);
}

export function resolveCountryCode(
  countryCode?: string,
  locale?: string,
): string | undefined {
  const trimmed = countryCode?.trim().toUpperCase();
  if (trimmed && /^[A-Z]{2}$/.test(trimmed)) {
    return trimmed;
  }

  const region = locale?.split('-')[1]?.toUpperCase();
  if (region && /^[A-Z]{2}$/.test(region)) {
    return region;
  }

  return undefined;
}

export function buildWebSearchTools(
  countryCode?: string,
  locale?: string,
): Anthropic.Messages.ToolUnion[] | undefined {
  if (!isWebSearchEnabled()) {
    return undefined;
  }

  const country = resolveCountryCode(countryCode, locale);
  const tool = {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: getWebSearchMaxUses(),
    allowed_callers: ['direct'],
    ...(country
      ? {
          user_location: {
            type: 'approximate',
            country,
          },
        }
      : {}),
  } as Anthropic.Messages.ToolUnion;

  return [tool];
}
