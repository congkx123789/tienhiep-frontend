import React, { useState, useEffect } from 'react';
import { useReaderSettings } from '../contexts/ReaderSettingsContext';
import { ArrowLeft, Settings, Menu, Minus, Square, X, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReaderSettingsPanel } from './reader/ReaderSettingsPanel';
import { ReaderChaptersSidebar } from './reader/ReaderChaptersSidebar';

export default function ReaderLayout({ children, bookTitle, currentChapter, chaptersList, onSelectChapter }) {
  const { 
    theme, setTheme, fontSize, decreaseFontSize, increaseFontSize, 
    fontFamily, setFontFamily, lineHeight, setLineHeight 
  } = useReaderSettings();
  const navigate = useNavigate();
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  const [overlayVisible, setOverlayVisible] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isElectron) return;
    window.electron.isMaximized().then(setIsWindowMaximized);
    return window.electron.onWindowStateChange(setIsWindowMaximized);
  }, [isElectron]);

  useEffect(() => {
    const handleScreenClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('.reader-overlay') || (e.target as HTMLElement)?.closest('.reader-sidebar')) {
        return;
      }
      if (showSettingsPanel) {
        setShowSettingsPanel(false);
        return;
      }
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 0) return;

      const x = e.clientX;
      const width = window.innerWidth;
      if (x > width * 0.3 && x < width * 0.7) {
        setOverlayVisible(prev => !prev);
      }
    };

    window.addEventListener('click', handleScreenClick, { passive: true });
    return () => window.removeEventListener('click', handleScreenClick);
  }, [showSettingsPanel]);

  return (
    <div className={`min-h-screen transition-colors duration-300 relative theme-${theme} select-none`}>
      <div 
        className={`reader-overlay fixed top-0 left-0 right-0 z-40 bg-[#0f0f1a]/95 border-b border-[#2d2d6b]/50 p-4 flex items-center justify-between text-slate-100 transition-all duration-300 ${
          overlayVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{
          ...(isElectron ? { WebkitAppRegion: 'drag', paddingRight: '144px' } : {})
        }}
      >
        <div className="flex items-center gap-3" style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}>
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h4 className="font-bold text-sm truncate">{bookTitle || 'Đang tải...'}</h4>
            <p className="text-slate-400 text-xs truncate mt-0.5">{currentChapter || 'Chương --'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2" style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSettingsPanel(prev => !prev); }} 
            className={`p-2 rounded-lg transition-colors ${showSettingsPanel ? 'bg-brand-500/25 text-brand-300' : 'hover:bg-white/10 text-slate-300'}`}
            title="Cài đặt giao diện"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Danh sách chương"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {isElectron && (
          <div className="absolute right-0 top-0 bottom-0 flex items-stretch h-full" style={{ WebkitAppRegion: 'no-drag' }}>
            <button
              onClick={() => window.electron.minimize()}
              className="flex items-center justify-center w-12 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Thu nhỏ"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.electron.maximize()}
              className="flex items-center justify-center w-12 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isWindowMaximized ? "Thu nhỏ cửa sổ" : "Phóng to"}
            >
              {isWindowMaximized ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="8" width="12" height="12" rx="1.5" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => window.electron.close()}
              className="flex items-center justify-center w-12 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Reader Settings Panel */}
      <ReaderSettingsPanel
        showSettingsPanel={showSettingsPanel}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        decreaseFontSize={decreaseFontSize}
        increaseFontSize={increaseFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
      />

      {/* Chapters Sidebar Drawer */}
      <ReaderChaptersSidebar
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chaptersList={chaptersList}
        onSelectChapter={onSelectChapter}
      />

      {/* Text Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-8 min-h-[calc(100vh-280px)]">
        {children}
      </div>

      {/* Floating Home & End Quick Navigation Buttons */}
      <div className="fixed right-3 bottom-20 z-30 flex flex-col gap-1.5 select-none pointer-events-auto">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-purple-600/80 text-slate-300 hover:text-white border border-white/10 hover:border-purple-400/50 shadow-lg backdrop-blur-md flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Cuộn lên đầu chương (Phím Home ⤒)"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-purple-600/80 text-slate-300 hover:text-white border border-white/10 hover:border-purple-400/50 shadow-lg backdrop-blur-md flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Cuộn xuống cuối chương (Phím End ⤓)"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
