import React from 'react';

interface FlagIconProps {
  langCode: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ langCode }) => {
  if (langCode === 'vi') {
    return (
      <svg className="w-4 h-3 rounded-sm inline-block object-cover shadow-sm mr-1 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#da251d" />
        <polygon points="15,4 16.2,8.5 20.7,8.5 17.1,11.2 18.3,15.7 15,13 11.7,15.7 12.9,11.2 9.3,8.5 13.8,8.5" fill="#ffff00" />
      </svg>
    );
  }
  if (langCode === 'en') {
    return (
      <svg className="w-4 h-3 rounded-sm inline-block object-cover shadow-sm mr-1 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#b22234" />
        <rect y="1.54" width="30" height="1.54" fill="#ffffff" />
        <rect y="4.62" width="30" height="1.54" fill="#ffffff" />
        <rect y="7.7" width="30" height="1.54" fill="#ffffff" />
        <rect y="10.78" width="30" height="1.54" fill="#ffffff" />
        <rect y="13.86" width="30" height="1.54" fill="#ffffff" />
        <rect y="16.94" width="30" height="1.54" fill="#ffffff" />
        <rect width="13" height="10.8" fill="#3c3b6e" />
        <circle cx="2.5" cy="2.5" r="0.6" fill="#ffffff" />
        <circle cx="6.5" cy="2.5" r="0.6" fill="#ffffff" />
        <circle cx="10.5" cy="2.5" r="0.6" fill="#ffffff" />
        <circle cx="4.5" cy="5.5" r="0.6" fill="#ffffff" />
        <circle cx="8.5" cy="5.5" r="0.6" fill="#ffffff" />
        <circle cx="2.5" cy="8.5" r="0.6" fill="#ffffff" />
        <circle cx="6.5" cy="8.5" r="0.6" fill="#ffffff" />
        <circle cx="10.5" cy="8.5" r="0.6" fill="#ffffff" />
      </svg>
    );
  }
  if (langCode === 'zh') {
    return (
      <svg className="w-4 h-3 rounded-sm inline-block object-cover shadow-sm mr-1 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#de2110" />
        <polygon points="5,5 6.2,9 9.8,7.8 7.3,11 8.5,15 5.5,12.5 2.5,15 3.7,11 1.2,7.8 4.8,9" fill="#ffde00" />
      </svg>
    );
  }
  return null;
};
