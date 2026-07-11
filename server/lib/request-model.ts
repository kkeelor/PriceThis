import type { VercelRequest } from '@vercel/node';
import type { IncomingMessage } from 'node:http';

import { resolveModel } from './models.js';

type ModelCarrier = {
  model?: string;
};

export function getRequestedModel(
  req: VercelRequest | IncomingMessage,
  body?: ModelCarrier,
): string | undefined {
  const headerValue = req.headers['x-claude-model'];
  const fromHeader = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;

  return body?.model?.trim() || fromHeader?.trim() || undefined;
}

export function withModelMeta<T extends Record<string, unknown>>(
  result: T,
  requestedModel?: string,
): T & { meta: { modelId: string; preset?: string } } {
  const resolved = resolveModel(requestedModel);

  return {
    ...result,
    meta: {
      modelId: resolved.id,
      ...(resolved.preset ? { preset: resolved.preset } : {}),
    },
  };
}
