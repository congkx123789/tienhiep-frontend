import React from 'react';
import { BrowserTab } from '../../contexts/BrowserContext';
import { TabViewportItem } from './TabViewportItem';

export interface BrowserViewportsProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onNavigate: (url: string) => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onTabLoaded?: (tabId: string) => void;
  onToggleDirectMode?: (tabId: string) => void;
  onReloadTab?: (tabId: string) => void;
}

export const BrowserViewports: React.FC<BrowserViewportsProps> = ({
  tabs,
  activeTabId,
  onNavigate,
  onOpenBookmarks,
  bookmarksCount,
  onTabLoaded,
  onToggleDirectMode,
  onReloadTab
}) => {
  return (
    <div className="flex-1 relative w-full min-h-0 overflow-hidden bg-slate-950">
      {tabs.map((tab) => (
        <TabViewportItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onNavigate={onNavigate}
          onOpenBookmarks={onOpenBookmarks}
          bookmarksCount={bookmarksCount}
          onTabLoaded={onTabLoaded}
          onToggleDirectMode={onToggleDirectMode}
          onReloadTab={onReloadTab}
        />
      ))}
    </div>
  );
};
