import type { VercelRequest, VercelResponse } from '@vercel/node';

import { listConfiguredModels } from '../lib/models.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    defaultPreset: 'default',
    models: listConfiguredModels(),
  });
}
