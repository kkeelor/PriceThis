import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import type { View } from 'react-native';

import type { ScanResult } from '@/types/scan';

export async function captureAndShareResultCard(
  cardRef: View | null,
  result: ScanResult,
  formattedValue: string,
): Promise<void> {
  if (!cardRef) {
    await Share.open({
      title: result.objectName,
      message: [
        result.objectName,
        `Worth about ${formattedValue}`,
        '',
        result.wowInsight,
        '',
        'Scanned with PriceThis',
      ].join('\n'),
    });
    return;
  }

  const uri = await captureRef(cardRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  await Share.open({
    title: result.objectName,
    url: uri,
    type: 'image/png',
    message: `${result.objectName} — ${formattedValue}`,
  });
}
