declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    APP_VERSION_CODE?: string;
    APP_VERSION_NAME?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
