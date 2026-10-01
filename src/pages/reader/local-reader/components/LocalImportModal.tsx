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
  const [title, setTitle] = useState('Truyện Test Offline');
  const [author, setAuthor] = useState('Antigravity');
  const [coverUrl, setCoverUrl] = useState('');
  const [rawText, setRawText] = useState('Chương 1: Khởi Đầu\nĐây là nội dung chương 1.\nChương 2: Bước Ngoặt\nĐây là nội dung chương 2.');
  const [importMode, setImportMode] = useState<'auto' | 'paste'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const parseChaptersFromText = (text: string): LocalChapter[] => {
    const lines = text.split('\n');
    const chapters: LocalChapter[] = [];
    let curTitle = 'Chương 1: Khởi đầu';
    let curContent: string[] = [];

    const chapterRegex = /^(chương|hồi|tiết|quyển|thứ|chapter|\d+[\.\:\s])/i;

    for (const line of lines) {
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

    try {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(baseName);

      if (file.name.endsWith('.epub')) {
        const zip = await JSZip.loadAsync(file);
        let combinedText = '';
        const htmlFiles = Object.keys(zip.files).filter(k => k.endsWith('.html') || k.endsWith('.xhtml') || k.endsWith('.htm'));
        htmlFiles.sort();

        for (const fname of htmlFiles) {
          const htmlContent = await zip.files[fname].async('text');
          const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
          const cleanText = doc.body.textContent || '';
          if (cleanText.trim()) combinedText += cleanText + '\n\n';
        }
        setRawText(combinedText);
      } else {
        const text = await file.text();
        setRawText(text);
      }
    } catch (err: any) {
      setError('Lỗi đọc tệp: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;
    setLoading(true);
    try {
      const chapters = parseChaptersFromText(rawText);
      const newBook: LocalBook = {
        id: 'local_' + Date.now(),
        title: title.trim(),
        author: author.trim() || 'Khuyết danh',
        coverUrl: coverUrl.trim() || undefined,
        chapters,
        totalChapters: chapters.length,
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
                className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Nội dung tệp / Xem trước</label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0b0b14] border border-[#1f1f3a] text-white outline-none focus:border-purple-500 resize-none font-mono text-[11px]"
              required
            />
          </div>

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
