import React, { useState } from 'react';
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { LocalBook, LocalChapter } from '../LocalReader.types';
import { saveLocalBookToDB } from '../localDb';

interface LocalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (book: LocalBook) => void;
}

export const LocalImportModal: React.FC<LocalImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'auto' | 'paste'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileStats, setFileStats] = useState<{ chapterCount: number; size: string } | null>(null);
  const [extractedChapters, setExtractedChapters] = useState<LocalChapter[]>([]);

  if (!isOpen) return null;

  const parseChaptersFromText = (text: string): LocalChapter[] => {
    const lines = text.split('\n');
    const chapters: LocalChapter[] = [];
    let curTitle = 'Chương 1: Khởi đầu';
    let curContent: string[] = [];

    const chapterRegex = /^(chương|hồi|tiết|quyển|thứ|chapter|\d+[\.\:\s])/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (chapterRegex.test(trimmed) && trimmed.length < 80) {
        if (curContent.length > 0) {
          chapters.push({ title: curTitle, content: curContent.join('\n') });
          curContent = [];
        }
        curTitle = trimmed;
      } else {
        curContent.push(line);
      }
    }
    if (curContent.length > 0) {
      chapters.push({ title: curTitle, content: curContent.join('\n') });
    }
    return chapters.length > 0 ? chapters : [{ title: 'Toàn tập', content: text }];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setFileStats(null);

    try {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(baseName);
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      if (file.name.toLowerCase().endsWith('.epub')) {
        const zip = await JSZip.loadAsync(file);
        const htmlFiles = Object.keys(zip.files).filter(k => 
          (k.endsWith('.html') || k.endsWith('.xhtml') || k.endsWith('.htm')) && !k.includes('toc')
        );
        htmlFiles.sort();

        const chapters: LocalChapter[] = [];
        for (let i = 0; i < htmlFiles.length; i++) {
          const fname = htmlFiles[i];
          const htmlContent = await zip.files[fname].async('text');
          const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
          
          let chapterTitle = doc.querySelector('h1, h2, h3, title')?.textContent?.trim() || `Chương ${i + 1}`;
          if (chapterTitle.length > 80) chapterTitle = `Chương ${i + 1}`;
          
          const cleanText = (doc.body?.textContent || '').trim();
          if (cleanText.length > 30) {
            chapters.push({
              title: chapterTitle,
              content: cleanText
            });
          }
        }

        if (chapters.length === 0) {
          throw new Error('Không tìm thấy nội dung hợp lệ trong tệp EPUB.');
        }

        setExtractedChapters(chapters);
        setRawText('');
        setFileStats({ chapterCount: chapters.length, size: sizeStr });
      } else {
        const text = await file.text();
        const chapters = parseChaptersFromText(text);
        setExtractedChapters(chapters);
        setRawText(text.slice(0, 1000));
        setFileStats({ chapterCount: chapters.length, size: sizeStr });
      }
    } catch (err: any) {
      setError('Lỗi đọc tệp: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    let chaptersToSave = extractedChapters;
    if (chaptersToSave.length === 0 && rawText.trim()) {
      chaptersToSave = parseChaptersFromText(rawText);
    }
    if (chaptersToSave.length === 0) {
      setError('Chưa có nội dung sách hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const newBook: LocalBook = {
        id: 'local_' + Date.now(),
        title: title.trim(),
        author: author.trim() || 'Khuyết danh',
        coverUrl: coverUrl.trim() || undefined,
        chapters: chaptersToSave,
        totalChapters: chaptersToSave.length,
        addedAt: Date.now(),
        lastReadChapterIdx: 0
      };
      await saveLocalBookToDB(newBook);
      onSuccess(newBook);
      onClose();
    } catch (err: any) {
      setError('Lưu thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131324] border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" /> Nạp Sách Ngoại Tuyến (Offline)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs space-y-2">
          <label className="block text-slate-300 font-bold">Chọn tệp (.EPUB, .TXT):</label>
          <input
            type="file"
            accept=".epub,.txt"
            onChange={handleFileUpload}
            className="text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
          />
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Tên tác phẩm</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên tác phẩm..."
                className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Tác giả</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nhập tên tác giả..."
                className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {fileStats ? (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
              <span className="text-emerald-400 font-bold block">✓ Đã xử lý tệp thành công</span>
              <p className="text-slate-300 text-[11px]">
                Tổng số chương: <strong>{fileStats.chapterCount}</strong> • Dung lượng: <strong>{fileStats.size}</strong>
              </p>
              {rawText && (
                <div className="mt-2 text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded max-h-20 overflow-y-auto">
                  {rawText.slice(0, 300)}...
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nội dung tệp / Xem trước</label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500 resize-none font-mono text-[11px]"
                placeholder="Nhập hoặc dán nội dung truyện..."
                required={extractedChapters.length === 0}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition-all"
          >
            {loading ? 'Đang phân đoạn...' : 'Lưu Sách Vào Bộ Nhớ Máy'}
          </button>
        </form>
      </div>
    </div>
  );
};
