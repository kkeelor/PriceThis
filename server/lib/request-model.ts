import type { VercelRequest } from '@vercel/node';
import type { IncomingMessage } from 'node:http';

import { resolveScanTarget } from './resolve-scan.js';
import type { PipelineMeta } from './scan-pipeline.js';

type ModelCarrier = {
  model?: string;
};

export function getRequestedModel(
  _req: VercelRequest | IncomingMessage,
  body?: ModelCarrier,
): string | undefined {
  return body?.model?.trim() || undefined;
}

export function withScanMeta<T extends Record<string, unknown>>(
  result: T,
  requestedModel?: string,
  pipeline?: PipelineMeta,
): T & {
  meta: {
    modelId: string;
    provider: 'gemini';
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
