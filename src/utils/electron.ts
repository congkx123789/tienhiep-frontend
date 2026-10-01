export const isElectron: boolean =
  typeof window !== 'undefined' &&
  (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1 || Boolean((window as any).electron));

export const getElectronAPI = (): any => {
  return isElectron ? (window as any).electron : null;
};
