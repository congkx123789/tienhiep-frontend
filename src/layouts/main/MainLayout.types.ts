import React from 'react';

export interface MainLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  stats?: {
    total: number;
    duplicates: number;
  };
}

export interface NavItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
