import { useState, useEffect } from 'react';
import api from '../../../services';
import { localTranslator } from '../../../utils/localTranslator';
import { HeroBook } from './Discover.types';

const INITIAL_HERO_BOOKS: HeroBook[] = [
  {
    id: 1,
    title: "Hắc Ám Văn Minh",
    title_vietphrase: "Hắc Ám Văn Minh",
    author: "Cổ Hi",
    author_hanviet: "Cổ Hi",
    categories: "Huyền Huyễn, Mạt Thế, Khoa Huyễn",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60",
    description: "Khi bóng tối bao phủ địa cầu, nhân loại đối mặt với kỷ nguyên hắc ám tột cùng. Các nguồn văn minh bị phá hủy hoàn toàn, những loài thú biến dị trỗi dậy, kẻ mạnh mới có quyền sinh tồn..."
  },
  {
    id: 2,
    title: "Đấu Phá Thương Khung",
    title_vietphrase: "Đấu Phá Thương Khung",
    author: "Thiên Tàm Thổ Đậu",
    author_hanviet: "Thiên Tàm Thổ Đậu",
    categories: "Tiên Hiệp, Huyền Huyễn",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&auto=format&fit=crop&q=60",
    description: "Nơi đây là thế giới của Đấu Khí. Không có ma pháp hoa lệ, chỉ có đấu khí sinh sôi phát triển đến đỉnh phong! Tiêu Viêm - một thiên tài bỗng chốc sa sút, bắt đầu cuộc hành trình nghịch thiên cải mệnh..."
  },
  {
    id: 3,
    title: "Hộc Châu Phu Nhân",
    title_vietphrase: "Hộc Châu Phu Nhân",
    author: "Tiêu Như Sắt",
    author_hanviet: "Tiêu Như Sắt",
    categories: "Ngôn Tình, Cổ Đại, Nữ Sinh",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60",
    description: "Nơi Giao Châu xa xôi có bộ tộc mò ngọc trai quý hiếm. Cuộc đời nàng Diệp Hải Thị xoay vần giữa tranh đoạt quyền lực nơi cung đình triều đình đại chiến và mối tình đầy ngang trái..."
  }
];

export function useDiscoverHero() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroTranslateMode, setHeroTranslateMode] = useState<'original' | 'vi' | 'en'>('original');
  const [heroTranslatedDesc, setHeroTranslatedDesc] = useState('');
  const [heroTranslating, setHeroTranslating] = useState(false);
  const [heroBooks, setHeroBooks] = useState<HeroBook[]>(INITIAL_HERO_BOOKS);

  useEffect(() => {
    const syncHeroBooks = async () => {
      try {
        const synced = await Promise.all(heroBooks.map(async (item) => {
          try {
            const res = await api.get('/api/books', {
              params: { q: item.title, per_page: 1 }
            });
            if (res.data?.books?.length > 0) {
              const match = res.data.books[0];
              return {
                ...item,
                id: match.id,
                cover: match.cover || item.cover,
                title_vietphrase: match.title_vietphrase || item.title,
                author_hanviet: match.author_hanviet || item.author,
                urls: match.urls,
                categories: match.categories || item.categories
              };
            }
          } catch {}
          return item;
        }));
        setHeroBooks(synced);
      } catch (e) {
        console.error("Failed to sync hero books with database:", e);
      }
    };
    syncHeroBooks();
  }, []);

  useEffect(() => {
    setHeroTranslateMode('original');
    setHeroTranslatedDesc('');
  }, [heroIndex]);

  const translateHeroDescription = async (targetLang: 'original' | 'vi' | 'en') => {
    const activeHero = heroBooks[heroIndex];
    if (targetLang === 'original') {
      setHeroTranslateMode('original');
      return;
    }
    setHeroTranslating(true);
    try {
      const storedSettings = JSON.parse(localStorage.getItem('translationSettings') || '{}');
      const activeMode = storedSettings.mode || '4';
      try {
        const res = await api.post('/api/translate', {
          texts: [activeHero.description],
          mode: targetLang === 'en' ? 'en' : activeMode
        });
        if (res.data?.translations?.[0]) {
          setHeroTranslatedDesc(res.data.translations[0]);
          setHeroTranslateMode(targetLang);
        }
      } catch (err) {
        console.warn("[Discover] Switching to offline localTranslator:", err);
        await localTranslator.loadDictionaries();
        const transText = await localTranslator.translate(activeHero.description, 'cmlm');
        setHeroTranslatedDesc(transText);
        setHeroTranslateMode(targetLang);
      }
    } catch {
      alert("Hạn mức dịch máy chủ đã hết và bộ dịch offline gặp lỗi.");
    } finally {
      setHeroTranslating(false);
    }
  };

  const activeHero = heroBooks[heroIndex];
  const heroDescription = heroTranslateMode === 'original' 
    ? activeHero.description 
    : (heroTranslatedDesc || activeHero.description);

  return {
    heroIndex,
    setHeroIndex,
    heroBooks,
    activeHero,
    heroDescription,
    heroTranslating,
    translateHeroDescription
  };
}
