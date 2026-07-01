import { createContext, useContext } from 'react';

export const BrowserContext = createContext(null);

export const useBrowser = () => useContext(BrowserContext);
