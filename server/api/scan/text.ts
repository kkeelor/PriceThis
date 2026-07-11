import type { VercelRequest, VercelResponse } from '@vercel/node';

import { scanTextWithClaude } from '../../lib/claude.js';
import { getMarketContextForQuery } from '../../lib/market-data.js';
import { getRequestedModel, withModelMeta } from '../../lib/request-model.js';
import type { ScanTextRequest } from '../../lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as ScanTextRequest;
    if (!body?.query?.trim() || !body.currencyCode || !body.locale) {
      return res.status(400).json({ error: 'query, locale, and currencyCode are required' });
    }

    const requestedModel = getRequestedModel(req, body);
    const marketContext = await getMarketContextForQuery(body.query);
    const result = await scanTextWithClaude({
      query: body.query.trim(),
      locale: body.locale,
      currencyCode: body.currencyCode,
      marketContext,
      model: requestedModel,
    });

    return res.status(200).json(withModelMeta(result, requestedModel));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed';
    return res.status(500).json({ error: message });
  }
}
