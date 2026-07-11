export type AppUpdateManifest = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes?: string;
};

export type AppUpdateCheck = {
  currentVersionCode: number;
  currentVersionName: string;
  updateAvailable: boolean;
  manifest?: AppUpdateManifest;
};
