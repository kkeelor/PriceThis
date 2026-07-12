import ReactNativeBlobUtil from 'react-native-blob-util';

const SCAN_IMAGES_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/scan-images`;

function scanImagePath(scanId: string): string {
  return `${SCAN_IMAGES_DIR}/${scanId}.jpg`;
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

export async function persistHeroImage(
  scanId: string,
  sourceUri?: string,
): Promise<string | undefined> {
  if (!sourceUri?.trim()) {
    return undefined;
  }

  try {
    await ReactNativeBlobUtil.fs.mkdir(SCAN_IMAGES_DIR);
    const destination = scanImagePath(scanId);

    if (/^https?:\/\//i.test(sourceUri)) {
      const response = await ReactNativeBlobUtil.config({
        path: destination,
        fileCache: false,
      }).fetch('GET', sourceUri);

      if (response.info().status !== 200) {
        return undefined;
      }

      return toFileUri(destination);
    }

    const normalizedSource = sourceUri.replace('file://', '');

    if (sourceUri.startsWith('content://')) {
      await ReactNativeBlobUtil.fs.cp(sourceUri, destination);
    } else {
      await ReactNativeBlobUtil.fs.cp(normalizedSource, destination);
    }

    return toFileUri(destination);
  } catch {
    return /^https?:\/\//i.test(sourceUri) ? undefined : sourceUri;
  }
}

export async function deleteScanImage(scanId: string): Promise<void> {
  try {
    const path = scanImagePath(scanId);
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      await ReactNativeBlobUtil.fs.unlink(path);
    }
  } catch {
    // ignore missing files
  }
}

export async function deleteAllScanImages(): Promise<void> {
  try {
    if (await ReactNativeBlobUtil.fs.exists(SCAN_IMAGES_DIR)) {
      await ReactNativeBlobUtil.fs.unlink(SCAN_IMAGES_DIR);
    }
  } catch {
    // ignore
  }
}
