export const isElectron = typeof window !== 'undefined' && 
  (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1 || !!window.electron);

export const getElectronAPI = () => {
  return isElectron ? window.electron : null;
};
