import React, { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { ReaderSettingsProvider } from './contexts/ReaderSettingsContext';
import { BrowserProvider } from './contexts/BrowserContext';
import { VipGateProvider } from './contexts/VipGateContext';
import { isElectron } from './utils/electron';
import { ErrorBoundary, VipGateModal, GlobalConfirmModal, VipUpsellModal, useVipListener } from './components';
import { BrowserOverlay } from './layouts/browser';
import FreeEventBanner from './components/common/FreeEventBanner';
import { APP_ROUTES } from './config/routes';

const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform && (window as any).Capacitor.isNativePlatform();
const Router = (isElectron || isCapacitor) ? HashRouter : BrowserRouter;

function VipRealtimeListener() {
  useVipListener();
  return <VipUpsellModal />;
}

// ── Lazy load all pages directly from domain compound modules ──────────────
const Discover     = lazy(() => import('./pages/discovery/discover'));
const BookDetail   = lazy(() => import('./pages/discovery/book-detail'));
const AuthorDetail = lazy(() => import('./pages/discovery/AuthorDetail'));
const Reader       = lazy(() => import('./pages/reader/online-reader'));
const LocalReader  = lazy(() => import('./pages/reader/local-reader'));
const Bookshelf    = lazy(() => import('./pages/user/bookshelf'));
const HistoryPage  = lazy(() => import('./pages/user/history'));
const Messages     = lazy(() => import('./pages/user/messages'));
const Sects        = lazy(() => import('./pages/portal/sects'));
const VipPage      = lazy(() => import('./pages/portal/VipPage'));
const Settings     = lazy(() => import('./pages/portal/settings'));
const Developer    = lazy(() => import('./pages/portal/developer'));
const Downloads    = lazy(() => import('./pages/portal/downloads'));

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
      <GlobalConfirmModal />
      <LangProvider>
        <AuthProvider>
          <VipGateProvider>
            <ReaderSettingsProvider>
              <BrowserProvider>
                <BrowserOverlay />
                <Router>
                  <FreeEventBanner />
                  <VipGateModal />
                  <VipRealtimeListener />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path={APP_ROUTES.HOME}                    element={<Discover />} />
                      <Route path={APP_ROUTES.BOOKSHELF}               element={<Bookshelf />} />
                      <Route path={APP_ROUTES.HISTORY}                 element={<HistoryPage />} />
                      <Route path={APP_ROUTES.DEVELOPER}               element={<Developer />} />
                      <Route path={APP_ROUTES.DOWNLOADS}               element={<Downloads />} />
                      <Route path={APP_ROUTES.SETTINGS}                element={<Settings />} />
                      <Route path={APP_ROUTES.MESSAGES}                element={<Messages />} />
                      <Route path={APP_ROUTES.SECTS}                   element={<Sects />} />
                      <Route path={APP_ROUTES.VIP}                     element={<VipPage />} />
                      <Route path={APP_ROUTES.BOOK_DETAIL()}           element={<BookDetail />} />
                      <Route path={APP_ROUTES.READER()}                element={<Reader />} />
                      <Route path={APP_ROUTES.AUTHOR()}                element={<AuthorDetail />} />
                      <Route path={APP_ROUTES.EMBED}                   element={<LocalReader />} />
                      <Route path="*"                                  element={<Discover />} />
                    </Routes>
                  </Suspense>
                </Router>
              </BrowserProvider>
            </ReaderSettingsProvider>
          </VipGateProvider>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}
