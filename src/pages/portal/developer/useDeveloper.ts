import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import api from '../../../services';
import { ApiKeyItem, UsageItem } from './Developer.types';

export function useDeveloper() {
  const { user } = useAuth();
  const { t } = useLang();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [newKeyName, setNewKeyName] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Usage states
  const [usages, setUsages] = useState<UsageItem[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Sandbox states
  const [sandboxApiKey, setSandboxApiKey] = useState('');
  const [sandboxTtsText, setSandboxTtsText] = useState('武之极，破苍穹，动乾坤！Trong thế giới này, kẻ mạnh làm chủ.');
  const [sandboxTtsSpeed, setSandboxTtsSpeed] = useState(1.0);
  const [playingSandboxAudio, setPlayingSandboxAudio] = useState(false);
  const [loadingSandboxAudio, setLoadingSandboxAudio] = useState(false);
  const sandboxAudioRef = useRef<HTMLAudioElement | null>(null);

  const [sandboxTransText, setSandboxTransText] = useState('第1章 开封神殿\n杨开迈步走入神殿。');
  const [sandboxTransMode, setSandboxTransMode] = useState('fast');
  const [sandboxTransResult, setSandboxTransResult] = useState('');
  const [translatingSandbox, setTranslatingSandbox] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([fetchKeys(), fetchUsage()]);
    }
  }, [user]);

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await api.get('/api/developer/keys');
      const loadedKeys: ApiKeyItem[] = res.data.keys || [];
      setKeys(loadedKeys);
      setBalance(res.data.balance || 0);
      if (loadedKeys.length > 0) {
        setSandboxApiKey(loadedKeys[0].api_key);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchUsage = async () => {
    setLoadingUsage(true);
    try {
      const res = await api.get('/api/developer/usage');
      setUsages(res.data.usage || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleCreateKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      await api.post('/api/developer/keys/create', { name: newKeyName });
      setNewKeyName('');
      fetchKeys();
    } catch (e) {
      alert(t.developer?.createError || 'Lỗi khi tạo API Key.');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyString: string) => {
    if (!window.confirm(t.developer?.revokeConfirm || 'Bạn có chắc chắn muốn thu hồi khóa API này? Tất cả các ứng dụng đang sử dụng nó sẽ bị ngắt kết nối.')) return;
    try {
      await api.post('/api/developer/keys/delete', { api_key: keyString });
      fetchKeys();
    } catch (e) {
      alert(t.developer?.revokeError || 'Lỗi khi thu hồi API Key.');
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(txt);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const runTtsSandbox = async () => {
    if (!sandboxApiKey) {
      alert(t.developer?.keyNameRequired || 'Vui lòng tạo hoặc chọn một API Key trước.');
      return;
    }
    setLoadingSandboxAudio(true);
    setPlayingSandboxAudio(false);
    if (sandboxAudioRef.current) {
      sandboxAudioRef.current.pause();
      sandboxAudioRef.current = null;
    }

    try {
      const res = await api.post('/v1/audio/speech', {
        input: sandboxTtsText,
        speed: sandboxTtsSpeed
      }, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${sandboxApiKey}`
        }
      });

      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      sandboxAudioRef.current = audio;
      audio.playbackRate = sandboxTtsSpeed;
      audio.onplay = () => { audio.playbackRate = sandboxTtsSpeed; };
      audio.onplaying = () => { audio.playbackRate = sandboxTtsSpeed; };
      audio.play().catch(e => console.error('Sandbox playback failed:', e));
      setPlayingSandboxAudio(true);
      audio.onended = () => setPlayingSandboxAudio(false);
    } catch (e) {
      alert(t.reader?.ttsError || 'Lỗi phát âm thanh. Vui lòng thử lại sau.');
    } finally {
      setLoadingSandboxAudio(false);
    }
  };

  const runTranslationSandbox = async () => {
    if (!sandboxApiKey) {
      alert(t.developer?.keyNameRequired || 'Vui lòng tạo hoặc chọn một API Key trước.');
      return;
    }
    setTranslatingSandbox(true);
    setSandboxTransResult('');
    try {
      const res = await api.post('/api/v1/translate', {
        texts: sandboxTransText.split('\n'),
        mode: sandboxTransMode
      }, {
        headers: {
          'Authorization': `Bearer ${sandboxApiKey}`
        }
      });
      if (res.data && res.data.translations) {
        setSandboxTransResult(res.data.translations.join('\n'));
      }
    } catch (e) {
      alert(t.reader?.errorLoadingChapter || 'Lỗi tải nội dung.');
    } finally {
      setTranslatingSandbox(false);
    }
  };

  return {
    user,
    keys,
    vipModalOpen,
    setVipModalOpen,
    balance,
    newKeyName,
    setNewKeyName,
    loadingKeys,
    creatingKey,
    copiedKey,
    usages,
    loadingUsage,
    sandboxApiKey,
    sandboxTtsText,
    setSandboxTtsText,
    sandboxTtsSpeed,
    setSandboxTtsSpeed,
    playingSandboxAudio,
    loadingSandboxAudio,
    sandboxTransText,
    setSandboxTransText,
    sandboxTransMode,
    setSandboxTransMode,
    sandboxTransResult,
    translatingSandbox,
    fetchKeys,
    handleCreateKey,
    handleRevokeKey,
    handleCopy,
    runTtsSandbox,
    runTranslationSandbox,
  };
}
