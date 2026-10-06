import { useState, useEffect, useCallback } from 'react';
import api from '../../../services';
import { ReleasesState, ReleaseItem } from './Downloads.types';

const INITIAL_RELEASES: ReleasesState = {
  extension: {
    version: '1.0.18',
    download_url: 'https://huggingface.co/datasets/Cong123779/tienhiep-releases/resolve/main/tts_extension-latest.zip',
    file_size: '8.5 MB',
    release_notes: 'Tiện ích Chrome Extension Trợ lý Dịch & Đọc Truyện AI siêu tinh gọn 8.5MB'
  },
  desktop_linux: {
    version: '1.0.18',
    download_url: 'https://huggingface.co/datasets/Cong123779/tienhiep-releases/resolve/main/TienHiepAI-latest.AppImage',
    file_size: '127 MB',
    release_notes: 'Phiên bản Linux AppImage siêu nhẹ 127MB, phản hồi 0ms và Go daemon'
  },
  desktop_windows: {
    version: '1.0.18',
    download_url: 'https://huggingface.co/datasets/Cong123779/tienhiep-releases/resolve/main/TienHiepAI-Setup-latest.exe',
    file_size: '93 MB',
    release_notes: 'Bản cài đặt Windows Setup EXE siêu tinh gọn 93MB với phản hồi 0ms'
  },
  android_apk: {
    version: '1.0.18',
    download_url: 'https://huggingface.co/datasets/Cong123779/tienhiep-releases/resolve/main/app-tienhiep-latest.apk',
    file_size: '26 MB',
    release_notes: 'Bản APK Android tối ưu 26MB, cảm ứng vật lý và tủ sách offline 0ms'
  },
  ios_ipa: {
    version: '1.0.18',
    download_url: 'https://huggingface.co/datasets/Cong123779/tienhiep-releases/resolve/main/TienHiepAI-latest.ipa',
    file_size: '22 MB',
    release_notes: 'Bản cài đặt IPA cho iPhone / iPad - Hỗ trợ cài qua AltStore, Sideloadly, TrollStore, Scarlet.'
  }
};

export function useDownloadsData() {
  const [releases, setReleases] = useState<ReleasesState>(INITIAL_RELEASES);
  const [selectedLinuxVersion, setSelectedLinuxVersion] = useState('');
  const [selectedWindowsVersion, setSelectedWindowsVersion] = useState('');

  const [adminPlat, setAdminPlat] = useState('extension');
  const [adminVersion, setAdminVersion] = useState('');
  const [adminUrl, setAdminUrl] = useState('');
  const [adminSize, setAdminSize] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const getAllReleases = useCallback((platformData?: ReleaseItem): ReleaseItem[] => {
    if (!platformData) return [];
    const history = platformData.history || [];
    const mainRelease = {
      version: platformData.version,
      download_url: platformData.download_url,
      patch_url: platformData.patch_url,
      file_size: platformData.file_size,
      release_notes: platformData.release_notes
    };
    const all = [mainRelease, ...history];
    const unique: ReleaseItem[] = [];
    const seen = new Set<string>();
    for (const r of all) {
      if (!r.version || !r.download_url || r.download_url === '#') continue;
      if (seen.has(r.version)) continue;
      seen.add(r.version);
      unique.push(r);
    }
    return unique;
  }, []);

  const fetchReleases = useCallback(async () => {
    try {
      const res = await api.get('/api/releases');
      if (res.data?.success && res.data.releases) {
        setReleases(prev => ({ ...prev, ...res.data.releases }));
        if (res.data.releases.desktop_linux) {
          const linuxList = getAllReleases(res.data.releases.desktop_linux);
          setSelectedLinuxVersion(linuxList[0]?.version || res.data.releases.desktop_linux.version);
        }
        if (res.data.releases.desktop_windows) {
          const winList = getAllReleases(res.data.releases.desktop_windows);
          setSelectedWindowsVersion(winList[0]?.version || res.data.releases.desktop_windows.version);
        }
      }
    } catch (e) {
      console.error("Failed to load releases from API:", e);
    }
  }, [getAllReleases]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    const platData = releases[adminPlat];
    if (platData) {
      setAdminVersion(platData.version || '');
      setAdminUrl(platData.download_url || '');
      setAdminSize(platData.file_size || '');
      setAdminNotes(platData.release_notes || '');
    }
  }, [adminPlat, releases]);

  const handleUpdateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setStatusMsg('');
    try {
      const res = await api.post('/api/releases/update', {
        platform: adminPlat,
        version: adminVersion,
        download_url: adminUrl,
        file_size: adminSize,
        release_notes: adminNotes
      });
      if (res.data?.success) {
        setStatusMsg("Cập nhật phiên bản thành công!");
        fetchReleases();
      } else {
        setStatusMsg("Thất bại: " + (res.data?.error || "Không rõ nguyên nhân"));
      }
    } catch (err: any) {
      setStatusMsg("Lỗi: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleAutoFillFromBuildFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let platform = 'extension';
    if (file.name.endsWith('.exe')) platform = 'desktop_windows';
    else if (file.name.endsWith('.AppImage')) platform = 'desktop_linux';
    else if (file.name.endsWith('.apk')) platform = 'android_apk';
    else if (file.name.endsWith('.zip')) platform = 'extension';

    const versionMatch = file.name.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : '1.0.0';
    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = `${sizeInMB.toFixed(0)} MB`;
    const cleanName = file.name.replace(/\s+/g, '-');

    let downloadUrl = '';
    if (platform === 'extension') downloadUrl = '/downloads/tts_extension.zip';
    else if (platform === 'android_apk') downloadUrl = '/downloads/app-tienhiep.apk';
    else downloadUrl = `https://huggingface.co/datasets/Cong123779/tienhiep-data/resolve/main/downloads/${cleanName}`;

    setAdminPlat(platform);
    setAdminVersion(version);
    setAdminSize(formattedSize);
    setAdminUrl(downloadUrl);
    setAdminNotes(`Bản cài đặt chính thức v${version} tối ưu hóa hiệu năng, sửa lỗi và cập nhật từ điển.`);
    setStatusMsg(`Đã tự động điền từ tệp: ${file.name}`);
  };

  return {
    releases,
    selectedLinuxVersion,
    setSelectedLinuxVersion,
    selectedWindowsVersion,
    setSelectedWindowsVersion,
    adminPlat,
    setAdminPlat,
    adminVersion,
    setAdminVersion,
    adminUrl,
    setAdminUrl,
    adminSize,
    setAdminSize,
    adminNotes,
    setAdminNotes,
    updating,
    statusMsg,
    getAllReleases,
    handleUpdateRelease,
    handleAutoFillFromBuildFile
  };
}
