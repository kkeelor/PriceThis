import http from 'node:http';

import { buildProductListings } from './lib/listings.js';
import { fetchItemImageUrl } from './lib/item-image.js';
import { getMarketContextForImageLabel } from './lib/market-data.js';
import { getMarketContextForQuery } from './lib/market-data.js';
import { getRequestedModel, withScanMeta } from './lib/request-model.js';
import { isPipelineEnabled } from './lib/scan-gates.js';
import { isGeminiConfigured } from './lib/resolve-scan.js';
import { runImageScanPipeline, runTextScanPipeline } from './lib/scan-pipeline.js';
import type { ScanImageRequest, ScanTextRequest } from './lib/types.js';

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      pipelineEnabled: isPipelineEnabled(),
      geminiConfigured: isGeminiConfigured(),
    });
  }

  if (req.method === 'GET' && req.url === '/api/models') {
    return sendJson(res, 200, {
      defaultPreset: 'gemini',
      models: [
        {
          preset: 'gemini',
          envVar: 'GEMINI_MODEL',
          modelId: process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite',
          configured: isGeminiConfigured(),
        },
      ],
    });
  }

  if (req.method === 'POST' && req.url === '/api/scan/text') {
    try {
      const body = await readJsonBody<ScanTextRequest>(req);
      if (!body?.query?.trim() || !body.currencyCode || !body.locale) {
        return sendJson(res, 400, { error: 'query, locale, and currencyCode are required' });
      }

      const requestedModel = getRequestedModel(req, body);
      const marketContext = await getMarketContextForQuery(body.query);
      const { result, pipeline } = await runTextScanPipeline({
        query: body.query.trim(),
        locale: body.locale,
        currencyCode: body.currencyCode,
        countryCode: body.countryCode,
        marketContext,
        model: requestedModel,
      });

      const heroImageUrl = await fetchItemImageUrl(result.objectName);

      return sendJson(
        res,
        200,
        withScanMeta(
          {
            ...result,
            heroImageUrl,
            listings: buildProductListings(result.objectName, body.locale),
          },
          requestedModel,
          pipeline,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      return sendJson(res, 500, { error: message });
    }
  }

  if (req.method === 'POST' && req.url === '/api/scan/image') {
    try {
      const body = await readJsonBody<ScanImageRequest>(req);
      if (!body?.imageBase64 || !body.currencyCode || !body.locale) {
        return sendJson(res, 400, {
          error: 'imageBase64, locale, and currencyCode are required',
        });
      }

      const requestedModel = getRequestedModel(req, body);
      const marketContext = await getMarketContextForImageLabel();
      const { result, pipeline } = await runImageScanPipeline({
        imageBase64: body.imageBase64,
        locale: body.locale,
        currencyCode: body.currencyCode,
        countryCode: body.countryCode,
        marketContext,
        model: requestedModel,
      });

      return sendJson(res, 200, withScanMeta(result, requestedModel, pipeline));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      return sendJson(res, 500, { error: message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  const hasKey = isGeminiConfigured();
  console.log(`PriceThis API listening on http://localhost:${PORT}`);
  console.log(hasKey ? 'Gemini API key: configured' : 'Gemini API key: MISSING — add to server/.env');
});
