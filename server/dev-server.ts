import http from 'node:http';

import { scanImageWithClaude, scanTextWithClaude } from './lib/claude.js';
import { getMarketContextForImageLabel } from './lib/market-data.js';
import { getMarketContextForQuery } from './lib/market-data.js';
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
      claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    });
  }

  if (req.method === 'POST' && req.url === '/api/scan/text') {
    try {
      const body = await readJsonBody<ScanTextRequest>(req);
      if (!body?.query?.trim() || !body.currencyCode || !body.locale) {
        return sendJson(res, 400, { error: 'query, locale, and currencyCode are required' });
      }

      const marketContext = await getMarketContextForQuery(body.query);
      const result = await scanTextWithClaude({
        query: body.query.trim(),
        locale: body.locale,
        currencyCode: body.currencyCode,
        marketContext,
      });

      return sendJson(res, 200, result);
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

      const marketContext = await getMarketContextForImageLabel();
      const result = await scanImageWithClaude({
        imageBase64: body.imageBase64,
        locale: body.locale,
        currencyCode: body.currencyCode,
        marketContext,
      });

      return sendJson(res, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      return sendJson(res, 500, { error: message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  console.log(`PriceThis API listening on http://localhost:${PORT}`);
  console.log(hasKey ? 'Claude API key: configured' : 'Claude API key: MISSING — add to server/.env');
});
