import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    defaultPreset: 'gemini',
    models: [
      {
        preset: 'gemini',
        envVar: 'GEMINI_MODEL',
        modelId: process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite',
        configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      },
    ],
  });
}
