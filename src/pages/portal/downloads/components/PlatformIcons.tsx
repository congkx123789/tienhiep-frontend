import React from 'react';

export const ChromeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);

export const WindowsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12L3 12" strokeWidth="1.5" />
    <path d="M12 2L12 22" strokeWidth="1.5" />
    <path d="M3 5.41L10.33 4.41V11.58H3V5.41Z" fill="currentColor" opacity="0.2" />
    <path d="M11.67 4.23L21 3V11.58H11.67V4.23Z" fill="currentColor" opacity="0.2" />
    <path d="M3 12.42H10.33V19.59L3 18.59V12.42Z" fill="currentColor" opacity="0.2" />
    <path d="M11.67 12.42H21V21L11.67 19.77V12.42Z" fill="currentColor" opacity="0.2" />
    <path d="M3 5.41L10.33 4.41V11.58H3V5.41ZM11.67 4.23L21 3V11.58H11.67V4.23ZM3 12.42H10.33V19.59L3 18.59V12.42ZM11.67 12.42H21V21L11.67 19.77V12.42Z" />
  </svg>
);

export const AndroidIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 16v-6a7 7 0 0 1 14 0v6" />
    <path d="M6 20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3H6v3z" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <path d="M7 4l2 3" />
    <path d="M17 4l-2 3" />
    <path d="M3 12v4" />
    <path d="M21 12v4" />
  </svg>
);

export const AppleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.9.04-2 .6-2.65 1.36-.56.65-.99 1.7-1.01 2.76 1 .08 2.04-.51 2.65-1.25z"/>
  </svg>
);
