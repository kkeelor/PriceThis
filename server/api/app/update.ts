import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type AppUpdateManifest = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes?: string;
};

function loadManifest(): AppUpdateManifest {
  const manifestPath = join(process.cwd(), 'public', 'releases', 'manifest.json');
  const raw = readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw) as AppUpdateManifest;

  if (!parsed.versionCode || !parsed.versionName || !parsed.apkUrl) {
    throw new Error('Invalid update manifest');
  }

  return parsed;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const manifest = loadManifest();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(manifest);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update manifest unavailable';
    return res.status(500).json({ error: message });
  }
}
