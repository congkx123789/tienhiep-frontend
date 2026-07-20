import React, { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { ReaderSettingsProvider } from './contexts/ReaderSettingsContext';
import { BrowserProvider } from './contexts/BrowserContext';
import { isElectron } from './utils/electron';
import ErrorBoundary from './components/ErrorBoundary';

const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
const Router = (isElectron || isCapacitor) ? HashRouter : BrowserRouter;


// ── Lazy load all pages to eliminate upfront JS parse cost ──────────────────
// Each page is only downloaded & parsed when the user first navigates to it.
// Sects.jsx (83KB), Settings.jsx (90KB), LocalReader.jsx (76KB) etc. are huge
// and were previously blocking the initial Discover page load.
const Discover    = lazy(() => import('./pages/Discover'));
const Bookshelf   = lazy(() => import('./pages/Bookshelf'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const BookDetail  = lazy(() => import('./pages/BookDetail'));
const Reader      = lazy(() => import('./pages/Reader'));
const Developer   = lazy(() => import('./pages/Developer'));
const LocalReader = lazy(() => import('./pages/LocalReader'));
const Settings    = lazy(() => import('./pages/Settings'));
const AuthorDetail = lazy(() => import('./pages/AuthorDetail'));
const Messages    = lazy(() => import('./pages/Messages'));
const Sects       = lazy(() => import('./pages/Sects'));
const Downloads   = lazy(() => import('./pages/Downloads'));

// Minimal inline spinner — no extra component import needed
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0b0b14'
  }}>
    <div style={{
      width: 32, height: 32, border: '3px solid #1f1f3a',
      borderTopColor: '#7c3aed', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <ReaderSettingsProvider>
            <BrowserProvider>
              <Router>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"                         element={<Discover />} />
                    <Route path="/bookshelf"                element={<Bookshelf />} />
                    <Route path="/history"                  element={<HistoryPage />} />
                    <Route path="/developer"                element={<Developer />} />
                    <Route path="/downloads"                element={<Downloads />} />
                    <Route path="/settings"                 element={<Settings />} />
                    <Route path="/messages"                 element={<Messages />} />
                    <Route path="/sects"                    element={<Sects />} />
                    <Route path="/book/:bookId"             element={<BookDetail />} />
                    <Route path="/book/:bookId/read/:chapterIdx" element={<Reader />} />
                    <Route path="/author/:authorName"       element={<AuthorDetail />} />
                    <Route path="/embed"                    element={<LocalReader />} />
                  </Routes>
                </Suspense>
              </Router>
            </BrowserProvider>
          </ReaderSettingsProvider>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}
