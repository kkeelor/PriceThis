import type { VercelRequest } from '@vercel/node';
import type { IncomingMessage } from 'node:http';

import { resolveScanTarget } from './resolve-scan.js';
import type { PipelineMeta } from './scan-pipeline.js';

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

export function withScanMeta<T extends Record<string, unknown>>(
  result: T,
  requestedModel?: string,
  pipeline?: PipelineMeta,
): T & {
  meta: {
    modelId: string;
    provider: 'claude' | 'gemini';
    preset?: string;
    pipeline?: PipelineMeta;
  };
} {
  const target = resolveScanTarget(requestedModel);

  return {
    ...result,
    meta: {
      modelId: target.modelId,
      provider: target.provider,
      ...(target.preset ? { preset: target.preset } : {}),
      ...(pipeline ? { pipeline } : {}),
    },
  };
}

/** @deprecated Use withScanMeta */
export function withModelMeta<T extends Record<string, unknown>>(
  result: T,
  requestedModel?: string,
): T & { meta: { modelId: string; preset?: string } } {
  return withScanMeta(result, requestedModel);
}
