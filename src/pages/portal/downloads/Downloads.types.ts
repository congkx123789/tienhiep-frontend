export interface ReleaseItem {
  version: string;
  download_url: string;
  patch_url?: string;
  file_size: string;
  release_notes: string;
  history?: ReleaseItem[];
}

export interface ReleasesState {
  extension: ReleaseItem;
  desktop_linux: ReleaseItem;
  desktop_windows: ReleaseItem;
  android_apk: ReleaseItem;
  ios_ipa: ReleaseItem;
  [key: string]: ReleaseItem;
}

export interface AdminFormState {
  platform: string;
  version: string;
  downloadUrl: string;
  fileSize: string;
  notes: string;
}
